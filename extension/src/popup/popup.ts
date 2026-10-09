import { API_URL, APP_URL, DEMO_MODE } from "../config.ts";
import { DEFAULT_SETTINGS, type Settings } from "../shared/types.ts";

const toggle = document.getElementById("enabled") as HTMLInputElement;
const mode = document.getElementById("mode") as HTMLParagraphElement;
const positions = document.getElementById("positions") as HTMLAnchorElement;

async function load(): Promise<Settings> {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings as Partial<Settings> | undefined) };
}

load().then((settings) => {
  toggle.checked = settings.enabled;
});

toggle.addEventListener("change", async () => {
  const settings = { ...(await load()), enabled: toggle.checked };
  await chrome.storage.local.set({ settings });
});

mode.textContent = DEMO_MODE
  ? "Demo matching. No backend is connected, so chips come from a few labeled fixtures."
  : `Matching through ${new URL(API_URL).host}.`;

const positionsUrl = new URL("/positions", APP_URL).toString();
positions.href = positionsUrl;
positions.addEventListener("click", (e) => {
  e.preventDefault();
  void chrome.tabs.create({ url: positionsUrl });
  window.close();
});
