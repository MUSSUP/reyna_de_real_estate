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
// Sólo el tipo: no agrega nada en tiempo de ejecución, así este archivo sigue
// sin depender de la base (es lo que hace que la ayuda del panel funcione con
// Supabase pausada).
import type { RolAdmin } from '../db/schema';

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
  /**
   * Qué puede tocar. Viaja **dentro del token**, no se consulta en cada
   * petición: así una pantalla del panel que no necesita la base —como la
   * ayuda— se sigue dibujando con la base caída, que es justo cuando hace
   * falta.
   *
   * El costo: si se le cambia el permiso a alguien, **el cambio se aplica
   * cuando vuelva a entrar**, o a más tardar cuando venza su sesión de 8
   * horas. La pantalla de usuarios lo dice.
   *
   * Opcional para que una sesión emitida antes de que existieran los permisos
   * no deje a nadie afuera: sin rol se trata como `completo`, que es lo que
   * esa persona tenía cuando entró.
   */
  rol?: RolAdmin;
}

/** `completo` si el token no lo trae: ver el comentario de `Sesion.rol`. */
export function rolDe(sesion: Sesion): RolAdmin {
  return sesion.rol ?? 'completo';
}

/** Si esta sesión puede entrar a lo que es sólo de la dueña. */
export function esCompleto(sesion: Sesion): boolean {
  return rolDe(sesion) === 'completo';
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
  return new SignJWT({ email: sesion.email, name: sesion.name, rol: sesion.rol })
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

    /*
      El permiso se lee con tres casos distintos, y la diferencia importa:

      - **No viene**: es una sesión firmada antes de que existieran los
        permisos. Se deja sin rol, y `rolDe` la trata como completa — nadie
        queda afuera de golpe por una migración.
      - **Viene uno conocido**: se usa.
      - **Viene algo que no reconocemos**: se trata como el permiso más
        acotado. La firma garantiza que lo escribimos nosotros, así que sólo
        puede pasar si una versión nueva agrega un rol y una vieja lo lee; en
        ese caso conviene equivocarse hacia el lado que no da acceso de más.
    */
    const crudo = payload.rol;
    const rol =
      crudo === undefined || crudo === null
        ? undefined
        : crudo === 'completo' || crudo === 'contenido'
          ? crudo
          : 'contenido';

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      ...(rol ? { rol } : {}),
    };
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

/**
 * Como `requerirSesion`, pero además exige acceso completo.
 *
 * Es lo que protege los tres lugares que no son de todo el mundo: los
 * propietarios —datos de terceros—, la configuración del sitio y los usuarios
 * del panel.
 *
 * Responde **403 y no 404**: quien tiene sesión ya sabe que el panel existe, y
 * esconder la existencia de la pantalla sólo lograría que crea que algo está
 * roto. Decirle que no le corresponde es más útil y no revela nada.
 */
export async function requerirAccesoCompleto(request: Request): Promise<Sesion | Response> {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;
  if (!esCompleto(sesion)) return respuesta403();
  return sesion;
}

function respuesta403(): Response {
  return Response.json(
    { ok: false, error: 'Tu usuario no tiene permiso para esto' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  );
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
