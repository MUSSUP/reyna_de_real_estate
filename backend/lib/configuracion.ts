/**
 * Los textos y datos del sitio que la clienta edita sin tocar código.
 *
 * Dos cosas gobiernan este archivo.
 *
 * 1. **Una dirección que escribe alguien y termina en un `href` es código.**
 *    `redes.instagram` se pega en un enlace, `hero.video_url` en un `<video>`
 *    y `nosotros.photo` en una `<img>`. Escapar no alcanza: `javascript:…` en
 *    un `href` se ejecuta igual. Se valida el esquema al guardar, y además se
 *    desconfía al dibujar — una dirección vieja o cargada por otra vía no
 *    tiene por qué ser buena.
 * 2. **Vaciar un campo no puede romper la página.** Cada lugar que lee una
 *    clave tiene su respaldo (`valor()`), así que borrar un texto devuelve el
 *    que venía de fábrica en vez de dejar un hueco.
 *
 * El catálogo de claves vive acá y no en la base a propósito: qué significa
 * cada clave, qué se puede escribir y qué pasa si se deja vacía es
 * conocimiento del programa, no un dato que se edite.
 */
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { siteSettings } from '../db/schema';
import { urlSegura } from './urlSegura';

export type TipoCampo = 'texto' | 'parrafo' | 'url' | 'telefono' | 'email';

export interface ClaveConfig {
  key: string;
  etiqueta: string;
  /** Qué cambia en el sitio. Se muestra debajo del campo. */
  ayuda?: string;
  tipo: TipoCampo;
  grupo: string;
}

export const GRUPOS: { id: string; titulo: string; descripcion: string }[] = [
  { id: 'hero', titulo: 'Portada', descripcion: 'Lo primero que se ve al entrar al sitio.' },
  { id: 'nosotros', titulo: 'Conóceme', descripcion: 'La sección que te presenta.' },
  {
    id: 'contacto',
    titulo: 'Contacto',
    descripcion: 'Teléfonos, correos y el mensaje con el que arranca WhatsApp.',
  },
  { id: 'redes', titulo: 'Redes', descripcion: 'Los enlaces del pie del sitio.' },
];

/** Claves que no están en el catálogo. No se ocultan: se muestran al final. */
export const GRUPO_OTROS = { id: 'otros', titulo: 'Otros', descripcion: 'Claves sin descripción.' };

