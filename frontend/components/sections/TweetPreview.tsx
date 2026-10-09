function Avatar({ tone }: { tone: "blue" | "ink" }) {
  return (
    <span
      aria-hidden="true"
      className={`size-10 shrink-0 rounded-full ${
        tone === "blue"
          ? "bg-[linear-gradient(135deg,#aab4ff,#4c5bee)]"
          : "bg-[linear-gradient(135deg,#9aa0b4,#2b3042)]"
      }`}
    />
  );
}

/** Static mock of a tweet with a Sorot chip. The author names and numbers are placeholders. */
export function TweetPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[470px]">
      <div className="surface p-5 shadow-[0_24px_50px_-28px_rgba(40,50,160,0.45)]">
        <div className="flex gap-3">
          <Avatar tone="blue" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-[15px]">
              <span className="font-semibold">Display name</span>
              <span className="text-subtle">@handle · 2m</span>
            </div>
            <p className="mt-1 text-[15px] leading-snug">
              SOL is going to rip past 300 before Halloween.
            </p>

            <div className="mt-3.5 rounded-2xl border border-brand-blue/30 bg-[rgba(76,91,238,0.07)] p-3">
              <p className="text-[13px] font-semibold leading-snug">
                Will SOL close above $300 on Oct 31?
              </p>
              <p className="mt-1 text-[12px] text-subtle">Powered by Panta</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-semibold">
                <span className="rounded-xl bg-brand-blue px-3 py-2 text-center text-white">
                  YES 0.62
                </span>
                <span className="rounded-xl bg-ink px-3 py-2 text-center text-white">NO 0.38</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2.5 pl-6 text-[13px] font-medium text-brand-blue">
        Verified match, so the chip shows
      </p>

      <div className="surface mt-4 p-5">
        <div className="flex gap-3">
          <Avatar tone="ink" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-[15px]">
              <span className="font-semibold">Display name</span>
              <span className="text-subtle">@handle · 9m</span>
            </div>
            <p className="mt-1 text-[15px] leading-snug">gm, coffee first.</p>
            <div className="mt-3.5 flex h-[52px] items-center justify-center rounded-2xl border border-dashed border-ink/25 text-[13px] text-subtle">
              No match, no chip
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 text-center text-[13px] text-subtle">
        Illustrative example. Live chips only show data returned by the Panta API.
      </figcaption>
    </figure>
  );
}
