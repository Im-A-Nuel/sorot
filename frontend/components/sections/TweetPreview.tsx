function Avatar({ tone }: { tone: "blue" | "ink" }) {
  return (
    <span
      className={`size-10 shrink-0 rounded-full ${
        tone === "blue"
          ? "bg-[linear-gradient(135deg,#aab4ff,#4c5bee)]"
          : "bg-[linear-gradient(135deg,#9aa0b4,#2b3042)]"
      }`}
    />
  );
}

/** Static mock of a tweet with a Sorot chip. Numbers are illustrative. */
export function TweetPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[470px]">
      <div className="card p-5">
        <div className="flex gap-3">
          <Avatar tone="blue" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-[15px]">
              <span className="font-semibold">Anon Trader</span>
              <span className="text-ink/45">@anontrader · 2m</span>
            </div>
            <p className="mt-1 text-[15px] leading-snug">
              SOL is going to rip past 300 before Halloween.
            </p>

            <div className="mt-3.5 rounded-2xl border border-brand-blue/25 bg-[linear-gradient(100deg,rgba(76,91,238,0.12),rgba(76,91,238,0.04))] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug">
                    Will SOL close above $300 on Oct 31?
                  </p>
                  <p className="mt-1 text-[11px] text-ink/50">Powered by Panta</p>
                </div>
                <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">
                  Trade
                </span>
              </div>
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

      <div className="mt-3 flex items-center gap-2 pl-6 text-[12.5px] font-medium text-brand-blue">
        <span className="h-px w-6 bg-brand-blue/50" />
        Verified match, chip shown
      </div>

      <div className="card mt-4 p-5">
        <div className="flex gap-3">
          <Avatar tone="ink" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-[15px]">
              <span className="font-semibold">Morning Person</span>
              <span className="text-ink/45">@gmcoffee · 9m</span>
            </div>
            <p className="mt-1 text-[15px] leading-snug">gm, coffee first.</p>
            <div className="mt-3.5 flex h-[52px] items-center justify-center rounded-2xl border border-dashed border-ink/20 text-[12.5px] text-ink/45">
              No match, no chip
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] text-ink/45">
        Illustrative example. Live chips only show data returned by the Panta API.
      </p>
    </div>
  );
}
