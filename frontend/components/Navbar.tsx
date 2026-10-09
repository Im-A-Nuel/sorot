import { content } from "@/lib/content";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-[calc(72*var(--u))] min-h-16 items-center justify-between px-[max(20px,calc(83*var(--u)))]">
      <nav
        aria-label="Primary"
        className="hidden items-center gap-[calc(25*var(--u))] text-[max(12.5px,calc(13.2*var(--u)))] font-medium md:flex"
      >
        {content.nav.map((item) => (
          <a key={item.label} href={item.href} className="py-3">
            {item.label}
          </a>
        ))}
      </nav>

      <MobileMenu items={[...content.nav, ...content.mobileExtras]} />

      <a
        href="#top"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
        aria-label={`${content.brand}, back to top`}
      >
        <Logo />
      </a>

      <div className="ml-auto mt-[calc(4*var(--u))] flex items-center gap-[calc(19*var(--u))] text-[max(12px,calc(12.5*var(--u)))] font-medium">
        {content.appLinks.map((link) => (
          <a key={link.label} href={link.href} className="hidden py-3 sm:inline">
            {link.label}
          </a>
        ))}
        <a href={content.secondaryLink.href} className="hidden py-3 sm:inline">
          {content.secondaryLink.label}
        </a>
        <a
          href={content.primaryLink.href}
          className="flex h-[max(36px,calc(28*var(--u)))] items-center rounded-full bg-brand-blue px-[max(14px,calc(18*var(--u)))] text-white"
        >
          {content.primaryLink.label}
        </a>
      </div>
    </header>
  );
}
