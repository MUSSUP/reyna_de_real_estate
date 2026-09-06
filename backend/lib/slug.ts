/**
 * Direcciones legibles a partir de un título.
 *
 * El slug de una propiedad **es su dirección pública**: una vez publicada,
 * cambiarlo rompe todo enlace que alguien haya compartido. Por eso se genera
 * una sola vez, al crear, y de ahí en más no se toca aunque cambie el título.
 */

/** "Casa Abatón · Tulum!" → "casa-abaton-tulum" */
export function generarSlug(texto: string): string {
  const base = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');

  return base || 'propiedad';
}

/**
 * Agrega un sufijo hasta que el slug no choque con ninguno existente.
 *
 * Dos propiedades pueden llamarse igual —"Departamento en Tulum" es un título
 * de lo más probable— y la dirección tiene que seguir siendo única.
 */
export function slugUnico(deseado: string, tomados: Iterable<string>): string {
  const usados = new Set(tomados);
  if (!usados.has(deseado)) return deseado;

  for (let n = 2; n < 1000; n++) {
    const candidato = `${deseado}-${n}`;
    if (!usados.has(candidato)) return candidato;
  }

  // Con mil títulos idénticos, algo más raro está pasando; igual no se falla.
  return `${deseado}-${Date.now().toString(36)}`;
}
