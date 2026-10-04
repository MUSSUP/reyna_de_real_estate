import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { editarConsulta } from '../../../../../../backend/lib/consultasPanel';

/**
 * Cambia el estado y las notas de una consulta.
 *
 * **Nada más.** Lo que dejó el visitante es inmutable: si se pudiera editar,
 * la bandeja dejaría de ser un registro de lo que pasó.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const PATCH: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let cuerpo: { estado?: unknown; notas?: unknown };
  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  // Se pasan solo los dos campos editables: lo demás del cuerpo se ignora.
  const r = await editarConsulta(getDb(), params.id!, {
    estado: cuerpo.estado,
    notas: cuerpo.notas,
  });

  if (r.tipo === 'no-existe') {
    return Response.json(
      { ok: false, error: 'Esa consulta no existe' },
      { status: 404, headers: sinCache },
    );
  }
  if (r.tipo === 'datos') {
    return Response.json(
      { ok: false, error: 'Revisá el estado o las notas' },
      { status: 400, headers: sinCache },
    );
  }

  return Response.json({ ok: true }, { headers: sinCache });
};
