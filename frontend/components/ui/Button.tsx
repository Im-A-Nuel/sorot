import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "secondary";
type Size = "md" | "lg";

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = size === "lg" ? "min-h-12 px-6 text-[15px]" : "min-h-11 px-5 text-[14px]";
  const variants: Record<Variant, string> = {
    primary: "bg-[#050608] text-white hover:bg-[#1a1d29]",
    accent: "bg-brand-blue text-white hover:bg-[#1220c9]",
    secondary: "border border-ink/25 bg-white text-ink hover:bg-ink/[0.05]",
  };
  return `${base} ${sizes} ${variants[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({ variant, size, loading, className = "", children, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses(variant, size)} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin motion-reduce:animate-none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
