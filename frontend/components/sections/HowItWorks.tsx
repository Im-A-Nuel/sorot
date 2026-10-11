import { how } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ChipArt, InstallArt, ScrollArt, SignArt } from "@/components/illustrations/StepArt";
import { TweetPreview } from "./TweetPreview";

const ART = [InstallArt, ScrollArt, ChipArt, SignArt] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[470px_1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-8">
            <TweetPreview />
          </Reveal>

          <div>
            <Reveal>
              <SectionHeading eyebrow={how.eyebrow} title={how.title} body={how.body} />
            </Reveal>

            <ol className="mt-10 border-t border-ink/15">
              {how.steps.map((step, i) => {
                const Art = ART[i];
                return (
                  <li
                    key={step.title}
                    className="grid grid-cols-[64px_1fr] items-center gap-5 border-b border-ink/15 py-5"
                  >
                    <Art className="size-16" />
                    <div>
                      <h3 className="text-[19px] font-semibold tracking-[-0.015em]">
                        <span className="mr-2 tabular-nums text-brand-blue">{i + 1}</span>
                        {step.title}
                      </h3>
                      <p className="mt-1 max-w-[440px] text-[15px] leading-relaxed text-muted">
                        {step.body}
                      </p>
                      {"link" in step && (
                        <a
                          href={step.link.href}
                          className="-mb-2 mt-0.5 inline-flex min-h-11 items-center text-[14.5px] font-semibold text-brand-blue underline underline-offset-4"
                        >
                          {step.link.label}
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
