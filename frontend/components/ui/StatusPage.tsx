import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/** Full-page message for 404 and unexpected errors. Same layout, so both look like one product. */
export function StatusPage({ title, children, actions }: { title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <main id="content" className="flex min-h-svh flex-col items-center justify-center bg-base px-6 text-center">
      <Logo size={40} />
      <h1 className="enter-fade mt-6 text-[clamp(30px,5vw,48px)] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="mt-3 max-w-[420px] text-[16px] leading-relaxed text-muted">{children}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">{actions}</div>
    </main>
  );
}
