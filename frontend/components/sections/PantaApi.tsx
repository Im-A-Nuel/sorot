import { pantaApi } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function PantaApi() {
  return (
    <section id="panta" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={pantaApi.eyebrow} title={pantaApi.title} body={pantaApi.body} />
          </Reveal>

          <Reveal delay={100}>
            <div className="card overflow-hidden !p-0">
              <div className="hidden grid-cols-[1.25fr_1fr] border-b border-ink/10 bg-ink/[0.04] px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink/50 sm:grid">
                <span>Endpoint</span>
                <span>Used for</span>
              </div>
              <ul>
                {pantaApi.rows.map((row, i) => (
                  <li
                    key={row.route}
                    className={`grid gap-1 px-6 py-4 sm:grid-cols-[1.25fr_1fr] sm:gap-3 ${
                      i > 0 ? "border-t border-ink/8" : ""
                    }`}
                  >
                    <code className="break-all font-mono text-[13px] font-medium text-brand-blue">
                      {row.route}
                    </code>
                    <span className="text-[14.5px] text-ink/70">{row.use}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
