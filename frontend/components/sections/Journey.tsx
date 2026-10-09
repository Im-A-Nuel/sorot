import { journey } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Journey() {
  return (
    <section id="path" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading eyebrow={journey.eyebrow} title={journey.title} body={journey.body} />
        </Reveal>

        <ol className="mt-12 grid gap-x-8 gap-y-10 border-t border-ink/25 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {journey.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col">
              <span className="text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-brand-blue">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[20px] font-semibold leading-snug tracking-[-0.015em]">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
              {"link" in step && (
                <a
                  href={step.link.href}
                  className="mt-4 inline-flex min-h-11 items-center self-start font-semibold text-brand-blue underline underline-offset-4"
                >
                  {step.link.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
