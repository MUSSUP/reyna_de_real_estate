import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../../backend/lib/auth';
import { borrarItem, editarItem, esCatalogo } from '../../../../../../../backend/lib/catalogos';

/** Un elemento de un catálogo: editar y borrar. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };
const NO_EXISTE = { ok: false, error: 'Eso no existe' };

/** Nombre e identificador llegan de la dirección: los dos se validan. */
function leerParams(params: Record<string, string | undefined>) {
  const nombre = params.catalogo && esCatalogo(params.catalogo) ? params.catalogo : null;
  const id = Number(params.id);
  return { nombre, id: Number.isInteger(id) && id > 0 ? id : null };
}

export const PATCH: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const { nombre, id } = leerParams(params);
  if (!nombre || id === null) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const r = await editarItem(getDb(), nombre, id, crudo);

  switch (r.tipo) {
    case 'ok':
      return Response.json({ ok: true, data: { id: r.id } }, { headers: sinCache });
    case 'datos':
      return Response.json(
        { ok: false, error: 'Revisá los datos marcados', campos: r.campos },
        { status: 400, headers: sinCache },
      );
    case 'repetido':
      return Response.json(
        { ok: false, error: r.mensaje, campos: { nombre: r.mensaje } },
        { status: 409, headers: sinCache },
      );
    case 'no-existe':
      return Response.json(NO_EXISTE, { status: 404, headers: sinCache });
    default:
      return Response.json(
        { ok: false, error: 'No pudimos guardar' },
        { status: 400, headers: sinCache },
      );
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const { nombre, id } = leerParams(params);
  if (!nombre || id === null) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  const r = await borrarItem(getDb(), nombre, id);

  if (r.tipo === 'en-uso') {
    // 409 y no 400: los datos están bien, lo que pasa es que hay propiedades
    // que dependen de esto. El mensaje dice cuántas.
    return Response.json({ ok: false, error: r.mensaje }, { status: 409, headers: sinCache });
  }
  if (r.tipo === 'no-existe') {
    return Response.json(NO_EXISTE, { status: 404, headers: sinCache });
  }
  if (r.tipo !== 'ok') {
    return Response.json(
      { ok: false, error: 'No pudimos borrar' },
      { status: 400, headers: sinCache },
    );
  }

  return Response.json({ ok: true }, { headers: sinCache });
};
