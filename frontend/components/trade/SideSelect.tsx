import type { Side } from "@/lib/api";

type Props = {
  value: Side;
  onChange: (side: Side) => void;
  yesPrice: string | null;
  noPrice: string | null;
  disabled?: boolean;
};

function Option({
  side,
  label,
  price,
  checked,
  disabled,
  onChange,
}: {
  side: Side;
  label: string;
  price: string | null;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const active = side === "yes" ? "bg-brand-blue text-white" : "bg-ink text-white";
  return (
    <label
      className={`relative flex min-h-[68px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-2.5 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue ${
        checked ? `${active} border-transparent` : "border-ink/20 bg-white hover:bg-ink/[0.04]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="radio"
        name="side"
        value={side}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-[16px] font-semibold">{label}</span>
      <span className={`text-[13px] ${checked ? "text-white/90" : "text-muted"}`}>
        {price ? price : "price at quote"}
      </span>
    </label>
  );
}

/** YES or NO as a native radio group. A missing price says so instead of showing a guess. */
export function SideSelect({ value, onChange, yesPrice, noPrice, disabled }: Props) {
  return (
    <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
      <legend className="mb-2 text-[14px] font-semibold">Side</legend>
      <div className="grid grid-cols-2 gap-2.5">
        <Option
          side="yes"
          label="YES"
          price={yesPrice}
          checked={value === "yes"}
          disabled={disabled}
          onChange={() => onChange("yes")}
        />
        <Option
          side="no"
          label="NO"
          price={noPrice}
          checked={value === "no"}
          disabled={disabled}
          onChange={() => onChange("no")}
        />
      </div>
    </fieldset>
  );
}
