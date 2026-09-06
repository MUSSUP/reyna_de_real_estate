import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../../../backend/db/client';
import { adminUsers } from '../../../../../../backend/db/schema';
import {
  cookieDeSesion,
  crearToken,
  gastarTiempoEquivalente,
  hashearIp,
  ipDeLaPeticion,
  verificarContrasena,
} from '../../../../../../backend/lib/auth';
import {
  LIMITE_ACCESO,
  limpiarIntentos,
  limpiarVencidos,
  registrarIntento,
  revisarLimite,
} from '../../../../../../backend/lib/rateLimit';

export const prerender = false;

const esquema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

/** Idéntico para email inexistente y contraseña incorrecta: no se revela
 *  cuáles direcciones están registradas. */
const MENSAJE_CREDENCIALES = 'Email o contraseña incorrectos';

const sinCache = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  const ipHash = hashearIp(ipDeLaPeticion(request));

  // Se revisa el límite ANTES de tocar la base de usuarios o gastar bcrypt.
  const limite = await revisarLimite(db, 'login', ipHash, LIMITE_ACCESO);
  if (limite.bloqueado) {
    return Response.json(
      {
        ok: false,
        error: `Demasiados intentos. Probá de nuevo en ${Math.ceil((limite.reintentarEn ?? 60) / 60)} minutos`,
      },
      {
        status: 429,
        headers: { ...sinCache, 'Retry-After': String(limite.reintentarEn ?? 60) },
      },
    );
  }

  let datos: z.infer<typeof esquema>;
  try {
    datos = esquema.parse(await request.json());
  } catch {
    // Un cuerpo mal formado también cuenta como intento.
    await registrarIntento(db, 'login', ipHash);
    return Response.json(
      { ok: false, error: MENSAJE_CREDENCIALES },
      { status: 400, headers: sinCache },
    );
  }

  const email = datos.email.toLowerCase().trim();
  const usuario = (
    await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
  )[0];

  if (!usuario) {
    // Se gasta el mismo tiempo que si el usuario existiera: sin esto, la
    // diferencia de demora revelaría qué direcciones están registradas.
    await gastarTiempoEquivalente(datos.password);
    await registrarIntento(db, 'login', ipHash);
    return Response.json(
      { ok: false, error: MENSAJE_CREDENCIALES },
      { status: 401, headers: sinCache },
    );
  }

  const correcta = await verificarContrasena(datos.password, usuario.passwordHash);
  if (!correcta) {
    await registrarIntento(db, 'login', ipHash);
    return Response.json(
      { ok: false, error: MENSAJE_CREDENCIALES },
      { status: 401, headers: sinCache },
    );
  }

  await limpiarIntentos(db, 'login', ipHash);
  void limpiarVencidos(db, 'login', LIMITE_ACCESO).catch(() => {
    // La limpieza es mantenimiento: si falla, no debe impedir el acceso.
  });

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, usuario.id));

  const token = await crearToken({
    userId: usuario.id,
    email: usuario.email,
    name: usuario.name,
  });

  // El hash NUNCA sale en la respuesta: se devuelven solo estos tres campos.
  return Response.json(
    { ok: true, data: { user: { id: usuario.id, name: usuario.name, email: usuario.email } } },
    { status: 200, headers: { ...sinCache, 'Set-Cookie': cookieDeSesion(token) } },
  );
};
