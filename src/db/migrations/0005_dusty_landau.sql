CREATE TYPE "public"."feedback_role" AS ENUM('founder', 'investor', 'other');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"role" "feedback_role" NOT NULL,
	"page_path" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_message_not_empty" CHECK (length(trim("feedback"."message")) > 0),
	CONSTRAINT "feedback_message_bounded" CHECK (length("feedback"."message") <= 2000),
	CONSTRAINT "feedback_page_path_bounded" CHECK ("feedback"."page_path" IS NULL OR length("feedback"."page_path") <= 200)
);
--> statement-breakpoint
CREATE TABLE "product_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_created_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feedback_user_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_events_event_created_idx" ON "product_events" USING btree ("event","created_at");--> statement-breakpoint
CREATE INDEX "product_events_created_idx" ON "product_events" USING btree ("created_at");