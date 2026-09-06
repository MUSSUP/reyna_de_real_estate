import { valor, type Configuracion } from './datos';
import { t } from '../i18n';

/**
 * Un solo lugar donde se arma un enlace de WhatsApp.
 *
 * Antes cada página lo construía por su cuenta y terminaron conviviendo tres
 * mensajes distintos y un número sin mensaje. Acá se decide una vez.
 *
 * Los textos salen de la configuración para que la clienta pueda cambiarlos
 * desde el panel sin tocar código; el diccionario es solo el respaldo.
 */

/** wa.me solo acepta dígitos: '+52 984 311 5530' → '529843115530'. */
export const soloDigitos = (texto: string): string => texto.replace(/\D/g, '');

/** El número principal de la marca, ya normalizado. */
export function numeroWhatsApp(config: Configuracion): string {
  return soloDigitos(valor(config, 'whatsapp.primary', valor(config, 'contacto.phone_mx')));
}

interface Opciones {
  /** Título de la propiedad. Si viene, el mensaje la nombra. */
  propiedad?: string | undefined;
  /** Otro número (el de Argentina, por ejemplo). Por defecto, el principal. */
  numero?: string | undefined;
}

/**
 * Devuelve el enlace listo, o cadena vacía si no hay número cargado.
 * Quien lo use debe contemplar el vacío: sin número no se pinta el botón.
 */
export function enlaceWhatsApp(config: Configuracion, opciones: Opciones = {}): string {
  const numero = opciones.numero ? soloDigitos(opciones.numero) : numeroWhatsApp(config);
  if (!numero) return '';

  const mensaje = opciones.propiedad
    ? valor(config, 'whatsapp.message_property', t('whatsapp.propiedad')).replace(
        '{propiedad}',
        opciones.propiedad,
      )
    : valor(config, 'whatsapp.message', t('whatsapp.general'));

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
