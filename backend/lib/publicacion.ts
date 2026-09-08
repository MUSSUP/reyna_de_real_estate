/**
 * Publicar los cambios: regenerar el sitio público.
 *
 * El sitio es estático (D-04): las visitas no tocan la base, así que un cambio
 * guardado en el panel **no se ve hasta que el sitio se vuelve a generar**.
 * Este módulo es el puente entre las dos cosas.
 *
 * Igual que el resto, recibe la base y el disparador por parámetro (D-17): así
 * se prueban el agrupado y el webhook caído sin llamar a Netlify de verdad.
 */
import { desc, gt, max, ne, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { articles, properties, propertyImages, publicaciones, siteSettings } from '../db/schema';

/**
 * Cuánto se agrupan los pedidos.
 *
 * Guardar cinco propiedades seguidas no debe producir cinco regeneraciones:
 * cada una tarda minutos y consume minutos de build del plan gratuito. Dentro
 * de esta ventana, el segundo pedido y los siguientes se contestan "ya está
 * encolada" sin volver a disparar.
 */
export const VENTANA_AGRUPADO_SEGUNDOS = 60;

/** Cuánto suele tardar en verse. Es una estimación honesta, no una promesa. */
export const SEGUNDOS_ESTIMADOS = 90;

export type ResultadoPublicacion =
  | { tipo: 'encolada'; estimadoSegundos: number }
  /** Ya había una reciente: se contesta bien, pero no se dispara otra. */
  | { tipo: 'ya-encolada'; estimadoSegundos: number }
  | { tipo: 'sin-configurar'; mensaje: string }
  | { tipo: 'fallo'; mensaje: string };

/** Quien dispara el webhook. Se inyecta para poder probar sin salir a la red. */
export type Disparador = (url: string) => Promise<{ ok: boolean; estado?: number }>;

export const disparadorReal: Disparador = async (url) => {
  const r = await fetch(url, { method: 'POST' });
  return { ok: r.ok, estado: r.status };
};

/** La última vez que se pidió regenerar. */
export async function ultimaPublicacion(db: Db): Promise<Date | null> {
  const f = await db
    .select({ cuando: publicaciones.createdAt })
    .from(publicaciones)
    .orderBy(desc(publicaciones.createdAt))
    .limit(1);
  return f[0]?.cuando ?? null;
}

/**
 * La última vez que cambió algo que se ve en el sitio.
 *
 * Se miran las tres tablas que alimentan páginas más las imágenes de galería.
 * De `site_settings` se excluye lo que no sale al sitio, para no marcar
 * cambios pendientes por algo que el visitante no vería.
 */
export async function ultimoCambio(db: Db): Promise<Date | null> {
  const [props, arts, ajustes, imgs] = await Promise.all([
    db.select({ m: max(properties.updatedAt) }).from(properties),
    db.select({ m: max(articles.updatedAt) }).from(articles),
    db
      .select({ m: max(siteSettings.updatedAt) })
      .from(siteSettings)
      .where(ne(siteSettings.group, 'interno')),
    db.select({ m: max(propertyImages.createdAt) }).from(propertyImages),
  ]);

  const fechas = [props[0]?.m, arts[0]?.m, ajustes[0]?.m, imgs[0]?.m]
    .filter((d): d is Date => d instanceof Date)
    .map((d) => d.getTime());

  return fechas.length ? new Date(Math.max(...fechas)) : null;
}

export interface Estado {
  hayCambiosSinPublicar: boolean;
  ultimaPublicacion: Date | null;
  ultimoCambio: Date | null;
  /** Verdadero mientras una publicación reciente puede seguir corriendo. */
  publicando: boolean;
}

export async function obtenerEstado(db: Db): Promise<Estado> {
  const [ultima, cambio] = await Promise.all([ultimaPublicacion(db), ultimoCambio(db)]);

  // Sin ninguna publicación registrada, cualquier contenido está sin publicar.
  const hayCambiosSinPublicar = cambio !== null && (ultima === null || cambio > ultima);

  const publicando = ultima !== null && Date.now() - ultima.getTime() < SEGUNDOS_ESTIMADOS * 1000;

  return { hayCambiosSinPublicar, ultimaPublicacion: ultima, ultimoCambio: cambio, publicando };
}

export interface EntradaPublicar {
  db: Db;
  /** El webhook de Netlify. Vacío o ausente si todavía no se configuró. */
  urlDelWebhook: string | null | undefined;
  pedidaPor?: string | null | undefined;
  disparar?: Disparador;
  registrar?: (mensaje: string, detalle?: unknown) => void;
}

export async function publicar(entrada: EntradaPublicar): Promise<ResultadoPublicacion> {
  const { db, urlDelWebhook, pedidaPor } = entrada;
  const disparar = entrada.disparar ?? disparadorReal;
  const registrar = entrada.registrar ?? (() => {});

  if (!urlDelWebhook) {
    // No se inventa un éxito: si no hay webhook, el sitio no se va a
    // actualizar y decir lo contrario es peor que no tener el botón.
    return {
      tipo: 'sin-configurar',
      mensaje:
        'Todavía no está configurada la publicación automática. Avisale a quien administra el sitio.',
    };
  }

  // --- Agrupado ---------------------------------------------------------
  const desde = new Date(Date.now() - VENTANA_AGRUPADO_SEGUNDOS * 1000);
  const recientes = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(publicaciones)
    .where(gt(publicaciones.createdAt, desde));

  if ((recientes[0]?.n ?? 0) > 0) {
    return { tipo: 'ya-encolada', estimadoSegundos: SEGUNDOS_ESTIMADOS };
  }

  // --- Disparo ----------------------------------------------------------
  let respuesta;
  try {
    respuesta = await disparar(urlDelWebhook);
  } catch (error) {
    registrar('No se pudo llamar al webhook de publicación', error);
    return {
      tipo: 'fallo',
      mensaje: 'No pudimos pedir la actualización. Probá de nuevo en un minuto.',
    };
  }

  if (!respuesta.ok) {
    registrar('El webhook de publicación respondió mal', respuesta.estado);
    return {
      tipo: 'fallo',
      mensaje: 'No pudimos pedir la actualización. Probá de nuevo en un minuto.',
    };
  }

  // Se anota **después** de que el disparo salió bien: si se anotara antes, un
  // webhook caído dejaría la ventana de agrupado bloqueando los reintentos.
  await db.insert(publicaciones).values({ pedidaPor: pedidaPor ?? null });

  return { tipo: 'encolada', estimadoSegundos: SEGUNDOS_ESTIMADOS };
}
