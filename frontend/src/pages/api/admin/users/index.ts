import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../backend/db/client';
import { esRespuesta, requerirAccesoCompleto } from '../../../../../../backend/lib/auth';
import { armarCorreoDeAcceso, crearCorreoResend } from '../../../../../../backend/lib/mailer';
import { VALIDEZ_MINUTOS } from '../../../../../../backend/lib/recuperacion';
import { invitarUsuario, listarUsuarios } from '../../../../../../backend/lib/usuarios';

/**
 * Quién entra al panel: ver la lista e invitar.
 *
 * **Sólo acceso completo.** Dar acceso es la acción más consecuente del panel:
 * quien puede invitar puede darle a alguien los datos de los propietarios.
 *
 * Invitar **no manda una contraseña**: crea el acceso y manda un enlace para
 * que la persona ponga la suya. Si el correo falla, el acceso ya quedó creado
 * y hay que decirlo — a diferencia del reseteo, acá no hay nada que ocultar:
 * quien invita es la dueña y necesita saber qué pasó.
 */
export const prerender = false;

const sinCache = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ request }) => {
  const sesion = await requerirAccesoCompleto(request);
  if (esRespuesta(sesion)) return sesion;

  return Response.json(
    { ok: true, data: { usuarios: await listarUsuarios(getDb()) } },
    { headers: sinCache },
  );
};

export const POST: APIRoute = async ({ request, site }) => {
  const sesion = await requerirAccesoCompleto(request);
  if (esRespuesta(sesion)) return sesion;

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'No pudimos leer los datos' },
      { status: 400, headers: sinCache },
    );
  }

  const datos = (crudo ?? {}) as { email?: unknown; nombre?: unknown; rol?: unknown };
  const r = await invitarUsuario(getDb(), {
    email: datos.email,
    nombre: datos.nombre,
    rol: datos.rol,
  });

  if (r.tipo !== 'ok-invitado') {
    const error = r.tipo === 'datos' ? r.error : 'No pudimos crear el acceso';
    return Response.json({ ok: false, error }, { status: 400, headers: sinCache });
  }

  // El dominio sale de la configuración, nunca de la cabecera `Host`: confiar
  // en `Host` deja que alguien reciba un enlace que apunta a su propio
  // servidor, con el token adentro.
  const base = (site?.href ?? 'https://reynaderealestate.com/').replace(/\/$/, '');

  const envio = await crearCorreoResend().enviar({
    para: r.email,
    ...armarCorreoDeAcceso({
      nombre: r.nombre,
      enlace: `${base}/admin/recuperar/${r.token}`,
      motivo: 'invitacion',
      validezMinutos: VALIDEZ_MINUTOS,
    }),
  });

  return Response.json(
    {
      ok: true,
      data: {
        correoEnviado: envio.ok,
        // Si el correo no salió, el acceso igual existe. Decirlo evita que la
        // dueña invite tres veces a la misma persona creyendo que no funcionó.
        aviso: envio.ok
          ? null
          : 'El acceso quedó creado, pero no pudimos mandar el correo. Entrá de nuevo a esta pantalla y usá "Reenviar el enlace".',
      },
    },
    { status: 201, headers: sinCache },
  );
};
