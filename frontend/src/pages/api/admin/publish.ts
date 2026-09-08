import type { APIRoute } from 'astro';
import { getDb } from '../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../backend/lib/auth';
import { leerEnv } from '../../../../../backend/lib/entorno';
import { obtenerEstado, publicar } from '../../../../../backend/lib/publicacion';

/**
 * Regenerar el sitio público.
 *
 * El sitio es estático (D-04): lo que se guarda en el panel no se ve hasta
 * que se vuelve a generar. Este endpoint es el botón que lo pide.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

/** Qué mostrar en la barra: si hay cambios sin publicar y desde cuándo. */
export const GET: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const e = await obtenerEstado(getDb());

  return Response.json(
    {
      ok: true,
      data: {
        hayCambiosSinPublicar: e.hayCambiosSinPublicar,
        publicando: e.publicando,
        ultimaPublicacion: e.ultimaPublicacion?.toISOString() ?? null,
        configurado: Boolean(leerEnv('NETLIFY_BUILD_HOOK_URL')),
      },
    },
    { headers: sinCache },
  );
};

export const POST: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const r = await publicar({
    db: getDb(),
    urlDelWebhook: leerEnv('NETLIFY_BUILD_HOOK_URL'),
    pedidaPor: sesion.email,
    registrar: (mensaje, detalle) => console.error(mensaje, detalle ?? ''),
  });

  switch (r.tipo) {
    case 'encolada':
    case 'ya-encolada':
      return Response.json(
        {
          ok: true,
          data: {
            queued: true,
            // Se distingue para que el panel no diga "listo, la pedí" cuando
            // en realidad se sumó a una que ya estaba en camino.
            yaEstaba: r.tipo === 'ya-encolada',
            estimatedSeconds: r.estimadoSegundos,
          },
        },
        { headers: sinCache },
      );

    case 'sin-configurar':
      return Response.json(
        { ok: false, error: r.mensaje, configurado: false },
        { status: 409, headers: sinCache },
      );

    case 'fallo':
      return Response.json({ ok: false, error: r.mensaje }, { status: 502, headers: sinCache });
  }
};
