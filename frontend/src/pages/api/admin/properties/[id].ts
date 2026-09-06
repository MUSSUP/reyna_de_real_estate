import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import {
  borrarPropiedad,
  editarPropiedad,
  obtenerPropiedadDelPanel,
} from '../../../../../../backend/lib/propiedades';

/** Una propiedad: leer, editar y borrar. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const p = await obtenerPropiedadDelPanel(getDb(), params.id!);
  if (!p) {
    return Response.json(
      { ok: false, error: 'Esa propiedad no existe' },
      { status: 404, headers: sinCache },
    );
  }

  return Response.json({ ok: true, data: p }, { headers: sinCache });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const r = await editarPropiedad(getDb(), params.id!, crudo);

  switch (r.tipo) {
    case 'ok':
      return Response.json({ ok: true, data: { id: r.id, slug: r.slug } }, { headers: sinCache });

    case 'datos':
      return Response.json(
        { ok: false, error: 'Revisá los datos marcados', campos: r.campos },
        { status: 400, headers: sinCache },
      );

    // El mensaje dice exactamente qué falta, no "error de validación".
    case 'falta-portada':
      return Response.json(
        { ok: false, error: r.mensaje, campos: { coverPath: r.mensaje } },
        { status: 400, headers: sinCache },
      );

    case 'no-existe':
      return Response.json(
        { ok: false, error: 'Esa propiedad no existe' },
        { status: 404, headers: sinCache },
      );
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const borrada = await borrarPropiedad(getDb(), params.id!);
  if (!borrada) {
    return Response.json(
      { ok: false, error: 'Esa propiedad no existe' },
      { status: 404, headers: sinCache },
    );
  }

  return Response.json({ ok: true }, { headers: sinCache });
};
