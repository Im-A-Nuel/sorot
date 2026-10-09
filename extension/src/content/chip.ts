import type { MatchedMarket, Side } from "../shared/types.ts";
import { chipCss } from "./chip-styles.ts";

export const CHIP_ATTR = "data-sorot-chip";

type OnOpen = (market: MatchedMarket, side?: Side) => void;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // textContent only. Backend strings are never parsed as HTML.
  if (text !== undefined) node.textContent = text;
  return node;
}

/** X's dark themes (Dim, Lights out) have a dark body background. */
function isDarkPage(): boolean {
  const bg = getComputedStyle(document.body).backgroundColor;
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg);
  if (!m) return false;
  const luminance = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
  return luminance < 0.5;
}

function oddsButton(side: Side, label: string, market: MatchedMarket, onOpen: OnOpen): HTMLButtonElement {
  const btn = el("button", side, label);
  btn.type = "button";
  btn.setAttribute("aria-label", `${side.toUpperCase()} at ${label.split(" ")[1]} on ${market.title}. Opens the trade window.`);
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen(market, side);
  });
  return btn;
}

/** Builds the odds chip for one tweet. The host element carries the tweet id so recycled DOM can be detected. */
export function createChip(tweetId: string, market: MatchedMarket, onOpen: OnOpen): HTMLElement {
  const host = document.createElement("div");
  host.setAttribute(CHIP_ATTR, tweetId);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = chipCss;

  const chip = el("div", "chip");
  chip.dataset.theme = isDarkPage() ? "dark" : "light";
  chip.setAttribute("role", "group");
  chip.setAttribute("aria-label", "Panta market odds");

  const head = el("div", "head");
  const main = el("button", "main");
  main.type = "button";
  main.setAttribute("aria-label", `Open Panta market: ${market.title}`);
  main.append(el("span", "title", market.title), el("span", "brand", "Powered by Panta"));
  main.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen(market);
  });
  head.append(main);
  if (market.demo) head.append(el("span", "demo", "Demo"));

  const odds = el("div", "odds");
  if (market.yesPrice !== null && market.noPrice !== null) {
    odds.append(
      oddsButton("yes", `YES ${market.yesPrice}`, market, onOpen),
      oddsButton("no", `NO ${market.noPrice}`, market, onOpen),
    );
  } else {
    // A missing price is never replaced by a guess.
    const see = el("button", "see", "see odds");
    see.type = "button";
    see.setAttribute("aria-label", `See odds for ${market.title}. Opens the trade window.`);
    see.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onOpen(market);
    });
    odds.append(see);
  }

  chip.append(head, odds);
  root.append(style, chip);
  return host;
}
