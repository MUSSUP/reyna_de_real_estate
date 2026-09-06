/**
 * Esquema de base de datos — Reyna de Real Estate
 * Refleja design/data_model.md v3.0. Ante cualquier diferencia, manda ese documento.
 *
 * Los campos `_en` existen pero no se cargan ni se muestran: el sitio sale en
 * español (D-11). Están para que sumar inglés sea cargar contenido, no migrar.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enumerados
// ---------------------------------------------------------------------------

/** Alimenta la segmentación Invertir / Rentar del hero. */
export const operationEnum = pgEnum('operation', ['venta', 'renta']);

/** El "estado" de obra del acuerdo, punto 5.5. */
export const constructionStatusEnum = pgEnum('construction_status', [
  'pozo',
  'construccion',
  'terminado',
]);

export const propertyStatusEnum = pgEnum('property_status', ['borrador', 'publicado', 'archivado']);

/** Cartera propia o de otro broker. Interno: no se muestra en el sitio (R-07). */
export const ownershipEnum = pgEnum('ownership', ['propia', 'compartida']);

export const articleTypeEnum = pgEnum('article_type', ['noticia', 'informe']);
export const articleStatusEnum = pgEnum('article_status', ['borrador', 'publicado']);

export const leadInterestEnum = pgEnum('lead_interest', ['invertir', 'rentar', 'consulta']);
export const leadStatusEnum = pgEnum('lead_status', [
  'nuevo',
  'contactado',
  'cerrado',
  'descartado',
]);

export const settingInputTypeEnum = pgEnum('setting_input_type', [
  'texto',
  'parrafo',
  'url',
  'telefono',
  'email',
]);

// ---------------------------------------------------------------------------
// Acceso al panel
// ---------------------------------------------------------------------------

/** Acceso único para la clienta (acuerdo, punto 3). Sin roles ni multiusuario. */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    /** bcrypt coste 12. NUNCA se devuelve en una respuesta de API. */
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('admin_users_email_uq').on(t.email)],
);

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

/** Ciudad y zona. Alimenta el filtro y los dos badges de la card. */
export const zones = pgTable(
  'zones',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    city: text('city').notNull(),
    zone: text('zone'),
    country: text('country').notNull().default('México'),
    /** Alimenta el badge de país que pidió la clienta. */
    countryCode: char('country_code', { length: 2 }).notNull().default('MX'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('zones_slug_uq').on(t.slug)],
);

/** Tabla y no enum: ya hubo que sumar "terreno" y puede haber más. */
export const propertyTypes = pgTable(
  'property_types',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    nameEs: text('name_es').notNull(),
    nameEn: text('name_en'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('property_types_slug_uq').on(t.slug)],
);

export const developers = pgTable(
  'developers',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    website: text('website'),
    /** Interno. No se expone en el sitio público. */
    notes: text('notes'),
  },
  (t) => [uniqueIndex('developers_name_uq').on(t.name)],
);

/**
 * Propietarios — datos de contacto de terceros.
 * ⚠️ Ningún endpoint público devuelve esta tabla (D-09).
 */
export const owners = pgTable('owners', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
});

export const amenities = pgTable(
  'amenities',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    nameEs: text('name_es').notNull(),
    nameEn: text('name_en'),
    icon: text('icon').notNull(),
  },
  (t) => [uniqueIndex('amenities_slug_uq').on(t.slug)],
);

