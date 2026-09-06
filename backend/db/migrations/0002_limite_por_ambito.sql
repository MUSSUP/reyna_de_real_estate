DROP INDEX "login_attempts_ip_time_idx";--> statement-breakpoint
ALTER TABLE "login_attempts" ADD COLUMN "scope" text DEFAULT 'login' NOT NULL;--> statement-breakpoint
CREATE INDEX "login_attempts_ip_time_idx" ON "login_attempts" USING btree ("scope","ip_hash","created_at");