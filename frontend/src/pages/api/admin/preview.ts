import type { APIRoute } from 'astro';
import { esRespuesta, requerirSesion } from '../../../../../backend/lib/auth';
import { bloquesDeTexto } from '../../../lib/articulos';

/**
 * Parte un texto en bloques, para la vista previa del panel.
 *
 * **Existe para que haya un solo interpretador de marcado.** La vista previa
 * podría armarse enteramente en el navegador, pero entonces el panel y el
 * sitio tendrían dos lectores distintos del mismo texto, y el día que no
 * coincidan la vista previa va a estar mintiendo — que es exactamente lo que
 * una vista previa no puede hacer.
 *
 * Así que el que parte es `bloquesDeTexto`, el mismo que usan las páginas
 * públicas, y el navegador solo dibuja un elemento por bloque **con
 * `textContent`**: nunca HTML.
 *
 * No toca la base. Es una función pura detrás del control de sesión.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

/** El mismo tope que el campo del formulario. */
const LARGO_MAXIMO = 50_000;

export const POST: APIRoute = async ({ request }) => {
  const sesion = await requerirSesion(request);
  if (esRespuesta(sesion)) return sesion;

  let texto: unknown;
  try {
    texto = ((await request.json()) as { texto?: unknown }).texto;
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer el texto' },
      { status: 400, headers: sinCache },
    );
  }

  if (typeof texto !== 'string') {
    return Response.json(
      { ok: false, error: 'No pudimos leer el texto' },
      { status: 400, headers: sinCache },
    );
  }

  return Response.json(
    { ok: true, data: { bloques: bloquesDeTexto(texto.slice(0, LARGO_MAXIMO)) } },
    { headers: sinCache },
  );
};
