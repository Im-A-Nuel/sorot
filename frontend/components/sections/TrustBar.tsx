import { builtOn } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

export function TrustBar() {
  return (
    <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-6 pt-14 md:px-8 md:pt-20">
      <Reveal>
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink/45">
            Built with
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2.5">
            {builtOn.map((name) => (
              <li
                key={name}
                className="rounded-full border border-white/90 bg-white/60 px-5 py-2.5 text-[15px] font-medium text-ink/80 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_30px_-18px_rgba(40,50,160,0.45)] backdrop-blur"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
