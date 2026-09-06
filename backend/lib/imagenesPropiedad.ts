/**
 * Portada y galería de una propiedad.
 *
 * Base y almacenamiento entran por parámetro (D-17): así se pueden probar el
 * archivo rechazado, el tope de la galería y el reordenamiento sin subir nada
 * a un bucket de verdad.
 *
 * La validación pesada ya la hizo IT-03: `procesarYGuardar` mira la **firma
 * binaria** del archivo antes de pasárselo a Sharp, así que un `.exe`
 * renombrado a `.jpg` se rechaza por lo que es, no por cómo se llama.
 */
import { eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { properties, propertyImages } from '../db/schema';
import type { Almacenamiento } from './storage';
import { borrarImagen, procesarYGuardar } from './images';
import { verificarCupoGaleria } from './imageValidation';

export type ResultadoImagen =
  { tipo: 'ok' } | { tipo: 'no-existe' } | { tipo: 'rechazada'; motivo: string };

export interface ArchivoEntrante {
  nombre: string;
  buffer: Buffer;
  tamanoDeclarado?: number | undefined;
}

// --- Portada -----------------------------------------------------------------

export async function guardarPortada(
  db: Db,
  almacen: Almacenamiento,
  propiedadId: string,
  archivo: ArchivoEntrante,
): Promise<ResultadoImagen & { rutaBase?: string }> {
  const actual = (
    await db
      .select({
        id: properties.id,
        slug: properties.slug,
        coverPath: properties.coverPath,
        coverWidth: properties.coverWidth,
      })
      .from(properties)
      .where(eq(properties.id, propiedadId))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };

  const r = await procesarYGuardar(almacen, archivo.buffer, {
    carpeta: `propiedades/${actual.slug}`,
    nombreOriginal: archivo.nombre,
    ...(archivo.tamanoDeclarado !== undefined ? { tamanoDeclarado: archivo.tamanoDeclarado } : {}),
  });
  if (!r.ok) return { tipo: 'rechazada', motivo: r.motivo };

  // Las dimensiones se guardan: de ellas depende qué variante pide el HTML.
  await db
    .update(properties)
    .set({
      coverPath: r.imagen.rutaBase,
      coverWidth: r.imagen.width,
      coverHeight: r.imagen.height,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propiedadId));

  // La anterior se borra recién ahora: si algo falla antes, la propiedad se
  // queda con la portada vieja en vez de quedarse sin ninguna.
  if (actual.coverPath) {
    await borrarImagen(almacen, actual.coverPath, actual.coverWidth ?? 1600).catch(() => {});
  }

  return { tipo: 'ok', rutaBase: r.imagen.rutaBase };
}

export async function borrarPortada(
  db: Db,
  almacen: Almacenamiento,
  propiedadId: string,
): Promise<ResultadoImagen> {
  const actual = (
    await db
      .select({
        coverPath: properties.coverPath,
        coverWidth: properties.coverWidth,
        status: properties.status,
      })
      .from(properties)
      .where(eq(properties.id, propiedadId))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };

  // Una propiedad publicada sin portada quedaría con un hueco en el catálogo
  // y se compartiría sin foto. Primero se despublica.
  if (actual.status === 'publicado') {
    return {
      tipo: 'rechazada',
      motivo:
        'No podés quitar la imagen principal de una propiedad publicada. Pasala a borrador primero',
    };
  }

  if (!actual.coverPath) return { tipo: 'ok' };

  await db
    .update(properties)
    .set({ coverPath: null, coverWidth: null, coverHeight: null, updatedAt: new Date() })
    .where(eq(properties.id, propiedadId));

  await borrarImagen(almacen, actual.coverPath, actual.coverWidth ?? 1600).catch(() => {});
  return { tipo: 'ok' };
}

// --- Galería -----------------------------------------------------------------

export async function agregarAGaleria(
  db: Db,
  almacen: Almacenamiento,
  propiedadId: string,
  archivos: ArchivoEntrante[],
): Promise<ResultadoImagen & { agregadas?: number }> {
  const prop = (
    await db
      .select({ slug: properties.slug })
      .from(properties)
      .where(eq(properties.id, propiedadId))
      .limit(1)
  )[0];
  if (!prop) return { tipo: 'no-existe' };

  const actuales = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propiedadId));

  const cupo = verificarCupoGaleria(actuales[0]?.n ?? 0, archivos.length);
  if (!cupo.ok) return { tipo: 'rechazada', motivo: cupo.motivo };

  const ultimo = await db
    .select({ max: sql<number>`coalesce(max(${propertyImages.sortOrder}), -1)::int` })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propiedadId));

  let orden = (ultimo[0]?.max ?? -1) + 1;
  let agregadas = 0;

  for (const archivo of archivos) {
    const r = await procesarYGuardar(almacen, archivo.buffer, {
      carpeta: `propiedades/${prop.slug}/galeria`,
      nombreOriginal: archivo.nombre,
      ...(archivo.tamanoDeclarado !== undefined
        ? { tamanoDeclarado: archivo.tamanoDeclarado }
        : {}),
    });

    // Una foto rechazada no cancela las demás: si alguien arrastra diez y una
    // está rota, es mejor guardar nueve que perder las diez.
    if (!r.ok) continue;

    await db.insert(propertyImages).values({
      propertyId: propiedadId,
      storagePath: r.imagen.rutaBase,
      width: r.imagen.width,
      height: r.imagen.height,
      sortOrder: orden++,
    });
    agregadas++;
  }

  if (agregadas === 0) {
    return {
      tipo: 'rechazada',
      motivo: 'Ninguna de las imágenes se pudo usar. Tienen que ser JPG, PNG o WebP de hasta 10 MB',
    };
  }

  return { tipo: 'ok', agregadas };
}

export async function borrarDeGaleria(
  db: Db,
  almacen: Almacenamiento,
  propiedadId: string,
  imagenId: string,
): Promise<ResultadoImagen> {
  const img = (
    await db.select().from(propertyImages).where(eq(propertyImages.id, imagenId)).limit(1)
  )[0];

  if (!img || img.propertyId !== propiedadId) return { tipo: 'no-existe' };

  await db.delete(propertyImages).where(eq(propertyImages.id, imagenId));
  await borrarImagen(almacen, img.storagePath, img.width ?? 1600).catch(() => {});
  return { tipo: 'ok' };
}

/** Nuevo orden y textos alternativos. Llega la lista completa, ya ordenada. */
export async function actualizarGaleria(
  db: Db,
  propiedadId: string,
  items: { id: string; alt?: string | null }[],
): Promise<ResultadoImagen> {
  const propias = await db
    .select({ id: propertyImages.id })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propiedadId));

  const validos = new Set(propias.map((p) => p.id));

  let orden = 0;
  for (const item of items) {
    // Se ignora cualquier id que no sea de esta propiedad: si no, se podría
    // reordenar la galería de otra mandando su id acá.
    if (!validos.has(item.id)) continue;

    await db
      .update(propertyImages)
      .set({
        sortOrder: orden++,
        altEs: item.alt?.trim() ? item.alt.trim().slice(0, 300) : null,
      })
      .where(eq(propertyImages.id, item.id));
  }

  return { tipo: 'ok' };
}
