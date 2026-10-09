/** USDC has 6 decimals. Money is parsed and formatted with integer math only, never floats. */

const DECIMALS = 6;
const ONE = BigInt(10 ** DECIMALS);

export type AmountCheck =
  | { ok: true; value: string; micro: bigint }
  | { ok: false; reason: "empty" | "format" | "decimals" | "zero" | "too-large" };

const MAX_MICRO = ONE * BigInt(1_000_000);

/** Validates user input and returns a normalized decimal string with at least 2 decimals, e.g. "5" becomes "5.00". */
export function checkAmount(input: string): AmountCheck {
  const raw = input.trim();
  if (raw === "") return { ok: false, reason: "empty" };
  if (!/^\d*\.?\d*$/.test(raw) || raw === ".") return { ok: false, reason: "format" };

  const [intPart = "", fracPart = ""] = raw.split(".");
  if (fracPart.length > DECIMALS) return { ok: false, reason: "decimals" };

  const micro = BigInt(intPart || "0") * ONE + BigInt(fracPart.padEnd(DECIMALS, "0") || "0");
  if (micro <= BigInt(0)) return { ok: false, reason: "zero" };
  if (micro > MAX_MICRO) return { ok: false, reason: "too-large" };

  const normalizedInt = BigInt(intPart || "0").toString();
  const normalizedFrac = fracPart.length >= 2 ? fracPart : fracPart.padEnd(2, "0");
  return { ok: true, value: `${normalizedInt}.${normalizedFrac}`, micro };
}

/** Parses a decimal string such as "0.62" into micro units. Returns null when it is not a plain decimal. */
export function toMicro(decimal: string | null | undefined): bigint | null {
  if (decimal == null) return null;
  const m = /^(\d+)(?:\.(\d{1,6}))?$/.exec(decimal.trim());
  if (!m) return null;
  return BigInt(m[1]) * ONE + BigInt((m[2] ?? "").padEnd(DECIMALS, "0") || "0");
}

export function fromMicro(micro: bigint): string {
  const negative = micro < BigInt(0);
  const abs = negative ? -micro : micro;
  const int = abs / ONE;
  const frac = (abs % ONE).toString().padStart(DECIMALS, "0");
  return `${negative ? "-" : ""}${int.toString()}.${frac}`;
}

/** Display format: thousands separators and a fixed number of decimals, rounded down. */
export function formatDecimal(decimal: string | null | undefined, dp = 2): string {
  const micro = toMicro(decimal);
  if (micro === null) return "—";
  const [int, frac] = fromMicro(micro).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dp > 0 ? `${withSep}.${frac.slice(0, dp)}` : withSep;
}

/** Shares bought for an amount at a price, in micro units. Both inputs are micro units. */
export function sharesFor(amountMicro: bigint, priceMicro: bigint): bigint {
  return (amountMicro * ONE) / priceMicro;
}

export function shortAddress(address: string): string {
  return address.length > 11 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export const amountMessages: Record<Exclude<AmountCheck, { ok: true }>["reason"], string> = {
  empty: "Enter an amount.",
  format: "Use digits and one decimal point only.",
  decimals: "USDC supports up to 6 decimal places.",
  zero: "Enter an amount greater than 0.",
  "too-large": "That amount is too large for one trade.",
};
