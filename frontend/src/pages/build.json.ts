import type { APIRoute } from 'astro';

/**
 * Cuándo se generó esta versión del sitio.
 *
 * Es la señal que el panel usa para saber que una publicación **ya está en
 * vivo**, y no solamente que el build terminó. Se genera al construir: si este
 * archivo cambió de fecha, el sitio que ve el visitante es nuevo.
 *
 * Preguntarle a la API de Netlify sería lo obvio, pero exigiría otra
 * credencial y respondería "el build terminó", que no es lo mismo que "el
 * visitante ya lo ve". Esto último es lo que le importa a la clienta.
 */
export const prerender = true;

const generado = new Date().toISOString();

export const GET: APIRoute = () =>
  Response.json({ generado }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
