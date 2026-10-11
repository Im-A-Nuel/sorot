import { content } from "@/lib/content";
import { u } from "@/lib/units";
import { Background } from "./Background";
import { Navbar } from "./Navbar";
import { PhoneMockup } from "./PhoneMockup";
import { Wordmark } from "./Wordmark";

export function Hero() {
  return (
    <section
      id="top"
      className="hero relative w-full overflow-hidden [container-type:inline-size]"
    >
      <Background />
      <Navbar />

      <div
        className="hero-copy absolute inset-x-0 z-20 flex flex-col items-center text-center"
      >
        <h1
          className="hero-title font-semibold text-ink"
        >
          {content.headline[0]}
          <br />
          {content.headline[1]}
        </h1>

        <p className="hero-sub font-medium text-ink/90">
          {content.subtitle}
        </p>

        <div className="hero-actions flex items-center">
          <a
            href={content.cta.href}
            className="hero-btn flex items-center justify-center rounded-full bg-[#050608] text-white"
            style={{
              minWidth: `max(104px, ${u(101)})`,
              paddingInline: u(16),
              whiteSpace: "nowrap",
              fontWeight: 450,
              fontSize: `max(13px, ${u(12.5)})`,
            }}
          >
            {content.cta.label}
          </a>
          <a
            href={content.secondaryCta.href}
            className="hero-btn flex items-center justify-center rounded-full border border-ink/25 bg-white/80 text-ink"
            style={{
              minWidth: `max(112px, ${u(108)})`,
              paddingInline: u(16),
              whiteSpace: "nowrap",
              fontWeight: 450,
              fontSize: `max(13px, ${u(12.5)})`,
            }}
          >
            {content.secondaryCta.label}
          </a>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{ width: u(1080), height: u(675) }}
      >
        <Wordmark />
        <PhoneMockup />
      </div>

      {/* Dissolves the bottom of the hero into the page color, so the wordmark and phone fade out instead of being cut. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-0.5 z-30"
        style={{
          height: "var(--fade)",
          background:
            "linear-gradient(to bottom, rgba(238,240,253,0) 0%, rgba(238,240,253,0.12) 20%, rgba(238,240,253,0.4) 45%, rgba(238,240,253,0.75) 70%, rgba(238,240,253,0.95) 90%, #eef0fd 100%)",
        }}
      />
    </section>
  );
}
