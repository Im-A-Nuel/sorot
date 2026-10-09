import type { ReactNode } from "react";
import { security } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlobeIcon, KeyIcon, LockIcon, ShieldIcon } from "@/components/ui/Icons";

const icons: ReactNode[] = [<KeyIcon key="k" />, <LockIcon key="l" />, <GlobeIcon key="g" />, <ShieldIcon key="s" />];

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-8">
              <SectionHeading
                eyebrow={security.eyebrow}
                title={security.title}
                body={security.body}
              />
            </div>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2">
            {security.items.map((item, i) => (
              <li key={item.title}>
                <Reveal delay={i * 80} className="h-full">
                  <div className="card h-full p-6">
                    <span className="flex size-11 items-center justify-center rounded-full bg-ink text-white">
                      {icons[i]}
                    </span>
                    <h3 className="mt-5 text-[18px] font-semibold leading-snug tracking-[-0.01em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink/65">{item.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
