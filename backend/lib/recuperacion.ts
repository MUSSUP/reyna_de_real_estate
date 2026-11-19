/**
 * Recuperar la contraseña, y también invitar a alguien al panel.
 *
 * **Son la misma cosa vista de dos maneras.** Invitar es crear el usuario sin
 * una contraseña que sirva y mandarle uno de estos enlaces para que ponga la
 * suya. Así nunca viaja una contraseña por correo y quien invita jamás conoce
 * la clave del invitado — que es más seguro y además evita la conversación
 * incómoda de "te la paso por WhatsApp".
 *
 * Tres decisiones que no se tocan:
 *
 * 1. **El token se guarda cifrado**, igual que una contraseña. Lo que viaja en
 *    el enlace sólo existe en el correo de la persona; si la base se filtra, lo
 *    que hay adentro no sirve para entrar.
 * 2. **Pedir un reseteo responde siempre lo mismo**, exista o no el correo. Si
 *    la respuesta cambiara, cualquiera podría averiguar qué direcciones tienen
 *    cuenta. Es el mismo criterio que ya usa el ingreso.
 * 3. **Un pedido nuevo invalida los anteriores.** Si alguien pide el enlace
 *    tres veces porque no le llegaba, sólo el último sirve.
 *
 * La base entra por parámetro (D-17).
 */
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Db } from '../db/client';
import { adminUsers, passwordResets } from '../db/schema';
import { hashearContrasena } from './auth';

/**
 * Cuánto vive un enlace.
 *
 * Una hora es incómodo a propósito: el enlace llega a un correo, y un correo
 * se reenvía, se queda abierto en una pantalla ajena o se sincroniza a un
 * teléfono que se pierde. Cuanto menos vive, menos superficie hay.
 */
export const VALIDEZ_MINUTOS = 60;

/** El mismo mínimo que exige `db:crear-admin`. Una sola regla en todo el proyecto. */
export const LARGO_MINIMO = 12;

export type ResultadoReset =
  | { tipo: 'ok'; userId: string }
  /** El enlace no existe, ya se usó, o se venció. No se distingue cuál: da lo mismo y decirlo ayuda a quien prueba. */
  | { tipo: 'enlace' }
  | { tipo: 'datos'; error: string };

/** SHA-256 en hexadecimal. Alcanza: el token ya es aleatorio, no hay nada que adivinar. */
export function cifrarToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Crea el enlace y devuelve el token **sin cifrar**, que es lo único que sale
 * de esta función: va al correo y no se guarda en ningún lado.
 *
 * Devuelve `null` si el correo no corresponde a nadie. Quien llama **tiene que
 * responder igual en los dos casos**.
 */
export async function pedirReset(
  db: Db,
  email: string,
): Promise<{ token: string; nombre: string } | null> {
  const normalizado = email.trim().toLowerCase();
  if (normalizado === '') return null;

  const [usuario] = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizado))
    .limit(1);

  if (!usuario) return null;

  return { token: await emitirToken(db, usuario.id), nombre: usuario.name };
}

/**
 * Emite un enlace para un usuario que ya se sabe cuál es.
 *
 * Lo usan el reseteo y la invitación: en el segundo caso el usuario acaba de
 * crearse y no hay correo que buscar.
 */
export async function emitirToken(db: Db, userId: string): Promise<string> {
  // Los pedidos anteriores que seguían vivos dejan de servir.
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt)));

  // 32 bytes de azar. En base64url entra en una dirección sin escaparse.
  const token = randomBytes(32).toString('base64url');

  await db.insert(passwordResets).values({
    userId,
    tokenHash: cifrarToken(token),
    expiresAt: new Date(Date.now() + VALIDEZ_MINUTOS * 60_000),
  });

  return token;
}

/** Si el enlace sirve, quién es. Sin efectos: lo usa la pantalla antes de dibujar el formulario. */
export async function leerToken(
  db: Db,
  token: string,
): Promise<{ userId: string; nombre: string; email: string } | null> {
  if (!token) return null;

  const [fila] = await db
    .select({
      userId: passwordResets.userId,
      nombre: adminUsers.name,
      email: adminUsers.email,
    })
    .from(passwordResets)
    .innerJoin(adminUsers, eq(adminUsers.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.tokenHash, cifrarToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return fila ?? null;
}

/** Pone la contraseña nueva y quema el enlace. */
export async function restablecer(db: Db, token: string, clave: unknown): Promise<ResultadoReset> {
  if (typeof clave !== 'string') {
    return { tipo: 'datos', error: 'No pudimos leer la contraseña' };
  }
  if (clave.length < LARGO_MINIMO) {
    return { tipo: 'datos', error: `La contraseña necesita al menos ${LARGO_MINIMO} caracteres` };
  }

  const destino = await leerToken(db, token);
  if (!destino) return { tipo: 'enlace' };

  const hash = await hashearContrasena(clave);

  await db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.id, destino.userId));

  // Se quema después de cambiar la clave, no antes: si lo de arriba falla, el
  // enlace sigue sirviendo y la persona puede reintentar.
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.tokenHash, cifrarToken(token)));

  return { tipo: 'ok', userId: destino.userId };
}
