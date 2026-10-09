import { features } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ChipPreview } from "./ChipPreview";

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading eyebrow={features.eyebrow} title={features.title} />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="surface self-start p-7 md:p-9">
            <h3 className="flex flex-wrap items-center gap-3 text-[28px] font-semibold tracking-[-0.025em]">
              {features.flagship.title}
              <span className="rounded-md bg-ink/10 px-2 py-0.5 text-[12px] font-medium tracking-normal text-muted">
                {features.flagship.status}
              </span>
            </h3>
            <p className="mt-3 max-w-[460px] text-[15.5px] leading-relaxed text-muted">
              {features.flagship.body}
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <figure className="flex flex-col">
                <ChipPreview title="Will SOL close above $300 on Oct 31?" yes="0.62" no="0.38" />
                <figcaption className="mt-2 text-[13px] text-subtle">Price from the API</figcaption>
              </figure>
              <figure className="flex flex-col">
                <ChipPreview title="Will ETH close above $5,000 on Dec 31?" yes={null} no={null} />
                <figcaption className="mt-2 text-[13px] text-subtle">Price missing</figcaption>
              </figure>
            </div>
            <p className="mt-5 text-[13px] text-subtle">Illustrative values.</p>
          </div>

          <ul className="border-t border-ink/15">
            {features.items.map((item) => (
              <li key={item.title} className="border-b border-ink/15 py-5">
                <h3 className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.01em]">
                  {item.title}
                  <span className="rounded-md bg-ink/10 px-2 py-0.5 text-[12px] font-medium text-muted">
                    {item.status}
                  </span>
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
