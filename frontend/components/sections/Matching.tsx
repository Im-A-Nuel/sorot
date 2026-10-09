import { matching } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckIcon } from "@/components/ui/Icons";

export function Matching() {
  return (
    <section id="matching" className="relative scroll-mt-6 px-3 py-6 md:px-6">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[36px] bg-[#070a14] text-white md:rounded-[44px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 85% -10%, rgba(76,91,238,0.55), transparent 70%), radial-gradient(ellipse 50% 45% at 0% 100%, rgba(40,52,200,0.45), transparent 70%)",
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

          <ol className="mt-14 grid gap-4 md:grid-cols-3">
            {matching.stages.map((stage, i) => (
              <li key={stage.title}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="relative h-full rounded-3xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur">
                    <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
                      {stage.label}
                    </span>
                    <h3 className="mt-3 text-[21px] font-semibold tracking-[-0.015em]">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/65">{stage.body}</p>
                    <p className="mt-5 text-[12.5px] font-medium text-white/40">
                      {i < 2 ? "Not clear → stop, no chip" : "Clear yes → chip"}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Reveal className="h-full">
              <ul className="grid h-full gap-3 rounded-3xl border border-white/12 bg-white/[0.04] p-6 sm:grid-cols-2">
                {matching.rules.map((rule) => (
                  <li key={rule} className="flex gap-3 text-[14.5px] leading-snug text-white/80">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/80">
                      <CheckIcon className="!size-3 text-white" />
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={90} className="h-full">
              <div className="h-full rounded-3xl border border-white/12 bg-[linear-gradient(135deg,rgba(91,105,240,0.35),rgba(22,38,240,0.2))] p-6">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/55">
                  {matching.targets.label}
                </p>
                <ul className="mt-4 grid grid-cols-3 gap-3">
                  {matching.targets.items.map((item) => (
                    <li key={item.caption}>
                      <p className="text-[clamp(26px,3vw,34px)] font-semibold leading-none tracking-[-0.03em]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-[12.5px] leading-snug text-white/60">{item.caption}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[12.5px] leading-snug text-white/50">
                  Targets we are building toward. Measured results are published from{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11.5px]">
                    pnpm eval
                  </code>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
