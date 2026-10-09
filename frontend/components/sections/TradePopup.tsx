import { CheckIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/Logo";

const progress = [
  { label: "Quote", done: true },
  { label: "Build", done: true },
  { label: "Sign", done: false },
  { label: "Send", done: false },
] as const;

/** Static mock of the hosted trade popup. Numbers are illustrative. */
export function TradePopup() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="card overflow-hidden !rounded-[30px]">
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-3.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <Logo size={18} />
            Sorot
          </span>
          <span className="text-[11.5px] text-ink/45">Trade</span>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink/45">
              Market
            </p>
            <p className="mt-1.5 text-[15px] font-semibold leading-snug">
              Will SOL close above $300 on Oct 31?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-ink/[0.06] p-1 text-[13.5px] font-semibold">
            <span className="rounded-xl bg-brand-blue py-2.5 text-center text-white shadow-[0_8px_18px_-8px_rgba(22,38,240,0.8)]">
              YES 0.62
            </span>
            <span className="py-2.5 text-center text-ink/55">NO 0.38</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
            <span className="text-[12.5px] text-ink/50">Amount</span>
            <span className="text-[17px] font-semibold tracking-[-0.01em]">
              5 <span className="text-[12.5px] font-medium text-ink/50">USDC</span>
            </span>
          </div>

          <ol className="flex items-center justify-between gap-1">
            {progress.map((step, i) => (
              <li key={step.label} className="flex flex-1 items-center gap-1.5">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    step.done ? "bg-brand-blue text-white" : "bg-ink/10 text-ink/45"
                  }`}
                >
                  {step.done ? <CheckIcon className="!size-3" /> : i + 1}
                </span>
                <span className={`text-[11.5px] ${step.done ? "text-ink/80" : "text-ink/40"}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            tabIndex={-1}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#050608] py-3.5 text-[14px] font-medium text-white"
          >
            Sign with Phantom
          </button>
          <p className="text-center text-[11px] text-ink/40">Quote and transaction built by Panta</p>
        </div>
      </div>
    </div>
  );
}
