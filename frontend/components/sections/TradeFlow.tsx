import { trade } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TradePopup } from "./TradePopup";

export function TradeFlow() {
  return (
    <section id="trade" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[380px_1fr] lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <TradePopup />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <SectionHeading eyebrow={trade.eyebrow} title={trade.title} body={trade.body} />
            </Reveal>

            <ol className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {trade.steps.map((step, i) => (
                <li key={step.title}>
                  <Reveal delay={i * 80}>
                    <div className="border-t border-ink/12 pt-5">
                      <span className="text-[13px] font-medium text-brand-blue">
                        0{i + 1}
                      </span>
                      <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.015em]">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink/65">{step.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
