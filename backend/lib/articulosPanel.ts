/**
 * Noticias e informes vistos desde el panel.
 *
 * Comparten tabla porque comparten estructura, y así la clienta puede publicar
 * informes nuevos además de noticias (D-11). El informe Reyna Insights de la
 * portada es un artículo con `type='informe'` y `is_pinned`.
 *
 * Cuatro reglas gobiernan este archivo.
 *
 * 1. **La dirección pública no se recalcula.** El slug se genera del título la
 *    primera vez y se queda, aunque después se corrija el título. Cambiarlo
 *    rompe todo enlace que alguien haya compartido.
 * 2. **Publicar exige título y texto.** Una noticia publicada vacía deja una
 *    tarjeta en el sitio que lleva a una página en blanco.
 * 3. **Un solo destacado por tipo.** Lo garantiza un índice de la base, no el
 *    código, así que marcar uno nuevo tiene que desmarcar el anterior **antes**
 *    o la base rechaza la escritura.
 * 4. **Borrar un artículo borra su imagen.** Si no, el archivo queda ocupando
 *    el almacenamiento para siempre, sin nada que lo nombre.
 *
 * Base y almacenamiento entran por parámetro (D-17).
 */
import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import type { Db } from '../db/client';
import { articles } from '../db/schema';
import type { Almacenamiento } from './storage';
import { borrarImagen, procesarYGuardar } from './images';
import { generarSlug, slugUnico } from './slug';
import {
  erroresPorCampo,
  esquemaArticulo,
  esquemaArticuloParcial,
  type DatosArticulo,
} from './validation';

export const ETIQUETA_TIPO = { noticia: 'Noticia', informe: 'Informe' } as const;
export const ETIQUETA_ESTADO_ARTICULO = { borrador: 'Borrador', publicado: 'Publicada' } as const;

export const SIN_TEXTO = 'Escribí el texto antes de publicar';

export type ResultadoArticulo =
  | { tipo: 'ok'; id: string; slug: string }
  | { tipo: 'datos'; campos: Record<string, string> }
  | { tipo: 'no-existe' }
  | { tipo: 'falta-texto'; mensaje: string };

type Columnas = Partial<typeof articles.$inferInsert>;

function aColumnas(d: Partial<DatosArticulo>): Columnas {
  const c: Columnas = {};
  if (d.type !== undefined) c.type = d.type;
  if (d.titleEs !== undefined) c.titleEs = d.titleEs;
  if (d.excerptEs !== undefined) c.excerptEs = d.excerptEs;
  if (d.bodyEs !== undefined) c.bodyEs = d.bodyEs;
  if (d.coverAltEs !== undefined) c.coverAltEs = d.coverAltEs;
  return c;
}

/**
 * Deja un solo destacado del tipo.
 *
 * Va antes de marcar el nuevo: el índice parcial de la base no admite dos, y
 * si se intentara al revés la escritura fallaría con un error de restricción
 * en vez de hacer lo que se pidió.
 */
async function desmarcarDestacado(db: Db, tipo: 'noticia' | 'informe', salvo?: string) {
  const actuales = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.type, tipo), eq(articles.isPinned, true)));

  for (const a of actuales) {
    if (a.id === salvo) continue;
    await db.update(articles).set({ isPinned: false }).where(eq(articles.id, a.id));
  }
}

export async function crearArticulo(db: Db, crudo: unknown): Promise<ResultadoArticulo> {
  const analizado = esquemaArticulo.safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  const d = analizado.data;

  const tomados = await db.select({ slug: articles.slug }).from(articles);
  const slug = slugUnico(
    generarSlug(d.titleEs),
    tomados.map((t) => t.slug),
  );

  const [creado] = await db
    .insert(articles)
    .values({
      ...aColumnas(d),
      slug,
      status: 'borrador',
      isPinned: false,
    } as typeof articles.$inferInsert)
    .returning({ id: articles.id, slug: articles.slug });

  // Nace en borrador siempre: publicar es un acto aparte y deliberado.
  return { tipo: 'ok', id: creado!.id, slug: creado!.slug };
}

