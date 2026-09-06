/**
 * Consultas que alimentan el sitio público.
 *
 * Corren **al construir el sitio**, no en cada visita (D-04): las páginas se
 * generan una vez y se sirven como HTML estático. Por eso importa poco que una
 * consulta sea pesada, y mucho que el resultado sea completo.
 *
 * ⚠️ Nada de acá puede devolver datos de `owners`. Son datos de contacto de
 * terceros y no se exponen jamás (D-09).
 */
import { and, asc, desc, eq } from 'drizzle-orm';
import { getDb } from '../../../backend/db/client';
import {
  amenities,
  articles,
  properties,
  propertyAmenities,
  propertyImages,
  propertyTypes,
  siteSettings,
  zones,
} from '../../../backend/db/schema';
import { crearAlmacenamientoS3 } from '../../../backend/lib/storage';
// Del módulo sin dependencias, no de `images.ts`: ese arrastra sharp, que
// no hace falta para calcular anchos y no carga en el servidor de Netlify.
import { ANCHOS, anchosPara } from '../../../backend/lib/anchosImagen';

const db = getDb();

// --- Configuración del sitio ------------------------------------------------

export type Configuracion = Record<string, string>;

let cacheConfig: Configuracion | null = null;

/** Los textos editables. Se consulta una vez por build. */
export async function obtenerConfiguracion(): Promise<Configuracion> {
  if (cacheConfig) return cacheConfig;
  const filas = await db.select().from(siteSettings);
  cacheConfig = Object.fromEntries(filas.map((f) => [f.key, f.valueEs ?? '']));
  return cacheConfig;
}

/** Devuelve el valor o el respaldo. Nunca deja un hueco en la página. */
export function valor(config: Configuracion, clave: string, respaldo = ''): string {
  const v = config[clave];
  return v && v.trim() !== '' ? v : respaldo;
}

// --- Imágenes ---------------------------------------------------------------

let almacen: ReturnType<typeof crearAlmacenamientoS3> | null = null;

function obtenerAlmacen() {
  almacen ??= crearAlmacenamientoS3();
  return almacen;
}

