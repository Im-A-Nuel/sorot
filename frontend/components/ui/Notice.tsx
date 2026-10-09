import type { ReactNode, Ref } from "react";
import { AlertIcon, CheckIcon } from "./Icons";

type Tone = "error" | "success" | "info";

const tones: Record<Tone, string> = {
  error: "bg-danger-bg text-danger border-danger/25",
  success: "bg-success-bg text-success border-success/25",
  info: "bg-ink/[0.05] text-ink border-ink/15",
};

type Props = {
  tone: Tone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  /** Lets the parent move focus here after a failed action. */
  innerRef?: Ref<HTMLDivElement>;
  id?: string;
};

/** Errors use role=alert so they are announced. Success and info use role=status. */
export function Notice({ tone, title, children, actions, innerRef, id }: Props) {
  return (
    <div
      ref={innerRef}
      id={id}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl border p-4 ${tones[tone]}`}
    >
      <div className="flex gap-3">
        <span className="mt-0.5 shrink-0">
          {tone === "success" ? <CheckIcon /> : <AlertIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug">{title}</p>
          {children && <div className="mt-1 text-[14px] leading-relaxed">{children}</div>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
