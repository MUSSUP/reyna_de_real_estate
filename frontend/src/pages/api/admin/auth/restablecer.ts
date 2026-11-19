import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { restablecer } from '../../../../../../backend/lib/recuperacion';

/**
 * Pone la contraseña nueva usando el enlace.
 *
 * **Sin sesión**: el enlace es la credencial. Por eso vale una hora, sirve una
 * sola vez, y lo que se guarda en la base es su versión cifrada.
 *
 * Acá sí se distingue entre "el enlace no sirve" y "la contraseña es corta":
 * quien llegó hasta esta pantalla ya tiene el token en la mano, así que no hay
 * nada que ocultarle, y un mensaje vago la dejaría sin saber qué corregir.
 *
 * **No cierra las otras sesiones** de esa persona. Es una decisión tomada y
 * registrada: si la contraseña se filtró, quien ya esté adentro sigue hasta
 * que venza su sesión de 8 horas.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ request }) => {
  let token = '';
  let clave: unknown = null;

  try {
    const cuerpo: unknown = await request.json();
    if (cuerpo && typeof cuerpo === 'object') {
      const c = cuerpo as { token?: unknown; password?: unknown };
      if (typeof c.token === 'string') token = c.token;
      clave = c.password;
    }
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const resultado = await restablecer(getDb(), token, clave);

  if (resultado.tipo === 'datos') {
    return Response.json({ ok: false, error: resultado.error }, { status: 400, headers: sinCache });
  }

  if (resultado.tipo === 'enlace') {
    return Response.json(
      {
        ok: false,
        error: 'Este enlace ya no sirve: puede haber vencido o haberse usado. Pedí uno nuevo.',
      },
      { status: 410, headers: sinCache },
    );
  }

  return Response.json({ ok: true, data: { listo: true } }, { status: 200, headers: sinCache });
};
