import { extractEntities, normalizeText } from "./entities.ts";

export interface Embedder {
  readonly id: string;
  /** "hash" is the local dev embedder. "remote" is a real embedding API. Thresholds differ between them. */
  readonly kind: "hash" | "remote";
  embed(texts: string[]): Promise<number[][]>;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic local embedder: hashed bag of canonical words, price levels and word pairs.
 * It needs no API and no key. It is good enough to rank a small catalog, and the real embedder replaces it in production.
 */
export class HashEmbedder implements Embedder {
  readonly id = "hash-v1";
  readonly kind = "hash" as const;

  private dim: number;

  constructor(dim = 512) {
    this.dim = dim;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.one(t));
  }

  private one(text: string): number[] {
    const v = new Array<number>(this.dim).fill(0);
    const add = (feature: string, weight: number) => {
      const h = fnv1a(feature);
      v[h % this.dim] += (h & 0x80000000 ? -1 : 1) * weight;
    };
    const e = extractEntities(text);
    for (const a of e.assets) add(`a:${a}`, 3);
    for (const n of e.numbers) add(`n:${n}`, 3);
    const words = [...e.words];
    for (const w of words) add(`w:${w}`, 1);
    const ordered = normalizeText(text).match(/[a-z]{3,}/g) ?? [];
    for (let i = 0; i + 1 < ordered.length; i++) add(`b:${ordered[i]}_${ordered[i + 1]}`, 0.5);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}

export type RemoteEmbedderConfig = {
  apiKey: string;
  model: string;
  /** Any OpenAI-compatible endpoint that serves POST {baseUrl}/embeddings. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

/** Embeddings through an OpenAI-compatible API. Not exercised by the test suite, which has no key. */
export class RemoteEmbedder implements Embedder {
  readonly kind = "remote" as const;
  readonly id: string;

  private cfg: RemoteEmbedderConfig;

  constructor(cfg: RemoteEmbedderConfig) {
    this.cfg = cfg;
    this.id = cfg.model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const f = this.cfg.fetchImpl ?? fetch;
    const res = await f(`${(this.cfg.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "")}/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify({ model: this.cfg.model, input: texts }),
    });
    if (!res.ok) throw new Error(`embedding request failed with ${res.status}`);
    const json = (await res.json()) as { data?: { embedding: number[]; index?: number }[] };
    const rows = [...(json.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    if (rows.length !== texts.length) throw new Error("embedding response has the wrong length");
    return rows.map((r) => r.embedding);
  }
}
