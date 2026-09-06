/**
 * Autenticación del panel.
 *
 * Un solo usuario (la clienta), sesión por JWT en cookie. Sin roles ni
 * multiusuario: no está en el alcance y agregarlos ahora sería complejidad sin
 * uso (acuerdo, punto 3).
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'node:crypto';
import { leerEnv } from './entorno';

/** Coste 12: ~250 ms por verificación. Lento a propósito, para que probar
 *  contraseñas al azar sea caro. */
const COSTE_BCRYPT = 12;

/** La sesión dura una jornada de trabajo. */
const HORAS_SESION = 8;

export const NOMBRE_COOKIE = 'reyna_sesion';

export interface Sesion {
  userId: string;
  email: string;
  name: string;
}

function leerSecreto(): Uint8Array {
  const secreto = leerEnv('JWT_SECRET');
  if (!secreto || secreto.length < 32) {
    // Sin esto, cualquiera podría firmar sesiones de administradora.
    throw new Error('JWT_SECRET falta o tiene menos de 32 caracteres');
  }
  return new TextEncoder().encode(secreto);
}

// --- Contraseñas ------------------------------------------------------------

export async function hashearContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, COSTE_BCRYPT);
}

export async function verificarContrasena(contrasena: string, hash: string): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}

/**
 * Hash de descarte, para gastar el mismo tiempo cuando el email no existe.
 *
 * Sin esto, un email inexistente respondería al instante y uno real tardaría lo
 * que tarda bcrypt. Esa diferencia de tiempo alcanza para averiguar qué
 * direcciones están registradas, aunque el mensaje de error sea idéntico.
 */
const HASH_DESCARTE = '$2b$12$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';

export async function gastarTiempoEquivalente(contrasena: string): Promise<void> {
  await bcrypt.compare(contrasena, HASH_DESCARTE).catch(() => false);
}

// --- Sesión -----------------------------------------------------------------

export async function crearToken(sesion: Sesion): Promise<string> {
  return new SignJWT({ email: sesion.email, name: sesion.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sesion.userId)
    .setIssuedAt()
    .setExpirationTime(`${HORAS_SESION}h`)
    .sign(leerSecreto());
}

/** Devuelve la sesión o `null`. Nunca lanza: un token inválido no es un error
 *  del servidor, es simplemente alguien sin acceso. */
export async function leerToken(token: string): Promise<Sesion | null> {
  try {
    const { payload } = await jwtVerify(token, leerSecreto(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      return null;
    }
    return { userId: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

// --- Cookie -----------------------------------------------------------------

/**
 * `HttpOnly` para que ningún script pueda leerla — si hubiera un XSS, la sesión
 * no se puede robar desde JavaScript.
 * `SameSite=Strict` para que no viaje desde otro sitio (CSRF).
 * `Secure` solo en producción, porque en local no hay HTTPS.
 */
export function cookieDeSesion(token: string): string {
  const partes = [
    `${NOMBRE_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${HORAS_SESION * 3600}`,
  ];
  if (leerEnv('NODE_ENV') === 'production') partes.push('Secure');
  return partes.join('; ');
}

export function cookieDeCierre(): string {
  const partes = [`${NOMBRE_COOKIE}=`, 'HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=0'];
  if (leerEnv('NODE_ENV') === 'production') partes.push('Secure');
  return partes.join('; ');
}

export function leerCookie(cabecera: string | null | undefined): string | null {
  if (!cabecera) return null;
  for (const par of cabecera.split(';')) {
    const [nombre, ...resto] = par.trim().split('=');
    if (nombre === NOMBRE_COOKIE) return resto.join('=') || null;
  }
  return null;
}

// --- Protección de endpoints ------------------------------------------------

/**
 * Middleware único para todo endpoint del panel.
 *
 * Es una sola función a propósito: si cada endpoint escribiera su propia
 * verificación, tarde o temprano uno quedaría sin proteger.
 */
export async function requerirSesion(request: Request): Promise<Sesion | Response> {
  const token = leerCookie(request.headers.get('cookie'));
  if (!token) return respuesta401();

  const sesion = await leerToken(token);
  if (!sesion) return respuesta401();

  return sesion;
}

export function esRespuesta(valor: Sesion | Response): valor is Response {
  return valor instanceof Response;
}

function respuesta401(): Response {
  // El mismo mensaje para "sin cookie" y "token inválido": no se le informa a
  // quien prueba si iba por buen camino.
  return Response.json(
    { ok: false, error: 'Necesitás iniciar sesión' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  );
}

// --- Origen de la petición --------------------------------------------------

/**
 * Hash de la IP para contar intentos sin guardar la dirección en claro.
 * Se sala con el secreto del proyecto para que el hash no sea reversible con
 * una tabla precalculada — el espacio de direcciones IP es chico.
 */
export function hashearIp(ip: string): string {
  const sal = leerEnv('JWT_SECRET') ?? '';
  return createHash('sha256').update(`${sal}:${ip}`).digest('hex');
}

/** Netlify pone la IP real acá; el resto son respaldos. */
export function ipDeLaPeticion(request: Request): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  );
}
