import { SorotError } from "../types.ts";

/** Keeps requests to Panta under its limit (about 100 per minute). In memory, so each server instance has its own window. */
export class SlidingWindowLimiter {
  private stamps: number[] = [];

  private limit: number;
  private windowMs: number;
  private now: () => number;
  private sleep: (ms: number) => Promise<void>;

  constructor(
    limit: number,
    windowMs: number,
    now: () => number = Date.now,
    sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
    this.sleep = sleep;
  }

  /** Resolves when a slot is free. Throws RATE_LIMITED when the wait would exceed maxWaitMs. */
  async acquire(maxWaitMs = 5000): Promise<void> {
    for (;;) {
      const t = this.now();
      this.stamps = this.stamps.filter((s) => t - s < this.windowMs);
      if (this.stamps.length < this.limit) {
        this.stamps.push(t);
        return;
      }
      const wait = this.windowMs - (t - this.stamps[0]);
      if (wait > maxWaitMs) throw new SorotError("RATE_LIMITED", "Too many requests to Panta.", wait);
      await this.sleep(wait);
    }
  }
}
