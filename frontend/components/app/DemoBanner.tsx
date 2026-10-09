"use client";

import { useDemo } from "@/lib/api/use-demo";

/** Shown whenever the backend is serving demo data instead of live Panta data. */
export function DemoBanner() {
  const demo = useDemo();
  if (!demo) return null;
  return (
    <p className="rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 text-[13.5px] leading-relaxed text-muted">
      <strong className="font-semibold text-ink">Demo data.</strong> No Panta key is configured, so this page
      runs on built-in fixtures. Nothing is sent to Panta and no transaction is signed.
    </p>
  );
}
