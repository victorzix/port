ALTER TABLE "projects" ADD COLUMN "banner_image" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gallery" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "release_changes" ADD COLUMN "image" jsonb;