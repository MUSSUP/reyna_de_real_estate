import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../../backend/lib/auth';
import { crearAlmacenamientoS3 } from '../../../../../../../backend/lib/storage';
import { borrarPortada, guardarPortada } from '../../../../../../../backend/lib/imagenesPropiedad';

/** Imagen principal de una propiedad. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let archivo: File | null = null;
  try {
    const form = await request.formData();
    const v = form.get('archivo');
    if (v instanceof File) archivo = v;
  } catch {
    archivo = null;
  }

  if (!archivo) {
    return Response.json(
      { ok: false, error: 'No llegó ninguna imagen' },
      { status: 400, headers: sinCache },
    );
  }

  const r = await guardarPortada(getDb(), crearAlmacenamientoS3(), params.id!, {
    nombre: archivo.name,
    buffer: Buffer.from(await archivo.arrayBuffer()),
    tamanoDeclarado: archivo.size,
  });

  if (r.tipo === 'no-existe') {
    return Response.json(
      { ok: false, error: 'Esa propiedad no existe' },
      { status: 404, headers: sinCache },
    );
  }
  if (r.tipo === 'rechazada') {
    return Response.json({ ok: false, error: r.motivo }, { status: 400, headers: sinCache });
  }

  return Response.json({ ok: true }, { headers: sinCache });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const r = await borrarPortada(getDb(), crearAlmacenamientoS3(), params.id!);

  if (r.tipo === 'no-existe') {
    return Response.json(
      { ok: false, error: 'Esa propiedad no existe' },
      { status: 404, headers: sinCache },
    );
  }
  if (r.tipo === 'rechazada') {
    return Response.json({ ok: false, error: r.motivo }, { status: 400, headers: sinCache });
  }

  return Response.json({ ok: true }, { headers: sinCache });
};
