import { HashEmbedder, RemoteEmbedder, type Embedder } from "./match/embedding.ts";
import { Matcher } from "./match/pipeline.ts";
import { AnthropicVerifier, HeuristicVerifier, type Verifier } from "./match/verify.ts";
import type { PantaClient } from "./panta/client.ts";
import { FixturePantaClient } from "./panta/fixture-client.ts";
import { HttpPantaClient } from "./panta/http-client.ts";
import { createService } from "./service.ts";
import type { Store } from "./store.ts";

export type RuntimeEnv = {
  PANTA_API_BASE?: string;
  PANTA_API_KEY?: string;
  /** Set to 1 to use the built-in demo fixtures even when a Panta key is present. */
  PANTA_FORCE_FIXTURES?: string;
  PANTA_ATTRIBUTION_ID?: string;
  EMBEDDING_API_KEY?: string;
  EMBEDDING_MODEL?: string;
  EMBEDDING_BASE_URL?: string;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  MATCH_SIMILARITY_THRESHOLD?: string;
  CATALOG_SYNC_INTERVAL_SECONDS?: string;
};

const DEFAULT_LLM_MODEL = "claude-haiku-5-5";
/** The hash embedder scores on a different scale than a real embedding model. */
const DEFAULT_HASH_THRESHOLD = 0.2;
const DEFAULT_REMOTE_THRESHOLD = 0.78;

function number(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) ? n : fallback;
}

/**
 * Picks real components when their keys are present and local ones otherwise:
 * no Panta key means fixtures, no embedding key means the hash embedder, no LLM key means the heuristic verifier.
 */
export function createRuntime(opts: {
  env: RuntimeEnv;
  store: Store;
  sim?: () => string | null;
  /** Use this client instead of choosing one from the env. The eval uses it to replay a saved catalog. */
  panta?: PantaClient;
  log?: (message: string, extra?: unknown) => void;
}) {
  const { env, store } = opts;

  const panta: PantaClient = opts.panta
    ? opts.panta
    : env.PANTA_API_KEY && env.PANTA_FORCE_FIXTURES !== "1"
    ? new HttpPantaClient({
        apiKey: env.PANTA_API_KEY,
        baseUrl: env.PANTA_API_BASE || undefined,
        attributionId: env.PANTA_ATTRIBUTION_ID || undefined,
      })
    : new FixturePantaClient({ sim: opts.sim });

  const embedder: Embedder =
    env.EMBEDDING_API_KEY && env.EMBEDDING_MODEL
      ? new RemoteEmbedder({
          apiKey: env.EMBEDDING_API_KEY,
          model: env.EMBEDDING_MODEL,
          baseUrl: env.EMBEDDING_BASE_URL || undefined,
        })
      : new HashEmbedder();

  const verifier: Verifier = env.LLM_API_KEY
    ? new AnthropicVerifier({ apiKey: env.LLM_API_KEY, model: env.LLM_MODEL || DEFAULT_LLM_MODEL })
    : new HeuristicVerifier();

  const threshold =
    embedder.kind === "remote"
      ? number(env.MATCH_SIMILARITY_THRESHOLD, DEFAULT_REMOTE_THRESHOLD)
      : DEFAULT_HASH_THRESHOLD;

  const matcher = new Matcher({ embedder, verifier, threshold });
  const service = createService({
    panta,
    store,
    matcher,
    embedderId: embedder.id,
    catalogTtlMs: number(env.CATALOG_SYNC_INTERVAL_SECONDS, 300) * 1000,
    log: opts.log,
  });

  return {
    panta,
    embedder,
    verifier,
    matcher,
    service,
    threshold,
    describe: () => ({
      panta: panta.source,
      embedder: embedder.id,
      verifier: verifier.id,
      threshold,
    }),
  };
}

export type Runtime = ReturnType<typeof createRuntime>;
