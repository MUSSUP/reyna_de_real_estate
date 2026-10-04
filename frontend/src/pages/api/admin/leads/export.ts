import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';
import { exportarCsv } from '../../../../../../backend/lib/consultasPanel';

/** Las consultas en CSV, respetando los filtros del listado. */
export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const csv = await exportarCsv(getDb(), {
    estado: url.searchParams.get('status') ?? undefined,
    desde: url.searchParams.get('from') ?? undefined,
    hasta: url.searchParams.get('to') ?? undefined,
  });

  const hoy = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      // `charset=utf-8` junto con el BOM: así Excel no duda de la codificación.
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="consultas-${hoy}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
