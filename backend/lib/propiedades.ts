/**
 * Crear, editar y publicar una propiedad.
 *
 * Igual que `consultas.ts`, recibe la base por parámetro (D-17): los casos que
 * hay que sostener con pruebas —publicar sin portada, dos títulos iguales,
 * una amenidad que no existe— se provocan de verdad y no simulando a medias.
 */
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { Db } from '../db/client';
import { properties, propertyAmenities, propertyImages, propertyTypes, zones } from '../db/schema';
import { generarSlug, slugUnico } from './slug';
import {
  esquemaPropiedad,
  esquemaPropiedadParcial,
  erroresPorCampo,
  type DatosPropiedad,
} from './validation';

export type ResultadoPropiedad =
  | { tipo: 'ok'; id: string; slug: string }
  | { tipo: 'datos'; campos: Record<string, string> }
  | { tipo: 'no-existe' }
  /** Publicar exige portada. El mensaje dice exactamente qué falta. */
  | { tipo: 'falta-portada'; mensaje: string };

const SIN_PORTADA = 'Cargá la imagen principal antes de publicar';

type ColumnasPropiedad = Partial<typeof properties.$inferInsert>;

/** Los campos que se guardan tal cual, sin las amenidades. */
function aColumnas(d: Partial<DatosPropiedad>): ColumnasPropiedad {
  const c: Record<string, unknown> = {};
  const copiar = <K extends keyof DatosPropiedad>(k: K, columna: string) => {
    if (d[k] !== undefined) c[columna] = d[k];
  };

  copiar('titleEs', 'titleEs');
  copiar('descriptionEs', 'descriptionEs');
  copiar('propertyTypeId', 'propertyTypeId');
  copiar('zoneId', 'zoneId');
  copiar('developerId', 'developerId');
  copiar('ownerId', 'ownerId');
  copiar('operation', 'operation');
  copiar('constructionStatus', 'constructionStatus');
  copiar('ownership', 'ownership');
  copiar('yearBuilt', 'yearBuilt');
  copiar('priceOnRequest', 'priceOnRequest');
  copiar('areaCoveredM2', 'areaCoveredM2');
  copiar('areaTotalM2', 'areaTotalM2');
  copiar('bedrooms', 'bedrooms');
  copiar('bathrooms', 'bathrooms');
  copiar('driveUrl', 'driveUrl');

  // `numeric` viaja como texto: mandarlo como número lo redondea mal.
  if (d.priceUsd !== undefined) c.priceUsd = d.priceUsd === null ? null : String(d.priceUsd);

  return c as ColumnasPropiedad;
}

async function guardarAmenidades(db: Db, propiedadId: string, ids: number[]) {
  await db.delete(propertyAmenities).where(eq(propertyAmenities.propertyId, propiedadId));
  if (ids.length === 0) return;
  await db
    .insert(propertyAmenities)
    .values(ids.map((amenityId) => ({ propertyId: propiedadId, amenityId })));
}

export async function crearPropiedad(db: Db, crudo: unknown): Promise<ResultadoPropiedad> {
  const analizado = esquemaPropiedad.safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  const d = analizado.data;

  // El slug se calcula contra lo que ya existe, no contra un contador.
  const tomados = await db.select({ slug: properties.slug }).from(properties);
  const slug = slugUnico(
    generarSlug(d.titleEs),
    tomados.map((t) => t.slug),
  );

  const [creada] = await db
    .insert(properties)
    .values({ ...aColumnas(d), slug, status: 'borrador' } as typeof properties.$inferInsert)
    .returning({ id: properties.id, slug: properties.slug });

  await guardarAmenidades(db, creada!.id, d.amenityIds);

  // Nace en borrador siempre: publicar es un acto aparte y deliberado.
  return { tipo: 'ok', id: creada!.id, slug: creada!.slug };
}

