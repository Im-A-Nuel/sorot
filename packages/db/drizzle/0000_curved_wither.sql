CREATE TABLE "claims" (
	"wallet" text NOT NULL,
	"market_id" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_wallet_market_id_pk" PRIMARY KEY("wallet","market_id")
);
--> statement-breakpoint
CREATE TABLE "market_embeddings" (
	"market_id" text NOT NULL,
	"model" text NOT NULL,
	"vector" real[] NOT NULL,
	"title_hash" text NOT NULL,
	CONSTRAINT "market_embeddings_market_id_model_pk" PRIMARY KEY("market_id","model")
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" text PRIMARY KEY NOT NULL,
	"title_raw" text,
	"title" text DEFAULT '' NOT NULL,
	"category" text,
	"status" text NOT NULL,
	"yes_price" text,
	"no_price" text,
	"volume_usdc" text,
	"url" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" text NOT NULL,
	"tweet_id" text,
	"market_id" text NOT NULL,
	"wallet" text NOT NULL,
	"side" text NOT NULL,
	"amount" bigint NOT NULL,
	"quote" jsonb NOT NULL,
	"signature" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_attempts_quote_id_unique" UNIQUE("quote_id"),
	CONSTRAINT "trade_attempts_signature_unique" UNIQUE("signature"),
	CONSTRAINT "trade_attempts_side" CHECK ("trade_attempts"."side" in ('yes','no')),
	CONSTRAINT "trade_attempts_status" CHECK ("trade_attempts"."status" in ('quoted','built','sent','confirmed','failed'))
);
--> statement-breakpoint
CREATE TABLE "tweet_matches" (
	"tweet_id" text PRIMARY KEY NOT NULL,
	"market_id" text,
	"similarity" real,
	"verified" boolean NOT NULL,
	"stage" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tweet_matches_stage" CHECK ("tweet_matches"."stage" in ('prefilter','similarity','verify','match'))
);
--> statement-breakpoint
CREATE TABLE "wallet_labels" (
	"wallet" text PRIMARY KEY NOT NULL,
	"is_team" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_embeddings" ADD CONSTRAINT "market_embeddings_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweet_matches" ADD CONSTRAINT "tweet_matches_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trade_attempts_wallet" ON "trade_attempts" USING btree ("wallet");--> statement-breakpoint
CREATE INDEX "tweet_matches_created_at" ON "tweet_matches" USING btree ("created_at");