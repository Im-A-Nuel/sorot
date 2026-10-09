type Props = {
  title: string;
  yes: string | null;
  no: string | null;
};

/** Static chip mock. A null price renders "see odds", never a guessed number. */
export function ChipPreview({ title, yes, no }: Props) {
  return (
    <div className="flex-1 rounded-2xl border border-brand-blue/30 bg-[rgba(76,91,238,0.07)] p-3">
      <p className="text-[13px] font-semibold leading-snug">{title}</p>
      <p className="mt-1 text-[12px] text-subtle">Powered by Panta</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-semibold">
        {yes && no ? (
          <>
            <span className="rounded-xl bg-brand-blue px-3 py-2 text-center text-white">YES {yes}</span>
            <span className="rounded-xl bg-ink px-3 py-2 text-center text-white">NO {no}</span>
          </>
        ) : (
          <span className="col-span-2 rounded-xl border border-ink/20 bg-white px-3 py-2 text-center text-ink">
            see odds
          </span>
        )}
      </div>
    </div>
  );
}
