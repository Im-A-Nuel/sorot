import { MAX_BATCH } from "../config.ts";
import {
  DEFAULT_SETTINGS,
  type MatchedMarket,
  type MatchResponse,
  type Message,
  type Settings,
  type Side,
  type TweetInput,
} from "../shared/types.ts";
import { CHIP_ATTR, createChip } from "./chip.ts";
import { chipAnchor, findTweetArticles, readTweet } from "./dom.ts";

/**
 * Watches the X timeline and puts a Panta odds chip under tweets that match a market.
 * Rules: never block scrolling (debounce 300 ms, work in idle time), never send the same tweet twice in a session,
 * and show nothing unless the backend returns a verified match.
 */

const DEBOUNCE_MS = 300;
const RETRY_AFTER_MS = 30_000;

/** Tweets already sent this session. A failed send is released after a delay. */
const sent = new Set<string>();
/** Match results by tweet id. X recycles DOM nodes, so chips are redrawn from here without asking again. */
const results = new Map<string, MatchedMarket | null>();
const queue = new Map<string, TweetInput>();

let enabled = DEFAULT_SETTINGS.enabled;
let scanTimer: ReturnType<typeof setTimeout> | undefined;
let flushScheduled = false;

function send(message: Message): Promise<unknown> {
  try {
    return chrome.runtime.sendMessage(message);
  } catch {
    // The extension was reloaded or updated while this page was open.
    return Promise.resolve(undefined);
  }
}

function openTrade(tweetId: string, market: MatchedMarket, side?: Side): void {
  void send({ type: "OPEN_TRADE", marketId: market.marketId, tweetId, side });
}

function removeChips(root: ParentNode = document): void {
  root.querySelectorAll(`[${CHIP_ATTR}]`).forEach((n) => n.remove());
}

/** Draws a chip for a known match, replacing a stale one left on a recycled article. */
function ensureChip(article: HTMLElement, tweetId: string, market: MatchedMarket): void {
  const existing = article.querySelector(`[${CHIP_ATTR}]`);
  if (existing?.getAttribute(CHIP_ATTR) === tweetId) return;
  existing?.remove();

  const anchor = chipAnchor(article);
  if (!anchor) return;
  anchor.after(createChip(tweetId, market, (m, side) => openTrade(tweetId, m, side)));
}

function clearStaleChip(article: HTMLElement, tweetId: string | null): void {
  const existing = article.querySelector(`[${CHIP_ATTR}]`);
  if (existing && existing.getAttribute(CHIP_ATTR) !== tweetId) existing.remove();
}

function scan(): void {
  if (!enabled) return;

  for (const article of findTweetArticles(document)) {
    const tweet = readTweet(article);
    clearStaleChip(article, tweet?.tweetId ?? null);
    if (!tweet) continue;

    if (results.has(tweet.tweetId)) {
      const match = results.get(tweet.tweetId) ?? null;
      if (match) ensureChip(article, tweet.tweetId, match);
      continue;
    }
    if (!sent.has(tweet.tweetId)) {
      sent.add(tweet.tweetId);
      queue.set(tweet.tweetId, tweet);
    }
  }

  scheduleFlush();
}

function scheduleFlush(): void {
  if (queue.size === 0 || flushScheduled) return;
  flushScheduled = true;
  const run = () => {
    flushScheduled = false;
    void flush();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 800 });
  else setTimeout(run, 0);
}

async function flush(): Promise<void> {
  const batch = [...queue.values()].slice(0, MAX_BATCH);
  batch.forEach((t) => queue.delete(t.tweetId));
  if (batch.length === 0) return;

  const response = (await send({ type: "MATCH_REQUEST", tweets: batch })) as MatchResponse | undefined;

  if (response?.ok) {
    for (const r of response.results) results.set(r.tweetId, r.match);
    scan();
  } else {
    // Let these tweets be tried again later instead of losing them for the whole session.
    for (const t of batch) setTimeout(() => sent.delete(t.tweetId), RETRY_AFTER_MS);
  }

  if (queue.size > 0) scheduleFlush();
}

function scheduleScan(): void {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(scan, { timeout: 500 });
    else scan();
  }, DEBOUNCE_MS);
}

const observer = new MutationObserver(scheduleScan);

function start(): void {
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleScan();
}

function stop(): void {
  observer.disconnect();
  clearTimeout(scanTimer);
  // Tweets still waiting in the queue were never sent, so release them for when chips are turned back on.
  for (const id of queue.keys()) sent.delete(id);
  queue.clear();
  removeChips();
}

function applySettings(next: Settings): void {
  const was = enabled;
  enabled = next.enabled;
  if (enabled && !was) start();
  if (!enabled && was) stop();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    applySettings({ ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<Settings> | undefined) });
  }
});

chrome.storage.local.get("settings").then((stored) => {
  enabled = { ...DEFAULT_SETTINGS, ...(stored.settings as Partial<Settings> | undefined) }.enabled;
  if (enabled) start();
});
