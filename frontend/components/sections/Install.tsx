import { install } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Install() {
  return (
    <section id="install" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={install.eyebrow}
            title={install.title}
            body={install.body}
          />
        </Reveal>

        <ol className="mx-auto mt-14 grid max-w-[920px] gap-4 sm:grid-cols-2">
          {install.steps.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={(i % 2) * 80} className="h-full">
                <div className="card h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <h3 className="text-[18px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                  </div>
                  <p className="mt-4 rounded-xl bg-[#0b0f1a] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-white/85 break-words">
                    {step.code}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
