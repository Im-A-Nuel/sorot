import { faq } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PlusIcon } from "@/components/ui/Icons";

export function Faq() {
  return (
    <section id="faq" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={faq.eyebrow} title={faq.title} />
          </Reveal>

          <ul className="border-t border-ink/15">
            {faq.items.map((item) => (
              <li key={item.q} className="border-b border-ink/15">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink transition-transform duration-200 group-open:rotate-45">
                      <PlusIcon />
                    </span>
                  </summary>
                  <p className="max-w-[560px] pb-6 text-[15.5px] leading-relaxed text-muted">
                    {item.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
