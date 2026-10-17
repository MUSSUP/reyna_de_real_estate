/**
 * Las destacadas de la portada: cuáles y en qué orden.
 *
 * Tres reglas gobiernan este archivo.
 *
 * 1. **Una destacada sin imagen principal es un hueco gris en la portada.**
 *    El carrusel es lo primero que se ve del sitio. Se rechaza antes de
 *    guardar, no se arregla después.
 * 2. **El orden es una lista, no un número por propiedad.** Se guarda la
 *    posición de cada una (`featured_order` 0, 1, 2…) a partir del orden en
 *    que llegan los identificadores. Quien usa el panel arrastra; nunca
 *    escribe un número ni tiene que preocuparse por empates.
 * 3. **Solo se escriben las filas que de verdad cambian.** Guardar sin mover
 *    nada no debe tocar `updated_at`: si lo tocara, el panel diría "tenés
 *    cambios sin publicar" por haber mirado la pantalla.
 *
 * Recibe la base por parámetro (D-17).
 */
import { asc, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../db/client';
import { properties, propertyTypes, zones } from '../db/schema';

/**
 * A partir de acá el panel avisa que la lista quedó larga.
 *
 * **Es un aviso, no un límite.** Un carrusel largo no está roto: las de la
 * cola se ven menos, y eso lo decide quien publica, no este archivo. Poner un
 * tope duro además armaba una trampa — marcar la casilla "destacada" en nueve
 * formularios y después no poder guardar el orden de las nueve.
 */
export const DESTACADAS_SUGERIDAS = 8;

export const SIN_PORTADA_DESTACADA =
  'no tiene imagen principal, y en la portada quedaría un hueco gris';
export const SIN_PUBLICAR_DESTACADA = 'no está publicada, así que no se vería en la portada';

const camposDestacable = {
  id: properties.id,
  slug: properties.slug,
  titulo: properties.titleEs,
  estado: properties.status,
  operacion: properties.operation,
  precioUsd: properties.priceUsd,
  precioAConsultar: properties.priceOnRequest,
  portada: properties.coverPath,
  orden: properties.featuredOrder,
  ciudad: zones.city,
  zona: zones.zone,
  tipo: propertyTypes.nameEs,
};

/** Una propiedad vista desde esta pantalla: lo justo para reconocerla. */
export interface Destacable {
  id: string;
  slug: string;
  titulo: string;
  estado: 'borrador' | 'publicado' | 'archivado';
  operacion: 'venta' | 'renta';
  precioUsd: string | null;
  precioAConsultar: boolean;
  portada: string | null;
  /** Posición en la portada. Nulo = no está en la lista. */
  orden: number | null;
  ciudad: string | null;
  zona: string | null;
  tipo: string | null;
}

export interface Tablero {
  /** Las que están en la portada, en su orden. */
  destacadas: Destacable[];
  /** Publicadas con portada que podrían entrar. */
  disponibles: Destacable[];
  /**
   * Destacadas que hoy **no se ven** en la portada: se despublicaron o
   * perdieron la imagen después de haber sido elegidas. Se nombran para que
   * no haya que adivinar por qué el carrusel tiene menos de lo esperado.
   */
  invisibles: Destacable[];
}

/** Todo lo que la pantalla necesita, en una sola lectura. */
export async function listarDestacables(db: Db): Promise<Tablero> {
  const filas = await db
    .select(camposDestacable)
    .from(properties)
    .leftJoin(zones, eq(properties.zoneId, zones.id))
    .leftJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
    .where(or(eq(properties.isFeatured, true), eq(properties.status, 'publicado')))
    // El empate importa: dos destacadas con el mismo orden —o ninguno— se
    // mostrarían en un orden distinto en cada carga.
    .orderBy(asc(properties.featuredOrder), asc(properties.titleEs));

  const destacadas: Destacable[] = [];
  const disponibles: Destacable[] = [];
  const invisibles: Destacable[] = [];

  for (const f of filas) {
    const enPortada = f.orden !== null;
    const seVe = f.estado === 'publicado' && Boolean(f.portada);

    if (enPortada && seVe) destacadas.push(f);
    else if (enPortada) invisibles.push(f);
    else if (seVe) disponibles.push(f);
    // Publicada sin portada: no entra a ningún lado. No se puede destacar, y
    // ofrecerla para que el guardado la rechace sería hacer perder el tiempo.
  }

  return { destacadas, disponibles, invisibles };
}

/**
 * Aplica un movimiento a la lista: subir, bajar, agregar o quitar.
 *
 * Existe para el camino **sin JavaScript**, donde cada botón es un `submit`
 * que manda la lista actual más qué hacer con ella. El cálculo va en el
 * servidor y no en la página porque es el servidor el que después guarda: si
 * cada uno interpretara el movimiento a su manera, un día no coincidirían.
 *
 * Es una función pura a propósito — nada que consultar, nada que fallar.
 * Un movimiento que no tiene sentido (subir la primera, quitar algo que no
 * está) devuelve la lista igual, sin error: no hay nada que avisar.
 */
export function aplicarMovimiento(orden: string[], mover: string): string[] {
  const corte = mover.indexOf(':');
  if (corte < 0) return orden;

  const accion = mover.slice(0, corte);
  const id = mover.slice(corte + 1);
  if (!id) return orden;

  const lista = [...orden];
  const i = lista.indexOf(id);

  switch (accion) {
    case 'subir':
      if (i > 0) [lista[i - 1], lista[i]] = [lista[i]!, lista[i - 1]!];
      return lista;

    case 'bajar':
      if (i >= 0 && i < lista.length - 1) [lista[i], lista[i + 1]] = [lista[i + 1]!, lista[i]!];
      return lista;

    case 'quitar':
      if (i >= 0) lista.splice(i, 1);
      return lista;

    case 'agregar':
      // Al final: es donde se la espera, y moverla es un paso aparte.
      if (i < 0) lista.push(id);
      return lista;

    default:
      return orden;
  }
}

export type ResultadoDestacadas =
  { tipo: 'ok'; cantidad: number; cambios: number } | { tipo: 'datos'; mensaje: string };

const esquemaOrden = z
  .array(z.uuid('Hay un identificador que no es válido'))
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Hay una propiedad repetida en la lista',
  });

