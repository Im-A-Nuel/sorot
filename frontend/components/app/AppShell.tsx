import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type Props = {
  children: ReactNode;
  wallet: ReactNode;
  /** Narrow for the popup trade window, wide for list pages. */
  width?: "narrow" | "wide";
  current?: "positions" | "trade";
};

export function AppShell({ children, wallet, width = "narrow", current }: Props) {
  const max = width === "narrow" ? "max-w-[460px]" : "max-w-[920px]";
  return (
    <div className="relative min-h-svh overflow-hidden bg-base">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 30% at 0% 0%, rgba(126,146,247,0.45), transparent 100%), radial-gradient(ellipse 50% 30% at 100% 100%, rgba(126,146,247,0.4), transparent 100%)",
        }}
      />
      <div className={`relative mx-auto flex min-h-svh w-full flex-col px-4 pb-8 pt-4 ${max}`}>
        <header className="flex items-center justify-between gap-3 pb-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link
              href="/"
              aria-label="Sorot home"
              className="flex items-center gap-2 rounded-full py-1 pr-2 text-[17px] font-semibold"
            >
              <Logo size={28} />
              <span className="max-[480px]:sr-only">Sorot</span>
            </Link>
            <nav aria-label="App">
              <Link
                href="/positions"
                aria-current={current === "positions" ? "page" : undefined}
                className={`rounded-full px-3 py-2.5 text-[14px] font-medium hover:bg-ink/[0.06] ${
                  current === "positions" ? "bg-ink/[0.07]" : ""
                }`}
              >
                Positions
              </Link>
            </nav>
          </div>
          {wallet}
        </header>

        <main id="content" className="flex-1">
          {children}
        </main>

        <footer className="pt-6 text-[12.5px] leading-relaxed text-subtle">
          Panta runs on Solana mainnet. Trades use real USDC and can lose value. Not financial advice.
        </footer>
      </div>
    </div>
  );
}
