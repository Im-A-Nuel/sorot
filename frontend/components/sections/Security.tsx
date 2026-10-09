import { security } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow={security.eyebrow}
            title={security.title}
            body={security.body}
          />
        </Reveal>

        <ol
          aria-label="Who holds what"
          className="mt-12 grid overflow-hidden rounded-[22px] border border-ink/15 bg-white/60 md:grid-cols-3"
        >
          {security.flow.map((node, i) => (
            <li
              key={node.name}
              className={`p-6 ${i > 0 ? "border-t border-ink/15 md:border-l md:border-t-0" : ""}`}
            >
              <p className="text-[13px] font-semibold tabular-nums text-brand-blue">0{i + 1}</p>
              <h3 className="mt-1.5 text-[19px] font-semibold tracking-[-0.015em]">{node.name}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{node.role}</p>
            </li>
          ))}
        </ol>

        <dl className="mt-12 grid gap-x-16 gap-y-0 border-t border-ink/15 md:grid-cols-2">
          {security.items.map((item) => (
            <div key={item.title} className="border-b border-ink/15 py-6">
              <dt className="text-[18px] font-semibold tracking-[-0.01em]">{item.title}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
