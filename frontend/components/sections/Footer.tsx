import { content, footer } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRightIcon, ChromeIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="relative px-3 pb-3 pt-10 md:px-6 md:pb-6">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#5b69f0_0%,#3040e0_45%,#1626f0_100%)] text-white md:rounded-[44px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% -10%, rgba(255,255,255,0.55), transparent 70%), radial-gradient(ellipse 40% 40% at 100% 100%, rgba(6,10,70,0.55), transparent 70%)",
          }}
        />
        <div className="grain" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-[1120px] px-6 pb-0 pt-20 md:px-10 md:pt-28">
          <Reveal>
            <div className="mx-auto max-w-[760px] text-center">
              <h2 className="text-[clamp(36px,5.6vw,68px)] font-semibold leading-[1.04] tracking-[-0.035em]">
                {footer.ctaTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-[520px] text-[16.5px] leading-relaxed text-white/75">
                {footer.ctaBody}
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
                <a
                  href="#install"
                  className="flex h-12 items-center gap-2 rounded-full bg-[#050608] px-6 text-[14.5px] font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                  <ChromeIcon />
                  {content.cta.label}
                </a>
                <a
                  href="#how-it-works"
                  className="flex h-12 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-[14.5px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  See how it works
                  <ArrowUpRightIcon />
                </a>
              </div>
            </div>
          </Reveal>

          <div className="mt-20 flex flex-col gap-8 border-t border-white/20 pt-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[420px]">
              <a href="#" className="flex items-center gap-2.5 text-[18px] font-semibold">
                <span className="rounded-full bg-white">
                  <Logo size={26} />
                </span>
                {content.brand}
              </a>
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/70">{footer.built}</p>
            </div>
            <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[14.5px] font-medium text-white/85">
              {footer.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-white"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 max-w-[760px] text-[12.5px] leading-relaxed text-white/55">
            {footer.disclaimer}
          </p>

          <div
            aria-hidden="true"
            className="pointer-events-none mt-6 select-none overflow-hidden text-center font-medium leading-[0.78] tracking-[-0.03em] text-white/[0.14]"
            style={{ fontSize: "clamp(120px, 27vw, 380px)", height: "0.62em" }}
          >
            {content.brand}
          </div>
        </div>
      </div>
    </footer>
  );
}
