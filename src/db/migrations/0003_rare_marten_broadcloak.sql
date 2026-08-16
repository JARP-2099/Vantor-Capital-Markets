CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX "companies_status_published_at_idx" ON "companies" USING btree ("status","published_at");--> statement-breakpoint
ALTER TABLE "valuation_runs" ADD CONSTRAINT "valuation_runs_completed_has_range" CHECK ("valuation_runs"."status" <> 'completed' OR ("valuation_runs"."valuation_low" IS NOT NULL AND "valuation_runs"."valuation_high" IS NOT NULL AND "valuation_runs"."valuation_mid" IS NOT NULL AND "valuation_runs"."confidence" IS NOT NULL));