"use client";

import { trust } from "@/lib/content";
import { useMeta } from "@/lib/api/use-demo";

/** A status box that says what this deployment is really connected to, and a note that previews are illustrative. */
export function TrustBar() {
  const meta = useMeta();
  const status = meta ? trust.status[meta.source] : null;

  return (
    <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-2 pt-12 text-center md:px-8 md:pt-14">
      {status && (
        <p className="mx-auto max-w-[680px] rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 text-[14px] font-medium leading-relaxed text-ink">
          {status}
        </p>
      )}
      <p className="mx-auto mt-3 max-w-[760px] text-[13px] leading-relaxed text-subtle">
        {trust.note}
      </p>
    </div>
  );
}