export const CATALOGO: ClaveConfig[] = [
  {
    key: 'hero.title',
    etiqueta: 'Título principal',
    ayuda: 'El texto grande sobre el video.',
    tipo: 'texto',
    grupo: 'hero',
  },
  {
    key: 'hero.question',
    etiqueta: 'Pregunta del buscador',
    tipo: 'texto',
    grupo: 'hero',
  },
  { key: 'hero.cta_invertir', etiqueta: 'Botón "Invertir"', tipo: 'texto', grupo: 'hero' },
  { key: 'hero.cta_rentar', etiqueta: 'Botón "Rentar"', tipo: 'texto', grupo: 'hero' },
  {
    key: 'hero.video_url',
    etiqueta: 'Video de fondo',
    ayuda:
      'El archivo tiene que estar en el sitio: pegá una ruta como /video/hero.mp4. Un enlace de Drive o de otra página no se va a ver, lo bloquea la seguridad del sitio. Si lo dejás vacío, la portada muestra la foto de fondo.',
    tipo: 'url',
    grupo: 'hero',
  },
  { key: 'nosotros.title', etiqueta: 'Título de la sección', tipo: 'texto', grupo: 'nosotros' },
  {
    key: 'nosotros.body',
    etiqueta: 'Tu presentación',
    // Este campo es la excepción a la regla de "vaciar no rompe nada": no
    // tiene texto de respaldo, así que sin él la sección entera no se dibuja.
    // Esconderla es lo correcto —una sección con el título y nada debajo se
    // lee como algo roto— pero hay que decirlo donde se edita.
    ayuda: 'Un párrafo por línea en blanco. Si lo dejás vacío, la sección no aparece en el sitio.',
    tipo: 'parrafo',
    grupo: 'nosotros',
  },
  { key: 'nosotros.claim', etiqueta: 'Frase', tipo: 'texto', grupo: 'nosotros' },
  {
    key: 'nosotros.photo',
    etiqueta: 'Tu retrato',
    ayuda:
      'Dirección de la imagen. Si está vacío, la sección se ve bien igual: está diseñada sin foto.',
    tipo: 'url',
    grupo: 'nosotros',
  },
  {
    key: 'contacto.email',
    etiqueta: 'Correo que se publica',
    ayuda: 'El que ve cualquiera que entre al sitio.',
    tipo: 'email',
    grupo: 'contacto',
  },
  {
    key: 'contacto.lead_email',
    etiqueta: 'Correo donde llegan las consultas',
    ayuda: 'No se publica. Es a donde se avisa cuando alguien deja una consulta.',
    tipo: 'email',
    grupo: 'contacto',
  },
  { key: 'contacto.phone_mx', etiqueta: 'Teléfono de México', tipo: 'telefono', grupo: 'contacto' },
  {
    key: 'contacto.phone_ar',
    etiqueta: 'Teléfono de Argentina',
    tipo: 'telefono',
    grupo: 'contacto',
  },
  {
    key: 'whatsapp.primary',
    etiqueta: 'WhatsApp principal',
    ayuda:
      'El número al que llevan todos los botones de WhatsApp. Si se vacía, los botones no aparecen.',
    tipo: 'telefono',
    grupo: 'contacto',
  },
  {
    key: 'whatsapp.message',
    etiqueta: 'Mensaje de WhatsApp',
    ayuda: 'Con el que arranca la conversación desde el sitio.',
    tipo: 'texto',
    grupo: 'contacto',
  },
  {
    key: 'whatsapp.message_property',
    etiqueta: 'Mensaje desde una propiedad',
    ayuda: 'Donde escribas {propiedad} se reemplaza por el nombre de la propiedad.',
    tipo: 'texto',
    grupo: 'contacto',
  },
  { key: 'redes.instagram', etiqueta: 'Instagram', tipo: 'url', grupo: 'redes' },
  { key: 'redes.facebook', etiqueta: 'Facebook', tipo: 'url', grupo: 'redes' },
  { key: 'redes.youtube', etiqueta: 'YouTube', tipo: 'url', grupo: 'redes' },
];

const PORCLAVE = new Map(CATALOGO.map((c) => [c.key, c]));

// --- Validación -------------------------------------------------------------

/** Tope generoso: alcanza para cualquier texto del sitio y frena un pegado accidental de un documento entero. */
export const LARGO_TEXTO = 300;
export const LARGO_PARRAFO = 5000;
export const LARGO_URL = 500;

export { urlSegura };

/** Un teléfono tal como se escribe: dígitos, espacios, `+`, guiones y paréntesis. */
const TELEFONO = /^\+?[\d\s()./-]{6,25}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function revisarValor(clave: ClaveConfig, bruto: string): string | null {
  const v = bruto.trim();
  if (v === '') return null; // Vaciar siempre se permite: hay respaldo.

  switch (clave.tipo) {
    case 'url':
      if (v.length > LARGO_URL) return 'La dirección es demasiado larga';
      // Mensaje concreto: "inválido" no le dice a nadie qué arreglar.
      if (urlSegura(v)) return null;
      // Si el navegador le agregó el esquema a una ruta, se dice exactamente
      // eso en vez de un mensaje genérico: es lo que acaba de pasar.
      if (/^https?:\/\/[^./\s]+(\/|$)/i.test(v)) {
        return `"${v}" apunta a un sitio que no existe. Si querés un archivo de este sitio, escribilo con una barra adelante y sin https, así: /video/hero.mp4`;
      }
      return 'Tiene que empezar con http://, https:// o con una barra, como /video/hero.mp4';

    case 'email':
      return CORREO.test(v) ? null : 'No parece un correo electrónico';

    case 'telefono':
      return TELEFONO.test(v) ? null : 'Dejá solo números, espacios, + y guiones';

    case 'parrafo':
      return v.length > LARGO_PARRAFO ? `No puede pasar de ${LARGO_PARRAFO} caracteres` : null;

    case 'texto':
      if (v.length > LARGO_TEXTO) return `No puede pasar de ${LARGO_TEXTO} caracteres`;
      // Un salto de línea en un título no se ve, pero descoloca el renglón.
      return /[\r\n]/.test(v) ? 'Tiene que ser una sola línea' : null;
  }
}

