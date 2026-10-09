import { matching } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

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

        <div className="relative mx-auto w-full max-w-[1120px] px-6 py-16 md:px-10 md:py-24">
          <Reveal>
            <SectionHeading
              tone="dark"
              eyebrow={matching.eyebrow}
              title={matching.title}
              body={matching.body}
            />
          </Reveal>

          <ol className="mt-14 border-t border-white/20">
            {matching.stages.map((stage, i) => (
              <li
                key={stage.title}
                className="grid gap-x-8 gap-y-3 border-b border-white/20 py-8 md:grid-cols-[5rem_1fr_16rem] md:items-baseline"
              >
                <span className="text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white/90">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{stage.title}</h3>
                  <p className="mt-2 max-w-[520px] text-[15.5px] leading-relaxed text-ondark">
                    {stage.body}
                  </p>
                </div>
                <p
                  className={`text-[14.5px] font-medium md:text-right ${
                    i === matching.stages.length - 1 ? "text-[#9aa6ff]" : "text-ondark-subtle"
                  }`}
                >
                  {stage.outcome}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <ul className="space-y-3.5">
              {matching.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-[15px] leading-snug text-white/90">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#9aa6ff]"
                  />
                  {rule}
                </li>
              ))}
            </ul>

            <div>
              <p className="text-[14px] font-semibold text-ondark">Design targets</p>
              <ul className="mt-3 flex gap-10">
                {matching.targets.map((item) => (
                  <li key={item.caption}>
                    <p className="text-[clamp(34px,4vw,46px)] font-semibold leading-none tracking-[-0.04em]">
                      {item.value}
                    </p>
                    <p className="mt-2 max-w-[150px] text-[13px] leading-snug text-ondark">
                      {item.caption}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[13px] leading-snug text-ondark-subtle">
                {matching.targetsNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
