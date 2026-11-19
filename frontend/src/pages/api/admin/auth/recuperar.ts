import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { hashearIp, ipDeLaPeticion } from '../../../../../../backend/lib/auth';
import { armarCorreoDeAcceso, crearCorreoResend } from '../../../../../../backend/lib/mailer';
import {
  LIMITE_RECUPERAR,
  registrarIntento,
  revisarLimite,
} from '../../../../../../backend/lib/rateLimit';
import { VALIDEZ_MINUTOS, pedirReset } from '../../../../../../backend/lib/recuperacion';

/**
 * "Olvidé mi contraseña": manda el enlace.
 *
 * **Sin sesión, a propósito**: quien perdió la contraseña no puede tener una.
 * Está exceptuado en el middleware junto con la pantalla que lo usa.
 *
 * Tres decisiones:
 *
 * 1. **Responde siempre lo mismo**, exista o no el correo, y aunque el envío
 *    falle. Si la respuesta cambiara, el formulario se convertiría en una
 *    forma cómoda de averiguar qué direcciones tienen cuenta en el panel.
 * 2. **Con tope de intentos**, más estricto que el del ingreso: cada pedido
 *    manda un correo de verdad.
 * 3. **El enlace se arma con el dominio configurado, nunca con la cabecera
 *    `Host` de la petición.** Confiar en `Host` deja que alguien pida un
 *    reseteo ajeno con una cabecera falsa y reciba un correo cuyo botón
 *    apunta a su propio servidor, con el token adentro.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

/** Lo mismo pase lo que pase. */
const RESPUESTA = Response.json(
  {
    ok: true,
    data: { mensaje: 'Si esa dirección tiene acceso al panel, le llega un correo con el enlace.' },
  },
  { status: 200, headers: sinCache },
);

export const POST: APIRoute = async ({ request, site }) => {
  const db = getDb();
  const ipHash = hashearIp(ipDeLaPeticion(request));

  const estado = await revisarLimite(db, 'recuperar', ipHash, LIMITE_RECUPERAR);
  if (estado.bloqueado) {
    return Response.json(
      { ok: false, error: 'Demasiados pedidos. Probá de nuevo en un rato.' },
      { status: 429, headers: sinCache },
    );
  }
  await registrarIntento(db, 'recuperar', ipHash);

  let email = '';
  try {
    const cuerpo: unknown = await request.json();
    if (cuerpo && typeof cuerpo === 'object' && 'email' in cuerpo) {
      const valor = (cuerpo as { email: unknown }).email;
      if (typeof valor === 'string') email = valor;
    }
  } catch {
    // Un cuerpo ilegible se trata como un correo que no existe: misma respuesta.
    return RESPUESTA.clone();
  }

  const pedido = await pedirReset(db, email);
  if (!pedido) return RESPUESTA.clone();

  const base = (site?.href ?? 'https://reynaderealestate.com/').replace(/\/$/, '');
  const correo = crearCorreoResend();

  const envio = await correo.enviar({
    para: email.trim().toLowerCase(),
    ...armarCorreoDeAcceso({
      nombre: pedido.nombre,
      enlace: `${base}/admin/recuperar/${pedido.token}`,
      motivo: 'reseteo',
      validezMinutos: VALIDEZ_MINUTOS,
    }),
  });

  if (!envio.ok) {
    // Al servidor sí le interesa: sin esto, un proveedor caído sería invisible.
    // A quien pidió el reseteo **no** se le dice, para no revelar si existe.
    console.error('recuperar: no se pudo enviar el correo:', envio.motivo);
  }

  return RESPUESTA.clone();
};
