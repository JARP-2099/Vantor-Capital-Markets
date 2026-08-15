CREATE TYPE "public"."business_model" AS ENUM('subscription', 'transactional', 'marketplace', 'ecommerce', 'hardware', 'services', 'advertising', 'licensing', 'other');--> statement-breakpoint
CREATE TYPE "public"."company_intent" AS ENUM('not_raising', 'seeking_investment', 'open_to_strategic_investment', 'open_to_minority_investment', 'open_to_majority_acquisition', 'open_to_full_acquisition', 'open_to_acquisition_offers');--> statement-breakpoint
CREATE TYPE "public"."company_member_role" AS ENUM('founder', 'team');--> statement-breakpoint
CREATE TYPE "public"."company_stage" AS ENUM('idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'established');--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('draft', 'submitted', 'under_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."metric_type" AS ENUM('revenue_annual', 'arr', 'mrr', 'revenue_growth_yoy', 'customers', 'employees', 'burn_monthly', 'runway_months', 'net_profit_annual', 'gross_margin', 'capital_raised_total');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('founder', 'investor', 'buyer', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"website" text,
	"short_description" text,
	"full_description" text,
	"founded_year" integer,
	"hq_city" text,
	"hq_country" text,
	"industry" text,
	"subindustry" text,
	"business_model" "business_model",
	"stage" "company_stage",
	"problem" text,
	"solution" text,
	"market" text,
	"competitive_position" text,
	"business_model_description" text,
	"traction" text,
	"roadmap" text,
	"status" "company_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"published_at" timestamp,
	"archived_at" timestamp,
	"reviewed_by" text,
	"review_notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_not_empty" CHECK (length(trim("companies"."name")) > 0),
	CONSTRAINT "companies_slug_format" CHECK ("companies"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "companies_founded_year_sane" CHECK ("companies"."founded_year" IS NULL OR ("companies"."founded_year" >= 1800 AND "companies"."founded_year" <= 2100))
);
--> statement-breakpoint
CREATE TABLE "company_intents" (
	"company_id" uuid NOT NULL,
	"intent" "company_intent" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_intents_company_id_intent_pk" PRIMARY KEY("company_id","intent")
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"role" "company_member_role" DEFAULT 'team' NOT NULL,
	"title" text,
	"bio" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_members_display_order_nonnegative" CHECK ("company_members"."display_order" >= 0),
	CONSTRAINT "company_members_name_not_empty" CHECK (length(trim("company_members"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "company_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"metric_type" "metric_type" NOT NULL,
	"value" numeric(20, 4) NOT NULL,
	"currency" text,
	"as_of" date NOT NULL,
	"period_start" date,
	"period_end" date,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_metrics_counts_nonnegative" CHECK ("company_metrics"."metric_type" NOT IN ('customers', 'employees', 'runway_months', 'capital_raised_total') OR "company_metrics"."value" >= 0),
	CONSTRAINT "company_metrics_currency_format" CHECK ("company_metrics"."currency" IS NULL OR "company_metrics"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "company_metrics_period_order" CHECK ("company_metrics"."period_start" IS NULL OR "company_metrics"."period_end" IS NULL OR "company_metrics"."period_start" <= "company_metrics"."period_end")
);
--> statement-breakpoint
CREATE TABLE "funding_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"round_type" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"target_amount" numeric(20, 2),
	"amount_committed" numeric(20, 2),
	"currency" text,
	"security_type" text,
	"minimum_investment" numeric(20, 2),
	"opens_at" timestamp,
	"closes_at" timestamp,
	"valuation_basis" text,
	"regulatory_exemption" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role" "platform_role" NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"granted_by" text,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_items_user_id_company_id_pk" PRIMARY KEY("user_id","company_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_intents" ADD CONSTRAINT "company_intents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_metrics" ADD CONSTRAINT "company_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "companies_status_idx" ON "companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "companies_industry_idx" ON "companies" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "companies_stage_idx" ON "companies" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "companies_created_by_idx" ON "companies" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "company_members_company_idx" ON "company_members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_members_user_idx" ON "company_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "company_members_company_user_idx" ON "company_members" USING btree ("company_id","user_id") WHERE "company_members"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "company_metrics_lookup_idx" ON "company_metrics" USING btree ("company_id","metric_type","as_of");--> statement-breakpoint
CREATE UNIQUE INDEX "company_metrics_unique_point" ON "company_metrics" USING btree ("company_id","metric_type","as_of");--> statement-breakpoint
CREATE INDEX "funding_rounds_company_idx" ON "funding_rounds" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "watchlist_company_idx" ON "watchlist_items" USING btree ("company_id");