import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeading({ eyebrow, title, body, align = "left", tone = "light" }: Props) {
  const dark = tone === "dark";
  return (
    <div className={align === "center" ? "mx-auto max-w-[720px] text-center" : "max-w-[640px]"}>
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-medium ${
          dark
            ? "border-white/20 bg-white/10 text-white/80"
            : "border-white/80 bg-white/60 text-ink/70 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
        }`}
      >
        <span className="size-1.5 rounded-full bg-brand-blue" />
        {eyebrow}
      </span>
      <h2
        className={`mt-5 text-[clamp(32px,4.4vw,54px)] font-semibold leading-[1.06] tracking-[-0.03em] [text-wrap:balance] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p className={`mt-5 text-[16px] leading-relaxed ${dark ? "text-white/65" : "text-ink/65"}`}>
          {body}
        </p>
      )}
    </div>
  );
}
