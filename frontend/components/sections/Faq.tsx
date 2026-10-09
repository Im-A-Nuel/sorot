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

          <ul className="flex flex-col gap-3">
            {faq.items.map((item, i) => (
              <li key={item.q}>
                <Reveal delay={(i % 4) * 60}>
                  <details className="faq card group !rounded-[22px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[16.5px] font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-ink transition-transform duration-300 group-open:rotate-45">
                        <PlusIcon className="!size-4" />
                      </span>
                    </summary>
                    <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink/65">{item.a}</p>
                  </details>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
