import { problem } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Problem() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow={problem.eyebrow} title={problem.title} body={problem.body} />
          </Reveal>
          <ol className="self-end border-t border-ink/15">
            {problem.points.map((point, i) => (
              <li
                key={point.title}
                className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-ink/15 py-6"
              >
                <span className="pt-1 text-[14px] font-semibold tabular-nums text-brand-blue">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="text-[19px] font-semibold tracking-[-0.015em]">{point.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{point.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
