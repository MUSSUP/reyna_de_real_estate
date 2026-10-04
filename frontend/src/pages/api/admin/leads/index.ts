import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { contarPorEstado, listarConsultas } from '../../../../../../backend/lib/consultasPanel';

/** La bandeja de consultas. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ request, url }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const db = getDb();
  const [listado, counts] = await Promise.all([
    listarConsultas(db, {
      estado: url.searchParams.get('status') ?? undefined,
      desde: url.searchParams.get('from') ?? undefined,
      hasta: url.searchParams.get('to') ?? undefined,
      pagina: Number(url.searchParams.get('page') ?? 1) || 1,
      porPagina: Number(url.searchParams.get('perPage') ?? 50) || 50,
    }),
    contarPorEstado(db),
  ]);

  return Response.json({ ok: true, data: { ...listado, counts } }, { headers: sinCache });
};