export interface ImagenLista {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Arma lo que necesita una etiqueta `<img>` a partir de la ruta guardada.
 *
 * Las variantes de una imagen llegan solo hasta su propio ancho, así que
 * suponer que mide más de lo que mide hace pedir un archivo inexistente. Si el
 * ancho no está guardado se usa **el más chico** de los anchos posibles: en el
 * peor caso la foto se ve algo menos nítida, que es infinitamente mejor que el
 * recuadro roto que dejaba suponer 1600.
 */
export function prepararImagen(
  rutaBase: string | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
  alt: string,
): ImagenLista | null {
  if (!rutaBase) return null;
  const a = obtenerAlmacen();
  const anchoReal = width ?? ANCHOS[0];
  const anchos = anchosPara(anchoReal);
  const mayor = anchos[anchos.length - 1] ?? anchoReal;
  return {
    src: a.urlPublica(`${rutaBase}-${mayor}.webp`),
    srcset: anchos.map((n) => `${a.urlPublica(`${rutaBase}-${n}.webp`)} ${n}w`).join(', '),
    width: anchoReal,
    height: height ?? Math.round(anchoReal * 0.75),
    alt,
  };
}

// --- Propiedades ------------------------------------------------------------

export interface PropiedadLista {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  pais: string;
  ubicacion: string;
  zonaSlug: string;
  tipologia: string;
  tipologiaSlug: string;
  esTerreno: boolean;
  operacion: 'venta' | 'renta';
  estadoObra: 'pozo' | 'construccion' | 'terminado';
  anio: number | null;
  precioUsd: number | null;
  precioAConsultar: boolean;
  metrosCubiertos: number | null;
  metrosTotales: number | null;
  dormitorios: number;
  banos: number;
  portada: ImagenLista | null;
  driveUrl: string | null;
  destacada: boolean;
  ordenDestacada: number | null;
}

/** Campos que se seleccionan explícitamente. Se listan uno por uno a propósito:
 *  un `select *` traería `owner_id` y datos internos sin que nadie lo note. */
const camposPublicos = {
  id: properties.id,
  slug: properties.slug,
  titulo: properties.titleEs,
  descripcion: properties.descriptionEs,
  operacion: properties.operation,
  estadoObra: properties.constructionStatus,
  anio: properties.yearBuilt,
  precioUsd: properties.priceUsd,
  precioAConsultar: properties.priceOnRequest,
  metrosCubiertos: properties.areaCoveredM2,
  metrosTotales: properties.areaTotalM2,
  dormitorios: properties.bedrooms,
  banos: properties.bathrooms,
  coverPath: properties.coverPath,
  coverAlt: properties.coverAltEs,
  coverWidth: properties.coverWidth,
  coverHeight: properties.coverHeight,
  driveUrl: properties.driveUrl,
  destacada: properties.isFeatured,
  ordenDestacada: properties.featuredOrder,
  ciudad: zones.city,
  zona: zones.zone,
  zonaSlug: zones.slug,
  pais: zones.country,
  tipologia: propertyTypes.nameEs,
  tipologiaSlug: propertyTypes.slug,
};

function aPropiedad(f: Record<string, unknown>): PropiedadLista {
  const tipologiaSlug = String(f.tipologiaSlug);
  return {
    id: String(f.id),
    slug: String(f.slug),
    titulo: String(f.titulo),
    descripcion: (f.descripcion as string | null) ?? null,
    pais: String(f.pais),
    ubicacion: String(f.ciudad),
    zonaSlug: String(f.zonaSlug),
    tipologia: String(f.tipologia),
    tipologiaSlug,
    esTerreno: tipologiaSlug === 'terreno',
    operacion: f.operacion as 'venta' | 'renta',
    estadoObra: f.estadoObra as 'pozo' | 'construccion' | 'terminado',
    anio: (f.anio as number | null) ?? null,
    precioUsd: f.precioUsd != null ? Number(f.precioUsd) : null,
    precioAConsultar: Boolean(f.precioAConsultar),
    metrosCubiertos: (f.metrosCubiertos as number | null) ?? null,
    metrosTotales: (f.metrosTotales as number | null) ?? null,
    dormitorios: Number(f.dormitorios ?? 0),
    banos: Number(f.banos ?? 0),
    // Las dimensiones salen de la base, no de una suposición: si la portada
    // mide menos de 1600 px, sus variantes llegan solo hasta su propio ancho
    // y pedir `-1600.webp` daría una imagen rota.
    portada: prepararImagen(
      f.coverPath as string | null,
      (f.coverWidth as number | null) ?? undefined,
      (f.coverHeight as number | null) ?? undefined,
      (f.coverAlt as string | null) ?? String(f.titulo),
    ),
    driveUrl: (f.driveUrl as string | null) ?? null,
    destacada: Boolean(f.destacada),
    ordenDestacada: (f.ordenDestacada as number | null) ?? null,
  };
}

/** Las destacadas del carrusel, en el orden que definió la clienta. */
export async function obtenerDestacadas(): Promise<PropiedadLista[]> {
  const filas = await db
    .select(camposPublicos)
    .from(properties)
    .innerJoin(zones, eq(properties.zoneId, zones.id))
    .innerJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
    .where(and(eq(properties.status, 'publicado'), eq(properties.isFeatured, true)))
    .orderBy(asc(properties.featuredOrder));
  return filas.map(aPropiedad);
}

/** Todas las publicadas. Solo `publicado`: los borradores no salen al sitio. */
export async function obtenerPublicadas(): Promise<PropiedadLista[]> {
  const filas = await db
    .select(camposPublicos)
    .from(properties)
    .innerJoin(zones, eq(properties.zoneId, zones.id))
    .innerJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
    .where(eq(properties.status, 'publicado'))
    .orderBy(desc(properties.publishedAt));
  return filas.map(aPropiedad);
}

export async function obtenerPropiedad(slug: string) {
  const filas = await db
    .select(camposPublicos)
    .from(properties)
    .innerJoin(zones, eq(properties.zoneId, zones.id))
    .innerJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
    .where(and(eq(properties.slug, slug), eq(properties.status, 'publicado')))
    .limit(1);

  const fila = filas[0];
  if (!fila) return null;

  const propiedad = aPropiedad(fila);

  const imgs = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propiedad.id))
    .orderBy(asc(propertyImages.sortOrder));

  const comodidades = await db
    .select({ nombre: amenities.nameEs, icono: amenities.icon })
    .from(propertyAmenities)
    .innerJoin(amenities, eq(propertyAmenities.amenityId, amenities.id))
    .where(eq(propertyAmenities.propertyId, propiedad.id));

  return {
    ...propiedad,
    galeria: imgs
      .map((i) => prepararImagen(i.storagePath, i.width, i.height, i.altEs ?? propiedad.titulo))
      .filter((i): i is ImagenLista => i !== null),
    comodidades,
  };
}

/**
 * Hasta tres propiedades parecidas: primero las de la misma zona, después las
 * de la misma operación. Nunca se devuelve la propiedad que se está viendo.
 */
export async function obtenerSimilares(
  propiedad: PropiedadLista,
  limite = 3,
): Promise<PropiedadLista[]> {
  const todas = await obtenerPublicadas();
  const otras = todas.filter((p) => p.id !== propiedad.id);

  const mismaZona = otras.filter((p) => p.zonaSlug === propiedad.zonaSlug);
  const mismaOperacion = otras.filter(
    (p) => p.operacion === propiedad.operacion && !mismaZona.includes(p),
  );

  return [...mismaZona, ...mismaOperacion].slice(0, limite);
}

// --- Catálogos para el buscador ---------------------------------------------

export async function obtenerZonas() {
  return db.select().from(zones).orderBy(asc(zones.sortOrder));
}

export async function obtenerTipologias() {
  return db.select().from(propertyTypes).orderBy(asc(propertyTypes.sortOrder));
}

// --- Artículos --------------------------------------------------------------

export async function obtenerInformeDestacado() {
  const filas = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.type, 'informe'),
        eq(articles.status, 'publicado'),
        eq(articles.isPinned, true),
      ),
    )
    .limit(1);
  return filas[0] ?? null;
}

export async function obtenerNoticias(limite?: number) {
  const consulta = db
    .select()
    .from(articles)
    .where(and(eq(articles.type, 'noticia'), eq(articles.status, 'publicado')))
    .orderBy(desc(articles.publishedAt));
  return limite ? consulta.limit(limite) : consulta;
}

export async function obtenerArticulo(slug: string) {
  const filas = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, 'publicado')))
    .limit(1);
  return filas[0] ?? null;
}
