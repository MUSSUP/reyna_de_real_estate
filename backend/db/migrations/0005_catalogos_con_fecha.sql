-- Fecha de modificación en las cinco tablas de catálogo.
--
-- Hace falta para que el aviso de "cambios sin publicar" las vea. Sin esto,
-- corregir el nombre de una zona no encendía nada: la clienta guardaba, el
-- panel se quedaba callado, y el sitio público seguía mostrando el nombre
-- viejo hasta que por casualidad tocara una propiedad y publicara por otra
-- razón.
--
-- `default now()` deja las filas que ya existen con la fecha de la migración.
-- Es lo correcto: no se sabe cuándo se cargaron, y suponer una fecha vieja
-- haría parecer que no hay nada pendiente cuando sí lo hay.

ALTER TABLE "amenities" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "developers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "property_types" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "zones" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;