ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_archived_idx" ON "notifications" USING btree ("user_id", "archived_at");
