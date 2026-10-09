import { isMockApi } from "@/lib/api";

/** Shown whenever the page runs on fixtures instead of the Sorot backend. */
export function DemoBanner() {
  if (!isMockApi) return null;
  return (
    <p className="rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 text-[13.5px] leading-relaxed text-muted">
      <strong className="font-semibold text-ink">Demo data.</strong> This page runs on fixtures until
      the Sorot backend is connected. Nothing is sent to Panta and no transaction is signed.
    </p>
  );
}
