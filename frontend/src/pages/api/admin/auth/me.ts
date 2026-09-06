import type { APIRoute } from 'astro';
import { esRespuesta, requerirSesion } from '../../../../../../backend/lib/auth';

export const prerender = false;

/** Quién soy. Lo usa el panel para saber si la sesión sigue viva. */
export const GET: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  return Response.json(
    { ok: true, data: { user: { id: sesion.userId, name: sesion.name, email: sesion.email } } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
