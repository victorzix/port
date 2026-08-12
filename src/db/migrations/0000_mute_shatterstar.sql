CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" jsonb NOT NULL,
	"summary" jsonb,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"status" text NOT NULL,
	"year" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"repo_url" text,
	"live_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"type" text NOT NULL,
	"text" jsonb NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" text NOT NULL,
	"version_key" text NOT NULL,
	"released_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" jsonb,
	"notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "release_changes" ADD CONSTRAINT "release_changes_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_unique_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "release_changes_release_id_idx" ON "release_changes" USING btree ("release_id");--> statement-breakpoint
CREATE UNIQUE INDEX "releases_project_version_unique_idx" ON "releases" USING btree ("project_id","version");--> statement-breakpoint
CREATE INDEX "releases_project_id_idx" ON "releases" USING btree ("project_id");