// --- Leer -------------------------------------------------------------------

export interface CampoConfig extends ClaveConfig {
  valor: string;
}

export interface GrupoConfig {
  id: string;
  titulo: string;
  descripcion: string;
  campos: CampoConfig[];
}

/** Todo lo editable, agrupado y en el orden del catálogo. */
export async function listarConfiguracion(db: Db): Promise<GrupoConfig[]> {
  const filas = await db
    .select({ key: siteSettings.key, valor: siteSettings.valueEs, grupo: siteSettings.group })
    .from(siteSettings);

  const guardado = new Map(filas.map((f) => [f.key, f.valor ?? '']));

  const grupos: GrupoConfig[] = GRUPOS.map((g) => ({
    ...g,
    campos: CATALOGO.filter((c) => c.grupo === g.id).map((c) => ({
      ...c,
      valor: guardado.get(c.key) ?? '',
    })),
  }));

  // Lo que está en la base y no en el catálogo. Ocultarlo haría que una clave
  // quedara sin forma de editarse y sin nadie que supiera que existe.
  const sueltas = filas
    .filter((f) => !PORCLAVE.has(f.key))
    .map<CampoConfig>((f) => ({
      key: f.key,
      etiqueta: f.key,
      tipo: 'texto',
      grupo: GRUPO_OTROS.id,
      valor: f.valor ?? '',
    }));

  if (sueltas.length) grupos.push({ ...GRUPO_OTROS, campos: sueltas });

  return grupos.filter((g) => g.campos.length > 0);
}

// --- Guardar ----------------------------------------------------------------

export type ResultadoConfig =
  { tipo: 'ok'; cambios: number } | { tipo: 'datos'; errores: Record<string, string> };

/**
 * Guarda los valores que llegan. Solo claves del catálogo, y solo las que
 * cambiaron.
 *
 * Una clave que no está en el catálogo **se ignora en silencio**: el
 * formulario nunca la manda, así que si llega es porque alguien armó el pedido
 * a mano, y no hay por qué dejarle crear configuración nueva.
 */
export async function guardarConfiguracion(db: Db, crudo: unknown): Promise<ResultadoConfig> {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
    return { tipo: 'datos', errores: { _: 'No pudimos leer los datos' } };
  }

  const entradas: [ClaveConfig, string][] = [];
  const errores: Record<string, string> = {};

  for (const [key, bruto] of Object.entries(crudo as Record<string, unknown>)) {
    const clave = PORCLAVE.get(key);
    if (!clave) continue;
    if (typeof bruto !== 'string') {
      errores[key] = 'No pudimos leer este campo';
      continue;
    }
    const problema = revisarValor(clave, bruto);
    if (problema) errores[key] = problema;
    else entradas.push([clave, bruto.trim()]);
  }

  // Todo o nada: con un campo mal, se devuelven todos los errores juntos y no
  // se guarda nada. Guardar la mitad deja la pantalla diciendo una cosa y el
  // sitio mostrando otra.
  if (Object.keys(errores).length) return { tipo: 'datos', errores };

  const actuales = new Map(
    (
      await db.select({ key: siteSettings.key, valor: siteSettings.valueEs }).from(siteSettings)
    ).map((f) => [f.key, f.valor ?? '']),
  );

  const ahora = new Date();
  let cambios = 0;

  for (const [clave, valor] of entradas) {
    if (!actuales.has(clave.key)) continue; // La siembra crea las claves; acá no se inventan.
    if (actuales.get(clave.key) === valor) continue;
    await db
      .update(siteSettings)
      .set({ valueEs: valor, updatedAt: ahora })
      .where(eq(siteSettings.key, clave.key));
    cambios++;
  }

  return { tipo: 'ok', cambios };
}
