import { CheckIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/Logo";

const progress = [
  { label: "Quote", done: true },
  { label: "Approve", done: false },
  { label: "Send", done: false },
  { label: "Confirm", done: false },
] as const;

/** Static mock of the hosted trade popup. Numbers are illustrative. */
export function TradePopup() {
  return (
    <figure className="relative mx-auto w-full max-w-[340px]">
      <div
        className="surface overflow-hidden shadow-[0_24px_50px_-28px_rgba(40,50,160,0.45)]"
        role="img"
        aria-label="Preview of the Sorot trade popup: market title, YES and NO toggle, amount of 5 USDC, and a Sign with Phantom button"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <Logo size={18} />
            Sorot
          </span>
          <span className="text-[12px] text-subtle">Trade</span>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-[12px] font-medium text-subtle">Market</p>
            <p className="mt-1 text-[15px] font-semibold leading-snug">
              Will SOL close above $300 on Oct 31?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-ink/[0.06] p-1 text-[13.5px] font-semibold">
            <span className="rounded-xl bg-brand-blue py-2.5 text-center text-white">YES 0.62</span>
            <span className="py-2.5 text-center text-muted">NO 0.38</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-ink/12 bg-white px-4 py-3">
            <span className="text-[13px] text-subtle">Amount</span>
            <span className="text-[17px] font-semibold tracking-[-0.01em]">
              5 <span className="text-[13px] font-medium text-subtle">USDC</span>
            </span>
          </div>

          <ol className="flex items-center justify-between gap-1">
            {progress.map((step, i) => (
              <li key={step.label} className="flex items-center gap-1.5">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold ${
                    step.done ? "bg-brand-blue text-white" : "bg-ink/10 text-muted"
                  }`}
                >
                  {step.done ? <CheckIcon size={12} /> : i + 1}
                </span>
                <span className={`text-[12px] ${step.done ? "text-ink" : "text-subtle"}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="flex w-full items-center justify-center rounded-full bg-[#050608] py-3.5 text-[14px] font-medium text-white">
            Approve in Phantom
          </div>
          <p className="text-center text-[12px] text-subtle">Quote and instructions built by Panta</p>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[13px] text-subtle">
        Illustrative preview of the trade popup.
      </figcaption>
    </figure>
  );
}
