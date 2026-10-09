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
      style={{ height: "max(100svh, 62.5vw)" }}
    >
      <Background />
      <Navbar />

      <div
        className="absolute inset-x-0 z-20 flex flex-col items-center text-center"
        style={{ top: u(112) }}
      >
        <h1
          className="font-semibold text-ink"
          style={{ fontSize: `max(34px, ${u(56)})`, lineHeight: 1.09, letterSpacing: "-0.025em" }}
        >
          {content.headline[0]}
          <br />
          {content.headline[1]}
        </h1>

        <p
          className="font-medium text-ink/90"
          style={{
            marginTop: u(15),
            maxWidth: `min(${u(420)}, 88%)`,
            fontSize: `max(12px, ${u(13.2)})`,
            lineHeight: 1.42,
          }}
        >
          {content.subtitle}
        </p>

        <div className="flex items-center" style={{ marginTop: u(29), gap: 8 }}>
          <a
            href={content.cta.href}
            className="flex items-center justify-center rounded-full bg-[#050608] text-white"
            style={{
              height: `max(38px, ${u(36)})`,
              width: `max(104px, ${u(101)})`,
              fontWeight: 450,
              fontSize: `max(13px, ${u(12.5)})`,
            }}
          >
            {content.cta.label}
          </a>
          <a
            href={content.secondaryCta.href}
            className="flex items-center justify-center rounded-full border border-ink/25 bg-white/80 text-ink"
            style={{
              height: `max(38px, ${u(36)})`,
              width: `max(112px, ${u(108)})`,
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
    </section>
  );
}
