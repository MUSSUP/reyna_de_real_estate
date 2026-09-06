import type { APIRoute } from 'astro';
import { cookieDeCierre } from '../../../../../../backend/lib/auth';

export const prerender = false;

/** Cerrar sesión siempre responde bien, haya o no sesión activa. */
export const POST: APIRoute = () =>
  Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': cookieDeCierre() } },
  );
