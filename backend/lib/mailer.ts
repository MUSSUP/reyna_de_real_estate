/**
 * Envío de correo.
 *
 * Se usa para avisarle a la clienta que llegó una consulta. La regla que manda
 * acá es la decisión D-08: **si el envío falla, la consulta ya quedó guardada**.
 * Por eso ninguna función de este módulo lanza excepciones — devuelven un
 * resultado que el llamador decide qué hacer con él. Un proveedor de correo
 * caído no puede hacer que se pierda un lead.
 *
 * Igual que el almacenamiento, se define primero la interfaz: cambiar Resend
 * por otro proveedor es escribir otra implementación (RNF-07).
 */
import { leerEnv } from './entorno';

export interface Mensaje {
  para: string;
  asunto: string;
  html: string;
  texto: string;
  /** A quién responde la clienta al apretar "Responder". */
  responderA?: string | undefined;
}

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; motivo: string };

export interface Correo {
  enviar(mensaje: Mensaje): Promise<ResultadoEnvio>;
}

/** Escapa el texto que viene de afuera antes de meterlo en el HTML del mail.
 *  El mensaje de una consulta lo escribe cualquiera desde internet, y los
 *  clientes de correo renderizan HTML. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function crearCorreoResend(): Correo {
  const clave = leerEnv('RESEND_API_KEY');
  const remitente = leerEnv('MAIL_FROM');

  return {
    async enviar(mensaje) {
      if (!clave || !remitente) {
        return { ok: false, motivo: 'Falta configurar RESEND_API_KEY o MAIL_FROM' };
      }

      try {
        const respuesta = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clave}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: remitente,
            to: [mensaje.para],
            subject: mensaje.asunto,
            html: mensaje.html,
            text: mensaje.texto,
            ...(mensaje.responderA ? { reply_to: mensaje.responderA } : {}),
          }),
          // Sin esto, un proveedor lento dejaría colgada la respuesta al visitante.
          signal: AbortSignal.timeout(10_000),
        });

        if (!respuesta.ok) {
          const detalle = await respuesta.text().catch(() => '');
          return {
            ok: false,
            motivo: `El proveedor respondió ${respuesta.status}: ${detalle.slice(0, 200)}`,
          };
        }

        const datos = (await respuesta.json()) as { id?: string };
        return { ok: true, id: datos.id ?? 'sin-id' };
      } catch (error) {
        const motivo = error instanceof Error ? error.message : String(error);
        return { ok: false, motivo };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plantilla del aviso de consulta
// ---------------------------------------------------------------------------

export interface DatosAviso {
  nombre: string;
  email: string;
  telefono?: string | null | undefined;
  interes: 'invertir' | 'rentar' | 'consulta';
  mensaje?: string | null | undefined;
  propiedad?: { titulo: string; url: string } | null | undefined;
  origen?: string | null | undefined;
}

const ETIQUETA_INTERES: Record<DatosAviso['interes'], string> = {
  invertir: 'Invertir',
  rentar: 'Rentar',
  consulta: 'Consulta general',
};

/**
 * Arma el aviso.
 *
 * Está pensado para leerse en el celular y decidir rápido: primero quién
 * consultó y por qué propiedad, y los botones de responder arriba. En este
 * negocio la velocidad de respuesta define la venta (riesgo R-06).
 */
export function armarAvisoDeConsulta(datos: DatosAviso): Omit<Mensaje, 'para'> {
  const asunto = datos.propiedad
    ? `Nueva consulta de ${datos.nombre} — ${datos.propiedad.titulo}`
    : `Nueva consulta de ${datos.nombre}`;

  const telefonoLimpio = datos.telefono?.replace(/[^\d+]/g, '') ?? '';

  const filas: [string, string][] = [
    ['Nombre', escapar(datos.nombre)],
    [
      'Email',
      `<a href="mailto:${escapar(datos.email)}" style="color:#1E4F4C">${escapar(datos.email)}</a>`,
    ],
  ];
  if (datos.telefono) {
    filas.push([
      'Teléfono',
      `<a href="tel:${escapar(telefonoLimpio)}" style="color:#1E4F4C">${escapar(datos.telefono)}</a>`,
    ]);
  }
  filas.push(['Busca', escapar(ETIQUETA_INTERES[datos.interes])]);
  if (datos.propiedad) {
    filas.push([
      'Propiedad',
      `<a href="${escapar(datos.propiedad.url)}" style="color:#1E4F4C">${escapar(datos.propiedad.titulo)}</a>`,
    ]);
  }

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#F2E9E4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#3A3A3A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1E4F4C;padding:20px 24px">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#FB5696">Reyna de Real Estate</p>
      <h1 style="margin:6px 0 0;font-size:19px;font-weight:600;color:#fff">Nueva consulta desde la web</h1>
    </td></tr>
    <tr><td style="padding:24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
        ${filas
          .map(
            ([k, v]) =>
              `<tr><td style="padding:7px 0;color:#6B6B6B;width:96px;vertical-align:top">${k}</td><td style="padding:7px 0">${v}</td></tr>`,
          )
          .join('')}
      </table>
      ${
        datos.mensaje
          ? `<div style="margin-top:18px;padding:14px 16px;background:#F2E9E4;border-radius:8px">
               <p style="margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6B6B6B">Mensaje</p>
               <p style="margin:0;white-space:pre-wrap;line-height:1.55">${escapar(datos.mensaje)}</p>
             </div>`
          : ''
      }
      <div style="margin-top:22px">
        <a href="mailto:${escapar(datos.email)}" style="display:inline-block;background:#FB5696;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:13px;font-weight:600">Responder por mail</a>
        ${
          telefonoLimpio
            ? `<a href="https://wa.me/${escapar(telefonoLimpio.replace('+', ''))}" style="display:inline-block;margin-left:8px;background:#1E4F4C;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:13px;font-weight:600">WhatsApp</a>`
            : ''
        }
      </div>
    </td></tr>
    <tr><td style="padding:14px 24px;border-top:1px solid #F2E9E4;font-size:12px;color:#6B6B6B">
      Llegó desde ${escapar(datos.origen ?? 'el sitio')} · Esta consulta ya quedó guardada en el panel
    </td></tr>
  </table>
</body></html>`;

  const texto = [
    'NUEVA CONSULTA DESDE LA WEB',
    '',
    `Nombre: ${datos.nombre}`,
    `Email: ${datos.email}`,
    datos.telefono ? `Teléfono: ${datos.telefono}` : null,
    `Busca: ${ETIQUETA_INTERES[datos.interes]}`,
    datos.propiedad ? `Propiedad: ${datos.propiedad.titulo} (${datos.propiedad.url})` : null,
    datos.mensaje ? `\nMensaje:\n${datos.mensaje}` : null,
    '',
    `Llegó desde ${datos.origen ?? 'el sitio'}. Ya quedó guardada en el panel.`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { asunto, html, texto, responderA: datos.email };
}
