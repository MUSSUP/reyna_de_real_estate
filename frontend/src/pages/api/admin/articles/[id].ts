import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { crearAlmacenamientoS3 } from '../../../../../../backend/lib/storage';
import {
  borrarArticulo,
  editarArticulo,
  obtenerArticuloDelPanel,
} from '../../../../../../backend/lib/articulosPanel';

/** Un artículo: leer, editar y borrar. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };
const NO_EXISTE = { ok: false, error: 'Ese artículo no existe' };

export const GET: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const a = await obtenerArticuloDelPanel(getDb(), params.id!);
  if (!a) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  return Response.json({ ok: true, data: a }, { headers: sinCache });
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

  const r = await editarArticulo(getDb(), params.id!, crudo);

  switch (r.tipo) {
    case 'ok':
      return Response.json({ ok: true, data: { id: r.id, slug: r.slug } }, { headers: sinCache });

    case 'datos':
      return Response.json(
        { ok: false, error: 'Revisá los datos marcados', campos: r.campos },
        { status: 400, headers: sinCache },
      );

    // El mensaje dice exactamente qué falta, no "error de validación".
    case 'falta-texto':
      return Response.json(
        { ok: false, error: r.mensaje, campos: { bodyEs: r.mensaje } },
        { status: 400, headers: sinCache },
      );

    case 'no-existe':
      return Response.json(NO_EXISTE, { status: 404, headers: sinCache });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const borrado = await borrarArticulo(getDb(), crearAlmacenamientoS3(), params.id!);
  if (!borrado) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  return Response.json({ ok: true }, { headers: sinCache });
};
