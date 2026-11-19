import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirAccesoCompleto } from '../../../../../../backend/lib/auth';
import { armarCorreoDeAcceso, crearCorreoResend } from '../../../../../../backend/lib/mailer';
import { VALIDEZ_MINUTOS, emitirToken } from '../../../../../../backend/lib/recuperacion';
import { cambiarRol, listarUsuarios, quitarUsuario } from '../../../../../../backend/lib/usuarios';

/**
 * Una persona del panel: cambiarle el permiso, reenviarle el enlace, o quitarla.
 *
 * **Sólo acceso completo**, igual que la lista.
 *
 * Las barandas —no quitarse a una misma, no dejar el panel sin nadie con
 * acceso completo— viven en `backend/lib/usuarios.ts` y no acá: son reglas del
 * dominio, no del transporte, y así se prueban sin levantar un servidor.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const PATCH: APIRoute = async ({ request, params, site }) => {
  const sesion = await requerirAccesoCompleto(request);
  if (esRespuesta(sesion)) return sesion;

  const id = params.id ?? '';
  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const datos = (crudo ?? {}) as { rol?: unknown; reenviar?: unknown };

  // Reenviar el enlace: para quien nunca entró, o a quien no le llegó.
  if (datos.reenviar === true) {
    const db = getDb();
    const persona = (await listarUsuarios(db)).find((u) => u.id === id);
    if (!persona) {
      return Response.json(
        { ok: false, error: 'Esa persona no está' },
        { status: 404, headers: sinCache },
      );
    }

    const base = (site?.href ?? 'https://reynaderealestate.com/').replace(/\/$/, '');
    const envio = await crearCorreoResend().enviar({
      para: persona.email,
      ...armarCorreoDeAcceso({
        nombre: persona.nombre,
        enlace: `${base}/admin/recuperar/${await emitirToken(db, id)}`,
        motivo: 'invitacion',
        validezMinutos: VALIDEZ_MINUTOS,
      }),
    });

    if (!envio.ok) {
      return Response.json(
        { ok: false, error: 'No pudimos mandar el correo. Probá de nuevo en un rato.' },
        { status: 502, headers: sinCache },
      );
    }
    return Response.json({ ok: true, data: { reenviado: true } }, { headers: sinCache });
  }

  const r = await cambiarRol(getDb(), sesion.userId, id, datos.rol);
  if (r.tipo === 'datos') {
    return Response.json({ ok: false, error: r.error }, { status: 400, headers: sinCache });
  }

  return Response.json({ ok: true, data: { listo: true } }, { headers: sinCache });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const sesion = await requerirAccesoCompleto(request);
  if (esRespuesta(sesion)) return sesion;

  const r = await quitarUsuario(getDb(), sesion.userId, params.id ?? '');
  if (r.tipo === 'datos') {
    return Response.json({ ok: false, error: r.error }, { status: 400, headers: sinCache });
  }

  return Response.json({ ok: true, data: { listo: true } }, { headers: sinCache });
};
