import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Prices and volume stay text, exactly as Panta returned them. Amounts the user trades are bigint micro-USDC. */

export const markets = pgTable("markets", {
  id: text("id").primaryKey(),
  titleRaw: text("title_raw"),
  /** Hydrated title used for matching and the UI. Panta often returns an empty title in the catalog. */
  title: text("title").notNull().default(""),
  category: text("category"),
  status: text("status").notNull(),
  yesPrice: text("yes_price"),
  noPrice: text("no_price"),
  volumeUsdc: text("volume_usdc"),
  url: text("url").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const marketEmbeddings = pgTable(
  "market_embeddings",
  {
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    vector: real("vector").array().notNull(),
    titleHash: text("title_hash").notNull(),
  },
  (t) => [primaryKey({ columns: [t.marketId, t.model] })],
);

export const tweetMatches = pgTable(
  "tweet_matches",
  {
    tweetId: text("tweet_id").primaryKey(),
    marketId: text("market_id").references(() => markets.id, { onDelete: "set null" }),
    similarity: real("similarity"),
    verified: boolean("verified").notNull(),
    stage: text("stage").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("tweet_matches_stage", sql`${t.stage} in ('prefilter','similarity','verify','match')`),
    index("tweet_matches_created_at").on(t.createdAt),
  ],
);

export const tradeAttempts = pgTable(
  "trade_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: text("quote_id").notNull().unique(),
    tweetId: text("tweet_id"),
    marketId: text("market_id").notNull(),
    wallet: text("wallet").notNull(),
    side: text("side").notNull(),
    /** USDC base units (6 decimals). */
    amountMicro: bigint("amount", { mode: "bigint" }).notNull(),
    quote: jsonb("quote").notNull(),
    signature: text("signature").unique(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("trade_attempts_side", sql`${t.side} in ('yes','no')`),
    check("trade_attempts_status", sql`${t.status} in ('quoted','built','sent','confirmed','failed')`),
    index("trade_attempts_wallet").on(t.wallet),
  ],
);

export const walletLabels = pgTable("wallet_labels", {
  wallet: text("wallet").primaryKey(),
  /** Team wallets are excluded from traction counts. */
  isTeam: boolean("is_team").notNull(),
});

export const claims = pgTable(
  "claims",
  {
    wallet: text("wallet").notNull(),
    marketId: text("market_id").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.wallet, t.marketId] })],
);

export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