/**
 * Reemplaza la lista de destacadas por la que llega, en ese orden.
 *
 * Es un reemplazo completo y no un alta/baja a propósito: la pantalla muestra
 * la lista entera, así que lo que manda es la lista entera. Dos pestañas
 * abiertas no se pisan a medias — gana la última que guarda, completa.
 */
export async function guardarDestacadas(db: Db, crudo: unknown): Promise<ResultadoDestacadas> {
  const analizado = esquemaOrden.safeParse(crudo);
  if (!analizado.success) {
    return { tipo: 'datos', mensaje: analizado.error.issues[0]?.message ?? 'Lista inválida' };
  }
  const elegidas = analizado.data;

  // Estado actual de todo lo que participa: lo elegido y lo que hoy está
  // destacado. Lo demás no se toca ni se lee.
  const participan = await db
    .select({
      id: properties.id,
      titulo: properties.titleEs,
      estado: properties.status,
      portada: properties.coverPath,
      destacada: properties.isFeatured,
      orden: properties.featuredOrder,
    })
    .from(properties)
    .where(
      elegidas.length
        ? or(eq(properties.isFeatured, true), inArray(properties.id, elegidas))
        : eq(properties.isFeatured, true),
    );

  const porId = new Map(participan.map((p) => [p.id, p]));

  // Se valida todo antes de escribir nada: media portada guardada es peor
  // que un rechazo.
  for (const id of elegidas) {
    const p = porId.get(id);
    if (!p) return { tipo: 'datos', mensaje: 'Una de las propiedades elegidas ya no existe' };
    if (p.estado !== 'publicado') {
      return { tipo: 'datos', mensaje: `"${p.titulo}" ${SIN_PUBLICAR_DESTACADA}` };
    }
    if (!p.portada) {
      return { tipo: 'datos', mensaje: `"${p.titulo}" ${SIN_PORTADA_DESTACADA}` };
    }
  }

  const ahora = new Date();
  let cambios = 0;

  // Las elegidas, cada una a su posición.
  for (const [posicion, id] of elegidas.entries()) {
    const p = porId.get(id)!;
    if (p.destacada && p.orden === posicion) continue;
    await db
      .update(properties)
      .set({ isFeatured: true, featuredOrder: posicion, updatedAt: ahora })
      .where(eq(properties.id, id));
    cambios++;
  }

  // Las que salieron de la lista.
  const elegidasSet = new Set(elegidas);
  for (const p of participan) {
    if (elegidasSet.has(p.id)) continue;
    if (!p.destacada && p.orden === null) continue;
    await db
      .update(properties)
      .set({ isFeatured: false, featuredOrder: null, updatedAt: ahora })
      .where(eq(properties.id, p.id));
    cambios++;
  }

  return { tipo: 'ok', cantidad: elegidas.length, cambios };
}

/**
 * Posición libre al final de la lista.
 *
 * La usa el formulario de la propiedad, donde se marca la casilla "destacada"
 * sin pasar por esta pantalla: sin un orden asignado la propiedad entraba al
 * carrusel en un lugar indeterminado.
 */
export async function proximaPosicion(db: Db): Promise<number> {
  const ocupadas = await db
    .select({ orden: properties.featuredOrder })
    .from(properties)
    .where(eq(properties.isFeatured, true));

  const numeros = ocupadas.map((o) => o.orden).filter((o): o is number => o !== null);
  return numeros.length ? Math.max(...numeros) + 1 : 0;
}