export async function editarArticulo(
  db: Db,
  id: string,
  crudo: unknown,
): Promise<ResultadoArticulo> {
  const actual = (
    await db
      .select({
        id: articles.id,
        slug: articles.slug,
        type: articles.type,
        bodyEs: articles.bodyEs,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1)
  )[0];
  if (!actual) return { tipo: 'no-existe' };

  const analizado = esquemaArticuloParcial.safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  const d = analizado.data;

  // Publicar sin texto deja una tarjeta en el sitio que lleva a una página en
  // blanco. Se mira el texto que va a quedar, no el que había.
  const textoFinal = d.bodyEs !== undefined ? d.bodyEs : actual.bodyEs;
  if (d.status === 'publicado' && (!textoFinal || textoFinal.trim() === '')) {
    return { tipo: 'falta-texto', mensaje: SIN_TEXTO };
  }

  const columnas: Columnas = aColumnas(d);
  if (d.status !== undefined) {
    columnas.status = d.status;
    // La fecha se sella la primera vez y no se vuelve a tocar: si cambiara en
    // cada edición, corregir una coma reordenaría las noticias del sitio.
    if (d.status === 'publicado' && !actual.publishedAt) columnas.publishedAt = new Date();
  }

  const tipoFinal = d.type ?? actual.type;
  if (d.isPinned !== undefined) {
    if (d.isPinned) await desmarcarDestacado(db, tipoFinal, id);
    columnas.isPinned = d.isPinned;
  } else if (d.type !== undefined && d.type !== actual.type) {
    // Cambió de tipo llevándose su marca de destacado: podría chocar con el
    // destacado del tipo nuevo, y la base rechazaría la escritura.
    await desmarcarDestacado(db, tipoFinal, id);
  }

  columnas.updatedAt = new Date();

  // El slug **no** se recalcula aunque cambie el título.
  await db.update(articles).set(columnas).where(eq(articles.id, id));

  return { tipo: 'ok', id, slug: actual.slug };
}

export interface FiltrosArticulos {
  tipo?: string | undefined;
  estado?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
}

export async function listarArticulos(db: Db, filtros: FiltrosArticulos = {}) {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(200, Math.max(1, filtros.porPagina ?? 50));

  const condiciones: SQL[] = [];
  if (filtros.tipo === 'noticia' || filtros.tipo === 'informe') {
    condiciones.push(eq(articles.type, filtros.tipo));
  }
  if (filtros.estado === 'borrador' || filtros.estado === 'publicado') {
    condiciones.push(eq(articles.status, filtros.estado));
  }
  const donde = condiciones.length ? and(...condiciones) : undefined;

  const [filas, total] = await Promise.all([
    db
      .select({
        id: articles.id,
        slug: articles.slug,
        titulo: articles.titleEs,
        tipo: articles.type,
        estado: articles.status,
        destacado: articles.isPinned,
        copete: articles.excerptEs,
        coverPath: articles.coverPath,
        coverWidth: articles.coverWidth,
        publicado: articles.publishedAt,
        actualizado: articles.updatedAt,
      })
      .from(articles)
      .where(donde)
      // Lo último que se tocó arriba: es donde está trabajando quien entra.
      .orderBy(desc(articles.updatedAt))
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    db.select({ n: count() }).from(articles).where(donde),
  ]);

  return { items: filas, total: total[0]?.n ?? 0, pagina, porPagina };
}

export async function obtenerArticuloDelPanel(db: Db, id: string) {
  return (await db.select().from(articles).where(eq(articles.id, id)).limit(1))[0] ?? null;
}

/**
 * Borra el artículo y su imagen.
 *
 * El archivo se borra **después** de la fila: si se hiciera al revés y la
 * fila no se pudiera borrar, el artículo quedaría apuntando a una imagen que
 * ya no existe. Que el borrado del archivo falle es tolerable —queda un
 * archivo huérfano— y no se cancela la operación por eso.
 */
export async function borrarArticulo(
  db: Db,
  almacen: Almacenamiento,
  id: string,
): Promise<boolean> {
  const borrados = await db
    .delete(articles)
    .where(eq(articles.id, id))
    .returning({ coverPath: articles.coverPath, coverWidth: articles.coverWidth });

  const a = borrados[0];
  if (!a) return false;

  if (a.coverPath) {
    await borrarImagen(almacen, a.coverPath, a.coverWidth ?? 1600).catch(() => {});
  }
  return true;
}

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
