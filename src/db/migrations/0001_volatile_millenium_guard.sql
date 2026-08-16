CREATE TYPE "public"."valuation_component_status" AS ENUM('applied', 'not_applicable', 'insufficient_data');--> statement-breakpoint
CREATE TYPE "public"."valuation_data_sufficiency" AS ENUM('strong', 'moderate', 'limited', 'insufficient');--> statement-breakpoint
CREATE TYPE "public"."valuation_run_status" AS ENUM('completed', 'insufficient_data', 'failed');--> statement-breakpoint
CREATE TYPE "public"."verification_category" AS ENUM('founder_identity', 'company_formation', 'revenue', 'financial_statements', 'ownership', 'customer_metrics', 'intellectual_property', 'operating_metrics');--> statement-breakpoint
CREATE TYPE "public"."verification_evidence_kind" AS ENUM('document_reference', 'external_url', 'attestation', 'provider_integration');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'under_review', 'verified', 'partially_verified', 'rejected', 'needs_update', 'expired');--> statement-breakpoint
ALTER TYPE "public"."metric_type" ADD VALUE 'top_customer_revenue_pct';--> statement-breakpoint
CREATE TABLE "valuation_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"component_key" text NOT NULL,
	"status" "valuation_component_status" NOT NULL,
	"valuation_low" numeric(20, 2),
	"valuation_high" numeric(20, 2),
	"valuation_mid" numeric(20, 2),
	"weight" numeric(6, 4),
	"detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valuation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"engine_version" text NOT NULL,
	"assumptions_version" text NOT NULL,
	"status" "valuation_run_status" NOT NULL,
	"data_sufficiency" "valuation_data_sufficiency" NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"valuation_low" numeric(20, 2),
	"valuation_high" numeric(20, 2),
	"valuation_mid" numeric(20, 2),
	"confidence" integer,
	"input_snapshot" jsonb NOT NULL,
	"risk_flags" jsonb,
	"insufficiency_reasons" jsonb,
	"requested_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "valuation_runs_confidence_range" CHECK ("valuation_runs"."confidence" IS NULL OR ("valuation_runs"."confidence" >= 0 AND "valuation_runs"."confidence" <= 100)),
	CONSTRAINT "valuation_runs_range_order" CHECK ("valuation_runs"."valuation_low" IS NULL OR "valuation_runs"."valuation_high" IS NULL OR ("valuation_runs"."valuation_low" <= "valuation_runs"."valuation_high")),
	CONSTRAINT "valuation_runs_mid_in_range" CHECK ("valuation_runs"."valuation_mid" IS NULL OR (("valuation_runs"."valuation_low" IS NULL OR "valuation_runs"."valuation_mid" >= "valuation_runs"."valuation_low") AND ("valuation_runs"."valuation_high" IS NULL OR "valuation_runs"."valuation_mid" <= "valuation_runs"."valuation_high"))),
	CONSTRAINT "valuation_runs_currency_format" CHECK ("valuation_runs"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "verification_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" "verification_evidence_kind" NOT NULL,
	"description" text NOT NULL,
	"reference" text,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_evidence_description_not_empty" CHECK (length(trim("verification_evidence"."description")) > 0)
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"category" "verification_category" NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"claim_summary" text NOT NULL,
	"submitted_by" text NOT NULL,
	"reviewed_by" text,
	"internal_notes" text,
	"founder_note" text,
	"decided_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_requests_claim_not_empty" CHECK (length(trim("verification_requests"."claim_summary")) > 0)
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "show_public_valuation" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "valuation_components" ADD CONSTRAINT "valuation_components_run_id_valuation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."valuation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuation_runs" ADD CONSTRAINT "valuation_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuation_runs" ADD CONSTRAINT "valuation_runs_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_request_id_verification_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."verification_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "valuation_components_run_key_idx" ON "valuation_components" USING btree ("run_id","component_key");--> statement-breakpoint
CREATE INDEX "valuation_runs_company_idx" ON "valuation_runs" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "verification_evidence_request_idx" ON "verification_evidence" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "verification_requests_company_idx" ON "verification_requests" USING btree ("company_id","category","created_at");--> statement-breakpoint
CREATE INDEX "verification_requests_status_idx" ON "verification_requests" USING btree ("status");