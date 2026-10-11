import { matching } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MatchFunnel } from "@/components/illustrations/MatchFunnel";

export function Matching() {
  return (
    <section id="matching" className="relative scroll-mt-6 px-3 py-6 md:px-6">
      <div className="on-dark relative mx-auto max-w-[1280px] overflow-hidden rounded-[36px] bg-[#070a14] text-white md:rounded-[44px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 85% -10%, rgba(76,91,238,0.5), transparent 70%), radial-gradient(ellipse 50% 45% at 0% 100%, rgba(40,52,200,0.4), transparent 70%)",
          }}
        />
        <div className="grain" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-[1120px] px-6 py-14 md:px-10 md:py-20">
          <Reveal>
            <SectionHeading
              tone="dark"
              eyebrow={matching.eyebrow}
              title={matching.title}
              body={matching.body}
            />
          </Reveal>

          <Reveal>
            <MatchFunnel className="mt-12 h-auto w-full" />
          </Reveal>

          <ol className="mt-8 grid gap-8 border-t border-white/20 pt-8 md:grid-cols-3 md:gap-10">
            {matching.stages.map((stage, i) => (
              <li key={stage.title}>
                <p className="text-[13px] font-semibold tabular-nums text-[#9aa6ff]">Stage {i + 1}</p>
                <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.015em]">{stage.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ondark">{stage.body}</p>
                <p
                  className={`mt-3 text-[14px] font-medium ${
                    i === matching.stages.length - 1 ? "text-[#9aa6ff]" : "text-ondark-subtle"
                  }`}
                >
                  {stage.outcome}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-10 max-w-[640px] text-[15px] leading-relaxed text-white/90">
            {matching.rules}
          </p>
          <p className="mt-2 max-w-[640px] text-[13px] leading-snug text-ondark-subtle">
            {matching.targetsNote}
          </p>
        </div>
      </div>
    </section>
  );
}
