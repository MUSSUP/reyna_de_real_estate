CREATE TYPE "public"."article_status" AS ENUM('borrador', 'publicado');--> statement-breakpoint
CREATE TYPE "public"."article_type" AS ENUM('noticia', 'informe');--> statement-breakpoint
CREATE TYPE "public"."construction_status" AS ENUM('pozo', 'construccion', 'terminado');--> statement-breakpoint
CREATE TYPE "public"."lead_interest" AS ENUM('invertir', 'rentar', 'consulta');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nuevo', 'contactado', 'cerrado', 'descartado');--> statement-breakpoint
CREATE TYPE "public"."operation" AS ENUM('venta', 'renta');--> statement-breakpoint
CREATE TYPE "public"."ownership" AS ENUM('propia', 'compartida');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('borrador', 'publicado', 'archivado');--> statement-breakpoint
CREATE TYPE "public"."setting_input_type" AS ENUM('texto', 'parrafo', 'url', 'telefono', 'email');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_es" text NOT NULL,
	"name_en" text,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"type" "article_type" NOT NULL,
	"title_es" text NOT NULL,
	"title_en" text,
	"excerpt_es" text,
	"body_es" text,
	"cover_path" text,
	"cover_alt_es" text,
	"status" "article_status" DEFAULT 'borrador' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"interest" "lead_interest" DEFAULT 'consulta' NOT NULL,
	"message" text,
	"property_id" uuid,
	"source_path" text,
	"status" "lead_status" DEFAULT 'nuevo' NOT NULL,
	"notes" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_es" text NOT NULL,
	"title_en" text,
	"description_es" text,
	"description_en" text,
	"property_type_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"developer_id" integer,
	"owner_id" integer,
	"operation" "operation" NOT NULL,
	"construction_status" "construction_status" NOT NULL,
	"year_built" integer,
	"price_usd" numeric(12, 2),
	"price_on_request" boolean DEFAULT false NOT NULL,
	"area_covered_m2" integer,
	"area_total_m2" integer,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"bathrooms" integer DEFAULT 0 NOT NULL,
	"cover_path" text,
	"cover_alt_es" text,
	"drive_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" integer,
	"status" "property_status" DEFAULT 'borrador' NOT NULL,
	"ownership" "ownership" DEFAULT 'propia' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_amenities" (
	"property_id" uuid NOT NULL,
	"amenity_id" integer NOT NULL,
	CONSTRAINT "property_amenities_property_id_amenity_id_pk" PRIMARY KEY("property_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"alt_es" text,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_es" text NOT NULL,
	"name_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value_es" text,
	"value_en" text,
	"group" text NOT NULL,
	"input_type" "setting_input_type" DEFAULT 'texto' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"city" text NOT NULL,
	"zone" text,
	"country" text DEFAULT 'México' NOT NULL,
	"country_code" char(2) DEFAULT 'MX' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uq" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "amenities_slug_uq" ON "amenities" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_uq" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_type_status_idx" ON "articles" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_one_pinned_per_type_uq" ON "articles" USING btree ("type") WHERE "articles"."is_pinned" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "developers_name_uq" ON "developers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_property_idx" ON "leads" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_slug_uq" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_featured_idx" ON "properties" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "properties_zone_idx" ON "properties" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("property_type_id");--> statement-breakpoint
CREATE INDEX "properties_operation_idx" ON "properties" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("price_usd");--> statement-breakpoint
CREATE INDEX "properties_bedrooms_idx" ON "properties" USING btree ("bedrooms");--> statement-breakpoint
CREATE INDEX "property_images_property_idx" ON "property_images" USING btree ("property_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "property_types_slug_uq" ON "property_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "site_settings_group_idx" ON "site_settings" USING btree ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_slug_uq" ON "zones" USING btree ("slug");