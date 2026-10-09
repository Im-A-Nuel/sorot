import type { ReactNode } from "react";
import { features } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ChartIcon,
  EyeOffIcon,
  LinkIcon,
  ShieldIcon,
  TagIcon,
  WalletIcon,
} from "@/components/ui/Icons";

const icons: Record<string, ReactNode> = {
  "Odds chip": <TagIcon />,
  "Verified matches": <ShieldIcon />,
  "Trade from the tweet": <WalletIcon />,
  "Positions and claims": <ChartIcon />,
  "Trade attribution": <LinkIcon />,
  "Read-only mode": <EyeOffIcon />,
};

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={features.eyebrow}
            title={features.title}
          />
        </Reveal>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={(i % 3) * 80} className="h-full">
                <div className="card relative h-full p-7">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6b78f2,#1626f0)] text-white shadow-[0_12px_26px_-10px_rgba(22,38,240,0.75)]">
                    {icons[item.title]}
                  </span>
                  <h3 className="mt-6 flex items-center gap-2 text-[20px] font-semibold tracking-[-0.015em]">
                    {item.title}
                    {"badge" in item && (
                      <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-[11px] font-medium text-ink/60">
                        {item.badge}
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{item.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
