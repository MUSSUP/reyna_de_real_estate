import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../../../backend/lib/auth';
import { crearAlmacenamientoS3 } from '../../../../../../../backend/lib/storage';
import {
  actualizarGaleria,
  agregarAGaleria,
  borrarDeGaleria,
} from '../../../../../../../backend/lib/imagenesPropiedad';

/** Galería de una propiedad: agregar, reordenar y borrar. */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let archivos: File[] = [];
  try {
    const form = await request.formData();
    archivos = form.getAll('archivos').filter((v): v is File => v instanceof File);
  } catch {
    archivos = [];
  }

  if (archivos.length === 0) {
    return Response.json(
      { ok: false, error: 'No seleccionaste ninguna imagen' },
      { status: 400, headers: sinCache },
    );
  }

  const entrantes = await Promise.all(
    archivos.map(async (a) => ({
      nombre: a.name,
      buffer: Buffer.from(await a.arrayBuffer()),
      tamanoDeclarado: a.size,
    })),
  );

  const r = await agregarAGaleria(getDb(), crearAlmacenamientoS3(), params.id!, entrantes);

  if (r.tipo === 'no-existe') {
    return Response.json(
      { ok: false, error: 'Esa propiedad no existe' },
      { status: 404, headers: sinCache },
    );
  }
  if (r.tipo === 'rechazada') {
    return Response.json({ ok: false, error: r.motivo }, { status: 400, headers: sinCache });
  }

  // Se dice cuántas entraron: si alguien arrastra diez y una estaba rota,
  // tiene que poder notarlo sin contar las miniaturas.
  return Response.json(
    { ok: true, data: { agregadas: r.agregadas, pedidas: archivos.length } },
    { headers: sinCache },
  );
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let items: { id: string; alt?: string | null }[] = [];
  try {
    const cuerpo = (await request.json()) as { imagenes?: unknown };
    if (Array.isArray(cuerpo.imagenes)) {
      items = cuerpo.imagenes
        .filter(
          (i): i is { id: string; alt?: string } =>
            Boolean(i) && typeof i === 'object' && typeof (i as { id?: unknown }).id === 'string',
        )
        .map((i) => ({ id: i.id, alt: typeof i.alt === 'string' ? i.alt : null }));
    }
  } catch {
    items = [];
  }

  await actualizarGaleria(getDb(), params.id!, items);
  return Response.json({ ok: true }, { headers: sinCache });
};

export const DELETE: APIRoute = async ({ request, params, url }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const imagenId = url.searchParams.get('imagen');
  if (!imagenId) {
    return Response.json(
      { ok: false, error: 'Falta indicar qué imagen borrar' },
      { status: 400, headers: sinCache },
    );
  }

  const r = await borrarDeGaleria(getDb(), crearAlmacenamientoS3(), params.id!, imagenId);

  if (r.tipo === 'no-existe') {
    return Response.json(
      { ok: false, error: 'Esa imagen no existe' },
      { status: 404, headers: sinCache },
    );
  }

  return Response.json({ ok: true }, { headers: sinCache });
};
