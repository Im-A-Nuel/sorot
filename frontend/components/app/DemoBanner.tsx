"use client";

import { useMeta } from "@/lib/api/use-demo";

const copy = {
  fixture: "No Panta key is configured, so this page runs on built-in fixtures.",
  sandbox:
    "Your Panta key is a pk_test_ key. Panta answers with sandbox data (one fake market) and never touches mainnet. Use a pk_live_ key for real markets.",
} as const;

/** Shown whenever the backend is serving demo data instead of live Panta data. */
export function DemoBanner() {
  const meta = useMeta();
  if (!meta || !meta.demo || meta.source === "live") return null;
  return (
    <p className="rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 text-[13.5px] leading-relaxed text-muted">
      <strong className="font-semibold text-ink">Demo data.</strong> {copy[meta.source]} Nothing here moves real
      money.
    </p>
  );
}
