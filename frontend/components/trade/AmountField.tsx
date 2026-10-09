"use client";

import { amountMessages, checkAmount } from "@/lib/api";

const PRESETS = ["5", "10", "25"] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Show validation after the first blur or submit attempt, not while typing the first character. */
  showErrors: boolean;
  onBlur: () => void;
  disabled?: boolean;
};

export function AmountField({ value, onChange, showErrors, onBlur, disabled }: Props) {
  const check = checkAmount(value);
  const error = showErrors && !check.ok ? amountMessages[check.reason] : null;

  return (
    <div>
      <label htmlFor="amount" className="mb-2 block text-[14px] font-semibold">
        Amount
      </label>
      <div
        className={`flex items-center rounded-2xl border bg-white px-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-blue ${
          error ? "border-danger" : "border-ink/20"
        }`}
      >
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "amount-error" : "amount-hint"}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="min-h-14 min-w-0 flex-1 bg-transparent text-[22px] font-semibold tracking-[-0.01em] outline-none placeholder:text-subtle disabled:opacity-60"
        />
        <span className="pl-3 text-[14px] font-medium text-muted">USDC</span>
      </div>

      {error ? (
        <p id="amount-error" className="mt-2 text-[13.5px] font-medium text-danger">
          {error}
        </p>
      ) : (
        <p id="amount-hint" className="mt-2 text-[13px] text-subtle">
          Real USDC on Solana mainnet.
        </p>
      )}

      <div className="mt-3 flex gap-2" role="group" aria-label="Quick amounts">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset)}
            className={`min-h-11 min-w-16 cursor-pointer rounded-full border px-4 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              value === preset
                ? "border-ink bg-ink text-white"
                : "border-ink/20 bg-white hover:bg-ink/[0.05]"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
