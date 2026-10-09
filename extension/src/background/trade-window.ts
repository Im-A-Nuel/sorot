import { APP_URL, TRADE_WINDOW } from "../config.ts";
import type { Side } from "../shared/types.ts";

let windowId: number | null = null;

export function tradeUrl(marketId: string, tweetId: string, side?: Side): string {
  const url = new URL(`/t/${encodeURIComponent(marketId)}`, APP_URL);
  url.searchParams.set("tweet", tweetId);
  if (side) url.searchParams.set("side", side);
  return url.toString();
}

/**
 * Phantom does not inject into extension pages, so all signing happens on the hosted trade page.
 * It opens as a small popup window, reused if it is still open.
 */
export async function openTrade(marketId: string, tweetId: string, side?: Side): Promise<void> {
  const url = tradeUrl(marketId, tweetId, side);

  if (windowId !== null) {
    try {
      const existing = await chrome.windows.get(windowId, { populate: true });
      const tabId = existing.tabs?.[0]?.id;
      if (tabId !== undefined) {
        await chrome.tabs.update(tabId, { url });
        await chrome.windows.update(windowId, { focused: true });
        return;
      }
    } catch {
      // The window was closed. Open a new one below.
    }
    windowId = null;
  }

  const created = await chrome.windows.create({
    url,
    type: "popup",
    width: TRADE_WINDOW.width,
    height: TRADE_WINDOW.height,
  });
  windowId = created?.id ?? null;
}

chrome.windows.onRemoved.addListener((id) => {
  if (id === windowId) windowId = null;
});
