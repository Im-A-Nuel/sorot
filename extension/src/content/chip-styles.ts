/** Styles live inside the chip's shadow root so X's CSS cannot reach them and ours cannot leak out. */
export const chipCss = `
:host {
  all: initial;
  display: block;
  margin: 10px 0 4px;
  font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; }
.chip {
  --ink: #0b0f1a;
  --muted: #4f5563;
  --card: #ffffff;
  --line: rgba(22, 38, 240, 0.35);
  --blue: #1626f0;
  --see: #ffffff;
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--card);
  color: var(--ink);
}
.chip[data-theme="dark"] {
  --ink: #f4f5fb;
  --muted: #b4b9c9;
  --card: #0b0f1a;
  --line: rgba(154, 166, 255, 0.5);
  --blue: #3d4cff;
  --see: #0b0f1a;
}
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
button:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.main { text-align: left; min-width: 0; flex: 1; border-radius: 8px; }
.title { display: block; font-size: 14px; font-weight: 700; line-height: 1.3; }
.brand { display: block; margin-top: 3px; font-size: 12px; color: var(--muted); }
.demo {
  flex: none;
  margin-top: 1px;
  padding: 2px 7px;
  border: 1px solid var(--muted);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}
.odds { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.odds button, .see {
  min-height: 36px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}
.yes { background: var(--blue); color: #fff; }
.no { background: #0b0f1a; color: #fff; border: 1px solid rgba(255, 255, 255, 0.25); }
.yes:hover, .no:hover { filter: brightness(1.12); }
.see {
  grid-column: 1 / -1;
  border: 1px solid var(--muted);
  background: var(--see);
  color: var(--ink);
}
.see:hover { background: rgba(127, 127, 127, 0.12); }
`;
