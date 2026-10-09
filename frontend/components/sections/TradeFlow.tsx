import { trade } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TradePopup } from "./TradePopup";

type Callout = { title: string; body: string };

function Callouts({ items, start, align }: { items: readonly Callout[]; start: number; align: "left" | "right" }) {
  return (
    <ol className={`flex flex-col gap-8 ${align === "right" ? "lg:text-right" : ""}`}>
      {items.map((item, i) => (
        <li key={item.title}>
          <span className="text-[14px] font-semibold tabular-nums text-brand-blue">
            0{start + i}
          </span>
          <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.015em]">{item.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function TradeFlow() {
  return (
    <section id="trade" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading align="center" eyebrow={trade.eyebrow} title={trade.title} body={trade.body} />
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_340px_1fr] lg:gap-14">
          <div className="order-2 lg:order-1">
            <Callouts items={trade.left} start={1} align="right" />
          </div>
          <Reveal className="order-1 lg:order-2">
            <TradePopup />
          </Reveal>
          <div className="order-3">
            <Callouts items={trade.right} start={3} align="left" />
          </div>
        </div>
      </div>
    </section>
  );
}
