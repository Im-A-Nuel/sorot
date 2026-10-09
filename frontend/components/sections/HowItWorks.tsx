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

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[1fr_470px] lg:gap-16">
          <ol className="relative flex flex-col gap-4">
            {how.steps.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 80}>
                  <div className="card flex gap-5 p-6">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5b69f0,#1626f0)] text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(22,38,240,0.7)]">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[20px] font-semibold tracking-[-0.015em]">{step.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink/65">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal delay={120} className="lg:sticky lg:top-8">
            <TweetPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
