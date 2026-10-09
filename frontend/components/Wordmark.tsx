import { content } from "@/lib/content";
import { u } from "@/lib/units";

export function Wordmark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute select-none whitespace-nowrap font-medium leading-none text-ink"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        bottom: u(-140),
        fontSize: u(400),
        letterSpacing: "-0.03em",
      }}
    >
      {content.brand}
    </div>
  );
}
