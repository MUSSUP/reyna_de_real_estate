/**
 * Si una dirección se puede poner en un `href` o un `src`.
 *
 * Vive en su propio archivo **sin ninguna dependencia**, por la misma razón
 * que `anchosImagen.ts` (D-19): esto lo necesitan las páginas del sitio al
 * dibujar, y el módulo de configuración arrastra la base de datos entera.
 *
 * Se valida en positivo —solo `http` y `https`— y no con una lista de
 * esquemas prohibidos, porque esa lista siempre se queda corta: `javascript:`,
 * `data:`, `vbscript:`, y lo que aparezca el año que viene.
 */
export function urlSegura(valor: string): boolean {
  if (valor.trim() === '') return true;
  try {
    const u = new URL(valor.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
