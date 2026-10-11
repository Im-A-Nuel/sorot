import { security } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TrustDiagram } from "@/components/illustrations/TrustDiagram";

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={security.eyebrow}
            title={security.title}
            body={security.body}
          />
        </Reveal>

        <Reveal>
          <TrustDiagram className="mx-auto mt-12 h-auto w-full max-w-[960px]" />
        </Reveal>

        <ol aria-label="Who holds what" className="mx-auto mt-2 grid max-w-[960px] gap-6 sm:grid-cols-3">
          {security.flow.map((node) => (
            <li key={node.name} className="sm:text-center">
              <h3 className="text-[18px] font-semibold tracking-[-0.015em]">{node.name}</h3>
              <p className="mt-1 max-w-[260px] sm:mx-auto text-[14.5px] leading-relaxed text-muted">
                {node.role}
              </p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-[620px] border-t border-ink/15 pt-6 text-center text-[14.5px] leading-relaxed text-muted">
          {security.note}
        </p>
      </div>
    </section>
  );
}
