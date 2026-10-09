/** Design-unit helper: 1 unit = 1px on the 1080px-wide reference frame, scaled to the hero width. */
export const u = (n: number) => `calc(${n} * var(--u))`;