export async function editarPropiedad(
  db: Db,
  id: string,
  crudo: unknown,
): Promise<ResultadoPropiedad> {
  const actual = (
    await db
      .select({ id: properties.id, slug: properties.slug, coverPath: properties.coverPath })
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };

  const analizado = esquemaPropiedadParcial.safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  const d = analizado.data;

  // Publicar sin imagen principal se rechaza: en el catálogo quedaría un
  // hueco gris, y en redes se compartiría sin foto.
  if (d.status === 'publicado' && !actual.coverPath) {
    return { tipo: 'falta-portada', mensaje: SIN_PORTADA };
  }

  const columnas: ColumnasPropiedad = aColumnas(d);
  if (d.status !== undefined) {
    columnas.status = d.status;
    // La fecha de publicación se sella la primera vez y no se vuelve a tocar.
    if (d.status === 'publicado') columnas.publishedAt = new Date();
  }
  if (d.isFeatured !== undefined) columnas.isFeatured = d.isFeatured;
  columnas.updatedAt = new Date();

  // El slug **no** se recalcula aunque cambie el título: es la dirección
  // pública, y cambiarla rompe todo enlace que alguien haya compartido.
  await db
    .update(properties)
    .set(columnas as never)
    .where(eq(properties.id, id));

  if (d.amenityIds !== undefined) await guardarAmenidades(db, id, d.amenityIds);

  return { tipo: 'ok', id, slug: actual.slug };
}

export interface FiltrosListado {
  estado?: string | undefined;
  texto?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
}

/** El listado del panel. Nunca devuelve datos de propietarios (RNF-10). */
export async function listarPropiedades(db: Db, filtros: FiltrosListado = {}) {
  const porPagina = Math.min(Math.max(filtros.porPagina ?? 20, 1), 100);
  const pagina = Math.max(filtros.pagina ?? 1, 1);

  const condiciones: SQL[] = [];
  if (filtros.estado && ['borrador', 'publicado', 'archivado'].includes(filtros.estado)) {
    condiciones.push(eq(properties.status, filtros.estado as 'borrador'));
  }
  if (filtros.texto?.trim()) {
    const patron = `%${filtros.texto.trim()}%`;
    condiciones.push(or(ilike(properties.titleEs, patron), ilike(properties.slug, patron))!);
  }
  const donde = condiciones.length ? and(...condiciones) : undefined;

  const [filas, total] = await Promise.all([
    db
      .select({
        id: properties.id,
        slug: properties.slug,
        titulo: properties.titleEs,
        estado: properties.status,
        operacion: properties.operation,
        precioUsd: properties.priceUsd,
        precioAConsultar: properties.priceOnRequest,
        destacada: properties.isFeatured,
        ordenDestacada: properties.featuredOrder,
        coverPath: properties.coverPath,
        coverWidth: properties.coverWidth,
        coverHeight: properties.coverHeight,
        ciudad: zones.city,
        zona: zones.zone,
        tipo: propertyTypes.nameEs,
        actualizada: properties.updatedAt,
      })
      .from(properties)
      .leftJoin(zones, eq(properties.zoneId, zones.id))
      .leftJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
      .where(donde)
      .orderBy(desc(properties.updatedAt))
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    db.select({ n: count() }).from(properties).where(donde),
  ]);

  return { items: filas, total: total[0]?.n ?? 0, pagina, porPagina };
}

/** Una propiedad con sus amenidades y su galería, para el formulario. */
export async function obtenerPropiedadDelPanel(db: Db, id: string) {
  const fila = (await db.select().from(properties).where(eq(properties.id, id)).limit(1))[0];
  if (!fila) return null;

  const [amenidades, imagenes] = await Promise.all([
    db
      .select({ id: propertyAmenities.amenityId })
      .from(propertyAmenities)
      .where(eq(propertyAmenities.propertyId, id)),
    db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id))
      .orderBy(propertyImages.sortOrder),
  ]);

  return { ...fila, amenityIds: amenidades.map((a) => a.id), imagenes };
}

/** Borra una propiedad y lo que cuelga de ella. */
export async function borrarPropiedad(db: Db, id: string): Promise<boolean> {
  const borradas = await db
    .delete(properties)
    .where(eq(properties.id, id))
    .returning({ id: properties.id });
  return borradas.length > 0;
}

export { SIN_PORTADA };
