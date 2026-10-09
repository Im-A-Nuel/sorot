import { trust } from "@/lib/content";

export function TrustBar() {
  return (
    <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-2 pt-12 text-center md:px-8 md:pt-16">
      <p className="mx-auto max-w-[760px] text-[15px] font-medium leading-relaxed text-ink">
        {trust.line}
      </p>
      <p className="mx-auto mt-2 max-w-[760px] text-[13px] leading-relaxed text-subtle">
        {trust.note}
      </p>
    </div>
  );
}
