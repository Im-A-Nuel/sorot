import { pantaApi } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function PantaApi() {
  return (
    <section id="panta" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={pantaApi.eyebrow} title={pantaApi.title} body={pantaApi.body} />
          </Reveal>

          {/* a route map: each stop is one Panta call, in the order a trade uses them */}
          <ol aria-label="Panta routes used by Sorot, in order">
            {pantaApi.stops.map((stop, i) => (
              <li key={stop.route} className="relative grid grid-cols-[28px_1fr] gap-4 pb-6 last:pb-0">
                {i < pantaApi.stops.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 rounded-full bg-brand-blue/25"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative mt-0.5 flex size-7 items-center justify-center rounded-full border-2 border-brand-blue bg-base"
                >
                  <span className="size-2 rounded-full bg-brand-blue" />
                </span>
                <div>
                  <code className="break-all font-mono text-[13.5px] font-medium text-brand-blue">
                    {stop.route}
                  </code>
                  <p className="mt-0.5 text-[14.5px] leading-snug text-muted">{stop.use}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
