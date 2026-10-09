import { install } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { CopyButton } from "@/components/ui/CopyButton";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Install() {
  return (
    <section id="install" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={install.eyebrow} title={install.title} body={install.body} />
          </Reveal>

          <div className="on-dark rounded-[22px] bg-[#0b0f1a] p-6 text-white md:p-8">
            <h3 className="text-[15px] font-semibold text-ondark">Build from source</h3>
            <ul className="mt-4 space-y-2">
              {install.commands.map((cmd) => (
                <li
                  key={cmd.code}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.07] py-1.5 pl-4 pr-1.5"
                >
                  <code className="min-w-0 break-words font-mono text-[13.5px] text-white">
                    <span className="sr-only">{cmd.label}: </span>
                    {cmd.code}
                  </code>
                  <CopyButton text={cmd.code} label={cmd.label} />
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-[15px] font-semibold text-ondark">Load it in Chrome</h3>
            <ol className="mt-3 space-y-3">
              {install.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] leading-snug text-white/90">
                  <span className="w-5 shrink-0 font-semibold tabular-nums text-[#9aa6ff]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
