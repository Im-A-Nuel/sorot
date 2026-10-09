import type { TweetInput } from "../shared/types.ts";
import { TWEET_ID_RE } from "../shared/validate.ts";

/**
 * Reads tweets from the X timeline. X changes its markup often, so every lookup selects by data-testid first
 * and falls back to the plain article structure.
 */

const STATUS_RE = /\/status\/(\d{1,25})(?:[/?#]|$)/;

export function findTweetArticles(root: ParentNode): HTMLElement[] {
  const byTestId = root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]');
  if (byTestId.length > 0) return [...byTestId];
  return [...root.querySelectorAll<HTMLElement>("article")];
}

function tweetTextElement(article: HTMLElement): HTMLElement | null {
  return article.querySelector<HTMLElement>('[data-testid="tweetText"]');
}

/** The tweet's own permalink is the status link that wraps its timestamp. */
function tweetIdOf(article: HTMLElement): string | null {
  const stamped = article.querySelector<HTMLAnchorElement>('a[href*="/status/"] time');
  const link = stamped?.closest<HTMLAnchorElement>("a") ?? article.querySelector<HTMLAnchorElement>('a[href*="/status/"]');
  const id = link ? STATUS_RE.exec(link.getAttribute("href") ?? "")?.[1] : undefined;
  return id && TWEET_ID_RE.test(id) ? id : null;
}

/** Promoted tweets are ads, not conversation. Never put a market chip on them. */
function isPromoted(article: HTMLElement): boolean {
  return article.querySelector('[data-testid="placementTracking"]') !== null;
}

export function readTweet(article: HTMLElement): TweetInput | null {
  if (isPromoted(article)) return null;
  const textEl = tweetTextElement(article);
  const tweetId = tweetIdOf(article);
  if (!textEl || !tweetId) return null;

  const text = (textEl.textContent ?? "").trim();
  if (text === "") return null;

  return { tweetId, text, lang: textEl.getAttribute("lang") ?? document.documentElement.lang ?? "und" };
}

/**
 * Where the chip goes: right after the tweet body (text, media, quote) and before the action bar.
 * Returns the element to insert after, or null when the layout is not recognized.
 */
export function chipAnchor(article: HTMLElement): HTMLElement | null {
  const textEl = tweetTextElement(article);
  if (!textEl) return null;

  const actions = article.querySelector<HTMLElement>('[role="group"]');
  let node: HTMLElement = textEl;
  if (actions) {
    while (node.parentElement && node.parentElement !== article && !node.parentElement.contains(actions)) {
      node = node.parentElement;
    }
    // node is now the child of the first ancestor that also contains the action bar.
    if (node.parentElement && node !== actions && !node.contains(actions)) return node;
  }
  return textEl.parentElement ?? textEl;
}
