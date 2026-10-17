/**
 * La imagen de un artículo.
 *
 * Vive aparte de `articulosPanel.ts` por D-19: este archivo importa `images`,
 * que importa `sharp` —una librería nativa—, y `articulosPanel` lo usan dos
 * **páginas** del panel. Importar una cosa desde la otra arrastraba `sharp` a
 * esas páginas, que es la forma exacta de la falla que ya rompió un despliegue.
 *
 * Es la misma separación que ya existía entre `propiedades.ts` y
 * `imagenesPropiedad.ts`; acá faltaba.
 *
 * Base y almacenamiento entran por parámetro (D-17).
 */
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { articles } from '../db/schema';
import type { Almacenamiento } from './storage';
import { borrarImagen, procesarYGuardar } from './images';

export type ResultadoImagenArticulo =
  { tipo: 'ok'; rutaBase?: string } | { tipo: 'no-existe' } | { tipo: 'rechazada'; motivo: string };

export interface ArchivoEntrante {
  nombre: string;
  buffer: Buffer;
  tamanoDeclarado?: number | undefined;
}

export async function guardarPortadaArticulo(
  db: Db,
  almacen: Almacenamiento,
  id: string,
  archivo: ArchivoEntrante,
): Promise<ResultadoImagenArticulo> {
  const actual = (
    await db
      .select({
        slug: articles.slug,
        coverPath: articles.coverPath,
        coverWidth: articles.coverWidth,
      })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };

  const r = await procesarYGuardar(almacen, archivo.buffer, {
    carpeta: `articulos/${actual.slug}`,
    nombreOriginal: archivo.nombre,
    ...(archivo.tamanoDeclarado !== undefined ? { tamanoDeclarado: archivo.tamanoDeclarado } : {}),
  });
  if (!r.ok) return { tipo: 'rechazada', motivo: r.motivo };

  await db
    .update(articles)
    .set({
      coverPath: r.imagen.rutaBase,
      coverWidth: r.imagen.width,
      coverHeight: r.imagen.height,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id));

  // La anterior se borra recién ahora: si algo falla antes, el artículo se
  // queda con la imagen vieja en vez de quedarse sin ninguna.
  if (actual.coverPath) {
    await borrarImagen(almacen, actual.coverPath, actual.coverWidth ?? 1600).catch(() => {});
  }

  return { tipo: 'ok', rutaBase: r.imagen.rutaBase };
}

export async function borrarPortadaArticulo(
  db: Db,
  almacen: Almacenamiento,
  id: string,
): Promise<ResultadoImagenArticulo> {
  const actual = (
    await db
      .select({ coverPath: articles.coverPath, coverWidth: articles.coverWidth })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };
  if (!actual.coverPath) return { tipo: 'ok' };

  await db
    .update(articles)
    .set({ coverPath: null, coverWidth: null, coverHeight: null, updatedAt: new Date() })
    .where(eq(articles.id, id));

  await borrarImagen(almacen, actual.coverPath, actual.coverWidth ?? 1600).catch(() => {});

  return { tipo: 'ok' };
}