// ---------------------------------------------------------------------------
// Propiedades
// ---------------------------------------------------------------------------

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Generado del título. Se conserva al despublicar, para no romper enlaces. */
    slug: text('slug').notNull(),
    titleEs: text('title_es').notNull(),
    titleEn: text('title_en'),
    descriptionEs: text('description_es'),
    descriptionEn: text('description_en'),

    propertyTypeId: integer('property_type_id')
      .notNull()
      .references(() => propertyTypes.id, { onDelete: 'restrict' }),
    zoneId: integer('zone_id')
      .notNull()
      .references(() => zones.id, { onDelete: 'restrict' }),
    developerId: integer('developer_id').references(() => developers.id, { onDelete: 'set null' }),
    /** Interno. Jamás se expone en el sitio público. */
    ownerId: integer('owner_id').references(() => owners.id, { onDelete: 'set null' }),

    operation: operationEnum('operation').notNull(),
    constructionStatus: constructionStatusEnum('construction_status').notNull(),
    /** Antigüedad. Nulo en pozo y en terrenos. */
    yearBuilt: integer('year_built'),

    priceUsd: numeric('price_usd', { precision: 12, scale: 2 }),
    /** Si es verdadero se muestra "Precio a consultar". */
    priceOnRequest: boolean('price_on_request').notNull().default(false),

    areaCoveredM2: integer('area_covered_m2'),
    areaTotalM2: integer('area_total_m2'),
    /** 0 en terrenos. */
    bedrooms: integer('bedrooms').notNull().default(0),
    bathrooms: integer('bathrooms').notNull().default(0),

    /** Imagen principal: carrusel, listado y metadatos sociales. */
    coverPath: text('cover_path'),
    coverAltEs: text('cover_alt_es'),
    /**
     * Dimensiones del original de la portada.
     *
     * Sin esto había que suponerlas, y la suposición era 1600×1200. Una
     * portada más chica genera variantes solo hasta su propio ancho, así que
     * el HTML terminaba pidiendo un archivo que nunca se creó: imagen rota.
     * No se veía porque los datos de demostración fabrican todo a 1600×1200.
     */
    coverWidth: integer('cover_width'),
    coverHeight: integer('cover_height'),
    /** Carpeta de Drive con el video y material pesado (acuerdo, punto 3). */
    driveUrl: text('drive_url'),

    isFeatured: boolean('is_featured').notNull().default(false),
    featuredOrder: integer('featured_order'),

    status: propertyStatusEnum('status').notNull().default('borrador'),
    ownership: ownershipEnum('ownership').notNull().default('propia'),

    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('properties_slug_uq').on(t.slug),
    index('properties_status_idx').on(t.status),
    index('properties_featured_idx').on(t.isFeatured, t.featuredOrder),
    index('properties_zone_idx').on(t.zoneId),
    index('properties_type_idx').on(t.propertyTypeId),
    index('properties_operation_idx').on(t.operation),
    index('properties_price_idx').on(t.priceUsd),
    index('properties_bedrooms_idx').on(t.bedrooms),
  ],
);

