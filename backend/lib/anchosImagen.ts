/**
 * Qué variantes de ancho existen para una imagen.
 *
 * Vive en su propio archivo, **sin ninguna dependencia**, por una razón que
 * costó un despliegue descubrir: esto lo necesita el sitio público para armar
 * el `srcset`, y antes vivía junto al procesador de imágenes. Importar dos
 * funciones de aritmética arrastraba `sharp` —una librería nativa de
 * procesamiento— a todas las páginas, que en el servidor de Netlify ni
 * siquiera podía cargarse.
 *
 * Regla que deja: lo que necesita el navegador no comparte archivo con lo que
 * solo corre en el servidor.
 */

/** Anchos objetivo. De una imagen dada se generan solo los que tengan sentido. */
export const ANCHOS = [400, 800, 1600] as const;
export type Ancho = (typeof ANCHOS)[number];

/**
 * Qué anchos se generan para una imagen de `width` píxeles.
 *
 * No se agranda nunca: subir una foto de 500px a 1600px la vería peor y
 * ocuparía más. Y no se generan duplicados — sin esto, una imagen de 300px
 * produciría tres archivos idénticos, que con 1 GB de almacenamiento gratuito
 * es desperdicio puro.
 *
 * Es determinista a partir de `width`, que se guarda en la base: quien
 * renderiza puede saber qué variantes existen sin consultar el bucket.
 */
export function anchosPara(width: number): number[] {
  const menores: number[] = ANCHOS.filter((a) => a < width);
  const mayor = Math.min(width, ANCHOS[ANCHOS.length - 1] as number);
  return menores.includes(mayor) ? menores : [...menores, mayor];
}
