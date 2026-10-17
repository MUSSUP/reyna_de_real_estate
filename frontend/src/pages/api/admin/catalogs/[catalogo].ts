import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { crearItem, esCatalogo, listarCatalogo } from '../../../../../../backend/lib/catalogos';

/** Listado y alta de un catálogo: zonas, tipologías, desarrollistas, propietarios, amenidades. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

/**
 * El nombre del catálogo llega de la dirección, así que se valida contra la
 * lista antes de usarlo. Sin esto habría que confiar en que lo que viene en la
 * URL es uno de los cinco.
 */
function nombreValido(crudo: string | undefined) {
  return crudo && esCatalogo(crudo) ? crudo : null;
}

const NO_EXISTE = { ok: false, error: 'Ese catálogo no existe' };

export const GET: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const nombre = nombreValido(params.catalogo);
  if (!nombre) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  return Response.json(
    { ok: true, data: await listarCatalogo(getDb(), nombre) },
    { headers: sinCache },
  );
};

export const POST: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const nombre = nombreValido(params.catalogo);
  if (!nombre) return Response.json(NO_EXISTE, { status: 404, headers: sinCache });

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const r = await crearItem(getDb(), nombre, crudo);

  if (r.tipo === 'datos') {
    return Response.json(
      { ok: false, error: 'Revisá los datos marcados', campos: r.campos },
      { status: 400, headers: sinCache },
    );
  }
  if (r.tipo === 'repetido') {
    // 409: no es que los datos estén mal, es que choca con algo que ya existe.
    return Response.json(
      { ok: false, error: r.mensaje, campos: { nombre: r.mensaje } },
      { status: 409, headers: sinCache },
    );
  }
  if (r.tipo !== 'ok') {
    return Response.json(
      { ok: false, error: 'No pudimos guardar' },
      { status: 400, headers: sinCache },
    );
  }

  return Response.json({ ok: true, data: { id: r.id } }, { status: 201, headers: sinCache });
};