/** Muchos a muchos entre propiedades y amenidades. */
export const propertyAmenities = pgTable(
  'property_amenities',
  {
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    amenityId: integer('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.propertyId, t.amenityId] })],
);

/**
 * Galería (D-11). Hasta 15 por propiedad — el tope protege el almacenamiento
 * gratuito. La portada es independiente y no cuenta acá.
 */
export const propertyImages = pgTable(
  'property_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    /** Ruta en el bucket, nunca una URL completa: el origen puede cambiar. */
    storagePath: text('storage_path').notNull(),
    altEs: text('alt_es'),
    /** Para reservar espacio y evitar saltos de layout. */
    width: integer('width'),
    height: integer('height'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('property_images_property_idx').on(t.propertyId, t.sortOrder)],
);

// ---------------------------------------------------------------------------
// Contenido editorial
// ---------------------------------------------------------------------------

/**
 * Noticias e informes comparten tabla: misma estructura, y así la clienta
 * puede publicar informes nuevos además de noticias (D-11).
 * El cuerpo es Markdown y SE SANEA AL RENDERIZAR (RNF-06).
 */
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    type: articleTypeEnum('type').notNull(),
    titleEs: text('title_es').notNull(),
    titleEn: text('title_en'),
    excerptEs: text('excerpt_es'),
    bodyEs: text('body_es'),
    coverPath: text('cover_path'),
    coverAltEs: text('cover_alt_es'),
    /** Mismo motivo que en `properties`: sin esto hay que suponer el tamaño. */
    coverWidth: integer('cover_width'),
    coverHeight: integer('cover_height'),
    status: articleStatusEnum('status').notNull().default('borrador'),
    /** Solo uno por tipo. Lo garantiza el índice parcial de la migración. */
    isPinned: boolean('is_pinned').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('articles_slug_uq').on(t.slug),
    index('articles_type_status_idx').on(t.type, t.status),
    index('articles_published_idx').on(t.publishedAt),
    // Un solo destacado por tipo. Lo garantiza la base, no la aplicación:
    // así no depende de que ningún camino del código se olvide de desmarcar.
    uniqueIndex('articles_one_pinned_per_type_uq')
      .on(t.type)
      .where(sql`${t.isPinned} = true`),
  ],
);

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/**
 * Consultas del formulario público.
 * ⚠️ `message` es contenido de origen público: SIEMPRE se escapa al mostrarlo.
 * `notes` es interno y nunca se expone.
 */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    interest: leadInterestEnum('interest').notNull().default('consulta'),
    message: text('message'),
    /** Desde qué propiedad consultó. Si se borra, el lead sobrevive. */
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    sourcePath: text('source_path'),
    status: leadStatusEnum('status').notNull().default('nuevo'),
    notes: text('notes'),
    /** Cuándo salió el aviso por mail. Nulo = el aviso falló, el lead NO se perdió (D-08). */
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('leads_status_idx').on(t.status),
    index('leads_created_idx').on(t.createdAt),
    index('leads_property_idx').on(t.propertyId),
  ],
);

// ---------------------------------------------------------------------------
// Control de intentos de acceso
// ---------------------------------------------------------------------------

/**
 * Marcas para limitar la frecuencia por IP.
 *
 * Vive en la base y no en memoria porque cada invocación de una función sin
 * servidor puede ser una instancia nueva: un contador en memoria se reiniciaría
 * todo el tiempo y el límite no frenaría nada.
 *
 * Se guarda un **hash de la IP**, nunca la IP en claro: alcanza para contar
 * repeticiones del mismo origen sin conservar un dato personal.
 *
 * `scope` separa los usos, que cuentan distinto y no deben mezclarse:
 * - `login` — solo se anotan los fallos, y un acceso correcto borra el historial
 * - `leads` — se anota **cada** consulta enviada, sin importar el resultado
 *
 * La tabla se llama `login_attempts` porque nació en D-13 sirviendo solo al
 * acceso. El nombre se quedó corto, pero renombrarla exige que drizzle-kit
 * pregunte si es un renombre o un borrar-y-crear, y eso pide una terminal
 * interactiva que acá no hay. **El nombre en SQL quedó viejo; el del código
 * dice lo que la tabla es hoy.** Si alguna vez se corre `drizzle-kit generate`
 * desde una terminal de verdad, vale la pena renombrarla: los datos duran
 * quince minutos, así que no hay nada que preservar.
 */
export const rateLimitHits = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull().default('login'),
    ipHash: text('ip_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('login_attempts_ip_time_idx').on(t.scope, t.ipHash, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Configuración del sitio
// ---------------------------------------------------------------------------

/** Textos y datos que la clienta edita sin tocar código. */
export const siteSettings = pgTable(
  'site_settings',
  {
    key: text('key').primaryKey(),
    valueEs: text('value_es'),
    valueEn: text('value_en'),
    group: text('group').notNull(),
    inputType: settingInputTypeEnum('input_type').notNull().default('texto'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('site_settings_group_idx').on(t.group)],
);

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------

export type AdminUser = typeof adminUsers.$inferSelect;
export type Zone = typeof zones.$inferSelect;
export type PropertyType = typeof propertyTypes.$inferSelect;
export type Developer = typeof developers.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type RateLimitHit = typeof rateLimitHits.$inferSelect;
