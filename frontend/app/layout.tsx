import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sorot: Panta odds under the tweet",
  description:
    "Sorot is a Chrome extension that shows Panta prediction market odds under matching tweets on X, and lets you trade from a hosted page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <noscript>
          <style>{".reveal{opacity:1;transform:none}"}</style>
        </noscript>
        <a
          href="#content"
          className="sr-only z-50 rounded-full bg-ink px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
