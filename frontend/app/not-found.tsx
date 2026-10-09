import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="content" className="flex min-h-svh flex-col items-center justify-center bg-base px-6 text-center">
      <Logo size={40} />
      <h1 className="mt-6 text-[clamp(32px,5vw,48px)] font-semibold tracking-[-0.03em]">
        This page does not exist
      </h1>
      <p className="mt-3 max-w-[420px] text-[16px] leading-relaxed text-muted">
        The link may be old or mistyped. Sorot has a landing page, a trade page opened from chips, and a
        positions page.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonClasses("primary", "lg")}>
          Back to Sorot
        </Link>
        <Link href="/positions" className={buttonClasses("secondary", "lg")}>
          Positions
        </Link>
      </div>
    </main>
  );
}
