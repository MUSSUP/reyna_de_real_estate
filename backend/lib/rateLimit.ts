/**
 * Límite de frecuencia por IP.
 *
 * El contador vive en la base y no en memoria: cada invocación de una función
 * sin servidor puede ser una instancia nueva, así que un contador en memoria
 * se reiniciaría constantemente y no frenaría nada.
 *
 * Sirve a dos usos que **cuentan distinto**, y por eso van separados por
 * ámbito. En el acceso al panel solo se anotan los fallos y un acierto borra
 * el historial; en el formulario de consulta se anota cada envío. Mezclarlos
 * dejaría que un visitante que consulta mucho se quede sin intentos de acceso,
 * o al revés.
 */
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { rateLimitHits } from '../db/schema';

/** Los dos usos del contador. Cada uno cuenta por su cuenta. */
export type Ambito = 'login' | 'leads';

export interface Limite {
  maximo: number;
  ventanaMinutos: number;
}

/** Acceso al panel: 5 fallos cada 15 minutos (D-13). */
export const LIMITE_ACCESO: Limite = { maximo: 5, ventanaMinutos: 15 };

/** Formulario de consulta: 5 envíos cada 10 minutos (contrato de la API). */
export const LIMITE_CONSULTAS: Limite = { maximo: 5, ventanaMinutos: 10 };

export interface EstadoLimite {
  bloqueado: boolean;
  intentosRestantes: number;
  /** Segundos hasta poder reintentar. Solo cuando está bloqueado. */
  reintentarEn?: number;
}

function inicioVentana(limite: Limite): Date {
  return new Date(Date.now() - limite.ventanaMinutos * 60 * 1000);
}

/** Consulta sin anotar nada. Se llama ANTES de hacer el trabajo caro. */
export async function revisarLimite(
  db: Db,
  ambito: Ambito,
  ipHash: string,
  limite: Limite,
): Promise<EstadoLimite> {
  const desde = inicioVentana(limite);

  const filas = await db
    .select({
      total: sql<number>`count(*)::int`,
      masAntiguo: sql<Date | null>`min(${rateLimitHits.createdAt})`,
    })
    .from(rateLimitHits)
    .where(
      and(
        eq(rateLimitHits.scope, ambito),
        eq(rateLimitHits.ipHash, ipHash),
        gte(rateLimitHits.createdAt, desde),
      ),
    );

  const total = filas[0]?.total ?? 0;

  if (total >= limite.maximo) {
    const masAntiguo = filas[0]?.masAntiguo;
    // La ventana es deslizante: se libera cuando la marca más vieja caduca.
    const liberaEn = masAntiguo
      ? new Date(masAntiguo).getTime() + limite.ventanaMinutos * 60 * 1000
      : Date.now();
    const segundos = Math.max(1, Math.ceil((liberaEn - Date.now()) / 1000));
    return { bloqueado: true, intentosRestantes: 0, reintentarEn: segundos };
  }

  return { bloqueado: false, intentosRestantes: limite.maximo - total };
}

/** Anota una marca. Qué cuenta como marca lo decide cada ámbito. */
export async function registrarIntento(db: Db, ambito: Ambito, ipHash: string): Promise<void> {
  await db.insert(rateLimitHits).values({ scope: ambito, ipHash });
}

/** Limpia el historial de una IP en un ámbito. Lo usa el acceso tras un acierto. */
export async function limpiarIntentos(db: Db, ambito: Ambito, ipHash: string): Promise<void> {
  await db
    .delete(rateLimitHits)
    .where(and(eq(rateLimitHits.scope, ambito), eq(rateLimitHits.ipHash, ipHash)));
}

/**
 * Borra las marcas vencidas de un ámbito.
 *
 * Sin esto la tabla crecería para siempre. Se llama de vez en cuando desde el
 * propio endpoint en lugar de montar una tarea programada, que sería otra
 * pieza más para mantener.
 */
export async function limpiarVencidos(db: Db, ambito: Ambito, limite: Limite): Promise<void> {
  await db
    .delete(rateLimitHits)
    .where(
      and(eq(rateLimitHits.scope, ambito), lt(rateLimitHits.createdAt, inicioVentana(limite))),
    );
}
