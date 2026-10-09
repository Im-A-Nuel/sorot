import { CheckIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Button";

export const TRADE_STEPS = ["Quote", "Approve", "Send", "Confirm"] as const;

type Props = {
  /** Index of the step in progress. Steps before it are done. Equal to the length when everything is done. */
  current: number;
  failedAt?: number | null;
  steps?: readonly string[];
};

export function Stepper({ current, failedAt = null, steps = TRADE_STEPS }: Props) {
  return (
    <ol aria-label="Progress" className="flex items-center justify-between gap-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current && failedAt === null;
        const failed = failedAt === i;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-1.5"
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold ${
                failed
                  ? "bg-danger text-white"
                  : done
                    ? "bg-brand-blue text-white"
                    : active
                      ? "border-2 border-brand-blue text-brand-blue"
                      : "bg-ink/10 text-muted"
              }`}
            >
              {done ? <CheckIcon size={13} /> : active ? <Spinner /> : failed ? "!" : i + 1}
            </span>
            <span
              className={`text-[13px] ${done || active ? "font-medium text-ink" : failed ? "font-medium text-danger" : "text-subtle"}`}
            >
              {label}
              {done && <span className="sr-only"> done</span>}
              {failed && <span className="sr-only"> failed</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
