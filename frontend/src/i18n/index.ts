import es from './es.json';

/**
 * El sitio sale en español (decisión D-11). La infraestructura queda lista
 * para sumar inglés sin migración: los textos viven acá y no incrustados en
 * los componentes, y las entidades ya tienen sus campos `_en` en la base.
 */
export const IDIOMA_POR_DEFECTO = 'es' as const;
export const IDIOMAS_ACTIVOS = ['es'] as const;

export type Idioma = (typeof IDIOMAS_ACTIVOS)[number];

const diccionarios = { es } as const;

/** Busca un texto de interfaz por su ruta con puntos: t('hero.invertir'). */
export function t(ruta: string, idioma: Idioma = IDIOMA_POR_DEFECTO): string {
  const partes = ruta.split('.');
  let actual: unknown = diccionarios[idioma];

  for (const parte of partes) {
    if (typeof actual !== 'object' || actual === null) return ruta;
    actual = (actual as Record<string, unknown>)[parte];
  }

  return typeof actual === 'string' ? actual : ruta;
}

/**
 * Devuelve el campo en el idioma pedido, con respaldo al español.
 * Nunca deja un hueco: si falta la traducción, se muestra el español.
 */
export function pickLocale<T extends Record<string, unknown>>(
  entidad: T,
  campo: string,
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): string {
  const traducido = entidad[`${campo}_${idioma}`];
  if (typeof traducido === 'string' && traducido.trim() !== '') return traducido;

  const respaldo = entidad[`${campo}_es`];
  return typeof respaldo === 'string' ? respaldo : '';
}
