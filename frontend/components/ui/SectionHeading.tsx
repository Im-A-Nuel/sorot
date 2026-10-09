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
      <p className={`text-[15px] font-semibold ${dark ? "text-[#9aa6ff]" : "text-brand-blue"}`}>
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-[clamp(32px,4.4vw,54px)] font-semibold leading-[1.06] tracking-[-0.03em] [text-wrap:balance] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {body && (
        <p className={`mt-5 text-[16px] leading-relaxed ${dark ? "text-ondark" : "text-muted"}`}>
          {body}
        </p>
      )}
    </div>
  );
}
