import type { APIRoute } from 'astro';
import { getDb } from '../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../backend/lib/auth';
import { aplicarMovimiento, guardarDestacadas } from '../../../../../backend/lib/destacadas';

/**
 * Guardar qué propiedades van en la portada y en qué orden.
 *
 * Atiende dos caminos. Con JavaScript llega un JSON y se responde un JSON, sin
 * recargar. Sin JavaScript —o desde un teléfono donde arrastrar no funciona—
 * llega un formulario de verdad y se responde con una página: el mismo criterio
 * de D-16, acá aplicado al panel.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };
const VUELTA = '/admin/destacadas';

function esEnvioDeFormulario(request: Request): boolean {
  const tipo = request.headers.get('content-type') ?? '';
  return tipo.includes('application/x-www-form-urlencoded') || tipo.includes('multipart/form-data');
}

function aLista(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') return valor.split(',').filter(Boolean);
  return [];
}

export const PUT: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const deFormulario = esEnvioDeFormulario(request);

  let ids: string[];
  try {
    if (deFormulario) {
      const forma = await request.formData();
      ids = aLista(forma.get('orden'));
      // Sin JavaScript cada botón manda la lista actual **más** qué hacer con
      // ella: subir, bajar, agregar o quitar. El cálculo se hace acá, del
      // mismo lado que el guardado, para que no haya dos interpretaciones.
      const mover = forma.get('mover');
      if (typeof mover === 'string' && mover) ids = aplicarMovimiento(ids, mover);
    } else {
      const cuerpo = (await request.json()) as { ids?: unknown };
      ids = aLista(cuerpo.ids);
    }
  } catch {
    return deFormulario
      ? new Response(null, {
          status: 303,
          headers: { ...sinCache, Location: `${VUELTA}?error=ilegible` },
        })
      : Response.json(
          { ok: false, error: 'No pudimos leer la lista' },
          { status: 400, headers: sinCache },
        );
  }

  const r = await guardarDestacadas(getDb(), ids);

  if (r.tipo === 'datos') {
    return deFormulario
      ? new Response(null, {
          status: 303,
          headers: {
            ...sinCache,
            // El motivo viaja en la dirección porque sin JavaScript no hay
            // dónde guardarlo: la página que se dibuja después es otra.
            Location: `${VUELTA}?error=${encodeURIComponent(r.mensaje)}`,
          },
        })
      : Response.json({ ok: false, error: r.mensaje }, { status: 400, headers: sinCache });
  }

  if (deFormulario) {
    // 303 para que el "atrás" del navegador no reenvíe el guardado.
    return new Response(null, { status: 303, headers: { ...sinCache, Location: VUELTA } });
  }

  return Response.json(
    { ok: true, data: { cantidad: r.cantidad, cambios: r.cambios } },
    { headers: sinCache },
  );
};

/**
 * El formulario sin JavaScript solo sabe mandar `POST`. Se delega en `PUT`,
 * que es el método que describe lo que pasa: se reemplaza la lista completa.
 */
export const POST = PUT;
