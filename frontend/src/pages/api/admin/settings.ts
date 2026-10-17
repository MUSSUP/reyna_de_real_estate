import type { APIRoute } from 'astro';
import { getDb } from '../../../../../backend/db/client';
import { esRespuesta, requerirSesion } from '../../../../../backend/lib/auth';
import { guardarConfiguracion } from '../../../../../backend/lib/configuracion';

/**
 * Guardar los textos y datos del sitio.
 *
 * Igual que las destacadas: con JavaScript llega un JSON y se responde un
 * JSON; sin JavaScript llega un formulario de verdad y se responde con una
 * página. El mismo criterio de D-16, acá aplicado al panel.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };
const VUELTA = '/admin/configuracion';

function esEnvioDeFormulario(request: Request): boolean {
  const tipo = request.headers.get('content-type') ?? '';
  return tipo.includes('application/x-www-form-urlencoded') || tipo.includes('multipart/form-data');
}

export const PUT: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  const deFormulario = esEnvioDeFormulario(request);

  let valores: Record<string, unknown>;
  try {
    valores = deFormulario
      ? (Object.fromEntries(await request.formData()) as Record<string, unknown>)
      : ((await request.json()) as Record<string, unknown>);
  } catch {
    return deFormulario
      ? new Response(null, {
          status: 303,
          headers: { ...sinCache, Location: `${VUELTA}?guardado=ilegible` },
        })
      : Response.json(
          { ok: false, error: 'No pudimos leer los datos' },
          { status: 400, headers: sinCache },
        );
  }

  const r = await guardarConfiguracion(getDb(), valores);

  if (r.tipo === 'datos') {
    if (deFormulario) {
      // Sin JavaScript no hay dónde dejar los errores: la página que se dibuja
      // después es otra. Viajan los mensajes, no solo las claves — la página
      // no los puede recalcular, porque lo que tiene guardado siempre es
      // válido y el valor que se acaba de escribir ya no está en ningún lado.
      return new Response(null, {
        status: 303,
        headers: {
          ...sinCache,
          Location: `${VUELTA}?revisar=${encodeURIComponent(JSON.stringify(r.errores))}`,
        },
      });
    }
    return Response.json(
      { ok: false, error: 'Revisá los campos marcados', campos: r.errores },
      { status: 400, headers: sinCache },
    );
  }

  if (deFormulario) {
    // 303 para que el "atrás" del navegador no reenvíe el guardado.
    return new Response(null, {
      status: 303,
      headers: { ...sinCache, Location: `${VUELTA}?guardado=${r.cambios}` },
    });
  }

  return Response.json({ ok: true, data: { cambios: r.cambios } }, { headers: sinCache });
};

/** El formulario sin JavaScript solo sabe mandar `POST`. */
export const POST = PUT;
