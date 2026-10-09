import { problem } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Problem() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={problem.eyebrow} title={problem.title} body={problem.body} />
          </Reveal>
          <ul className="flex flex-col gap-4">
            {problem.points.map((point, i) => (
              <li key={point.title}>
                <Reveal delay={i * 90}>
                  <div className="card flex gap-5 p-6">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[18px] font-semibold tracking-[-0.01em]">{point.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink/65">{point.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
