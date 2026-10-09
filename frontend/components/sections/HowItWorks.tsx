import { how } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TweetPreview } from "./TweetPreview";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading eyebrow={how.eyebrow} title={how.title} body={how.body} />
        </Reveal>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[470px_1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-8">
            <TweetPreview />
          </Reveal>

          <ol className="lg:pt-3">
            {how.steps.map((step, i) => (
              <li
                key={step.title}
                className="relative grid grid-cols-[3rem_1fr] gap-4 pb-10 last:pb-0"
              >
                {i < how.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[1.05rem] top-9 h-[calc(100%-2.25rem)] w-px bg-ink/20"
                  />
                )}
                <span className="relative flex size-9 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-2 max-w-[460px] text-[15.5px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
