import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { crearPropiedad, listarPropiedades } from '../../../../../../backend/lib/propiedades';

/**
 * Listado y alta de propiedades.
 *
 * Como todo endpoint del panel, empieza por `requerirSesion` (D-13). La lógica
 * vive en `backend/lib/propiedades.ts`; acá solo se traduce a HTTP.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ request, url }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const listado = await listarPropiedades(getDb(), {
    estado: url.searchParams.get('estado') ?? undefined,
    texto: url.searchParams.get('q') ?? undefined,
    pagina: Number(url.searchParams.get('page') ?? 1) || 1,
    porPagina: Number(url.searchParams.get('perPage') ?? 20) || 20,
  });

  return Response.json({ ok: true, data: listado }, { headers: sinCache });
};

export const POST: APIRoute = async ({ request }) => {
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

  const r = await crearPropiedad(getDb(), crudo);

  if (r.tipo === 'datos') {
    return Response.json(
      { ok: false, error: 'Revisá los datos marcados', campos: r.campos },
      { status: 400, headers: sinCache },
    );
  }
  if (r.tipo !== 'ok') {
    return Response.json(
      { ok: false, error: 'No pudimos guardar la propiedad' },
      { status: 400, headers: sinCache },
    );
  }

  return Response.json(
    { ok: true, data: { id: r.id, slug: r.slug } },
    { status: 201, headers: sinCache },
  );
};
