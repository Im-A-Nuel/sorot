import { u } from "@/lib/units";

/** Backdrop drawn in 1080x675 reference coordinates so it scales with the hero. */
export function Background() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#eef0fd]">
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-visible"
        style={{ width: u(1080), height: u(675) }}
        viewBox="0 0 1080 675"
      >
        <defs>
          <filter id="arc-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.3" />
          </filter>
        </defs>

        <rect x="-3000" y="-3000" width="7080" height="6000" fill="#eef0fd" />

        <g filter="url(#blob-blur)">
          <ellipse cx="170" cy="75" rx="230" ry="95" fill="#a3aefb" opacity="0.6" />
          <ellipse cx="-10" cy="120" rx="80" ry="190" fill="#868cea" />
          <ellipse cx="1060" cy="700" rx="360" ry="260" fill="#6072e3" />
          <ellipse cx="800" cy="640" rx="200" ry="110" fill="#8c97ee" opacity="0.85" />
          <ellipse cx="330" cy="700" rx="150" ry="110" fill="#5b6bde" />
        </g>

        <ellipse
          cx="540"
          cy="92"
          rx="470"
          ry="308"
          fill="none"
          stroke="#ffffff"
          strokeWidth="96"
          opacity="0.97"
          filter="url(#arc-blur)"
        />

        <rect
          x="-600"
          y="-400"
          width="2280"
          height="1500"
          filter="url(#grain)"
          opacity="0.55"
          style={{ mixBlendMode: "soft-light" }}
        />
      </svg>
    </div>
  );
}
