import { content } from "@/lib/content";

export function Wordmark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute select-none whitespace-nowrap font-medium leading-none text-ink"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(var(--wm) * var(--wm-drop))",
        fontSize: "var(--wm)",
        letterSpacing: "-0.03em",
      }}
    >
      {content.brand}
    </div>
  );
}
