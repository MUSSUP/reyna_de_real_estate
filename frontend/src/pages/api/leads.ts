import type { APIRoute } from 'astro';
import { getDb } from '../../../../backend/db/client';
import { hashearIp, ipDeLaPeticion } from '../../../../backend/lib/auth';
import { crearCorreoResend } from '../../../../backend/lib/mailer';
import { procesarConsulta } from '../../../../backend/lib/consultas';
import { leerEnv } from '../../../../backend/lib/entorno';

/**
 * El único endpoint público del sitio.
 *
 * Todo lo demás se genera al construir y no toca la base (D-04). Acá entra
 * texto escrito por cualquiera desde internet.
 *
 * Este archivo es solo el adaptador HTTP: lee el cuerpo, delega en
 * `procesarConsulta` y traduce el resultado a una respuesta. La lógica vive en
 * `backend/lib/consultas.ts`, donde se puede probar de verdad.
 *
 * Sin JavaScript **cada final tiene su página**, con el motivo en la dirección.
 * Antes redirigía a `/#contacto?envio=error`, que no avisaba nada: el `?` caía
 * dentro del fragmento, así que ni siquiera era una query string.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

const ERROR_GENERICO =
  'No pudimos recibir tu consulta. Escribinos por WhatsApp y te respondemos enseguida.';

/**
 * Sin JavaScript el formulario se envía como un formulario de verdad y el
 * navegador espera una página, no un JSON. Se distingue por el tipo de
 * contenido: quien manda JSON quiere JSON de vuelta.
 */
function esEnvioDeFormulario(request: Request): boolean {
  const tipo = request.headers.get('content-type') ?? '';
  return tipo.includes('application/x-www-form-urlencoded') || tipo.includes('multipart/form-data');
}

function responder(
  request: Request,
  cuerpo: { ok: boolean; error?: string; campos?: Record<string, string> },
  status: number,
  destinoSinJs: string,
): Response {
  if (esEnvioDeFormulario(request)) {
    // 303 para que el "atrás" del navegador no reenvíe la consulta.
    return new Response(null, { status: 303, headers: { ...sinCache, Location: destinoSinJs } });
  }
  return Response.json(cuerpo, { status, headers: sinCache });
}

export const POST: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDb();
  } catch (error) {
    console.error('No hay base para recibir la consulta:', error);
    return responder(
      request,
      { ok: false, error: ERROR_GENERICO },
      503,
      '/consulta-no-enviada?motivo=error',
    );
  }

  let crudo: unknown;
  try {
    crudo = esEnvioDeFormulario(request)
      ? Object.fromEntries(await request.formData())
      : await request.json();
  } catch {
    return responder(
      request,
      { ok: false, error: 'No pudimos leer tu consulta. Probá de nuevo.' },
      400,
      '/consulta-no-enviada?motivo=error',
    );
  }

  const resultado = await procesarConsulta({
    db,
    correo: crearCorreoResend(),
    ipHash: hashearIp(ipDeLaPeticion(request)),
    crudo,
    urlDelSitio: leerEnv('PUBLIC_SITE_URL') ?? '',
    // El detalle va al registro del servidor, nunca al visitante.
    registrar: (mensaje, detalle) => console.error(mensaje, detalle ?? ''),
  });

  switch (resultado.tipo) {
    // Un envío descartado responde exactamente lo mismo que uno correcto.
    case 'ok':
    case 'descartado':
      return responder(request, { ok: true }, 200, '/gracias');

    case 'limite': {
      const minutos = Math.ceil(resultado.reintentarEnSegundos / 60);
      return responder(
        request,
        {
          ok: false,
          error: `Ya recibimos varias consultas tuyas. Probá de nuevo en ${minutos} minutos, o escribinos por WhatsApp.`,
        },
        429,
        '/consulta-no-enviada?motivo=limite',
      );
    }

    case 'datos':
      return responder(
        request,
        { ok: false, error: 'Revisá los datos marcados', campos: resultado.campos },
        400,
        '/consulta-no-enviada?motivo=datos',
      );

    case 'ilegible':
      return responder(
        request,
        { ok: false, error: 'No pudimos leer tu consulta. Probá de nuevo.' },
        400,
        '/consulta-no-enviada?motivo=error',
      );

    case 'nose-guardo':
      return responder(
        request,
        { ok: false, error: ERROR_GENERICO },
        503,
        '/consulta-no-enviada?motivo=error',
      );
  }
};

/** Cualquier otro método sobre este camino. */
export const ALL: APIRoute = () =>
  Response.json({ ok: false, error: 'Método no permitido' }, { status: 405, headers: sinCache });
