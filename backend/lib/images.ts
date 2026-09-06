/**
 * Procesamiento de imágenes.
 *
 * De cada archivo subido se generan tres variantes WebP. El navegador elige la
 * que necesita según el ancho de pantalla, así el celular no descarga la foto
 * de escritorio.
 *
 * Se guardan las dimensiones para poder reservar el espacio en la página y
 * evitar que el texto salte cuando termina de cargar la imagen.
 */
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import type { Almacenamiento } from './storage';
import { sanearNombre, validarImagen, type ResultadoValidacion } from './imageValidation';
// Los anchos viven aparte: el sitio público los necesita sin arrastrar sharp.
import { ANCHOS, anchosPara, type Ancho } from './anchosImagen';
export { ANCHOS, anchosPara, type Ancho };

export interface ImagenProcesada {
  /** Ruta base sin el sufijo de ancho: así se guarda en la base. */
  rutaBase: string;
  /** Dimensiones del original, para reservar espacio en la página. */
  width: number;
  height: number;
  variantes: { ancho: number; ruta: string; bytes: number }[];
}

export type ResultadoProcesado =
  { ok: true; imagen: ImagenProcesada } | { ok: false; motivo: string };

/**
 * Valida, convierte y guarda una imagen.
 *
 * El orden importa: primero se valida por firma binaria, y recién después se
 * le pasa el archivo a Sharp. Nunca al revés — Sharp no debería ser la primera
 * defensa frente a un archivo que no sabemos qué es.
 */
export async function procesarYGuardar(
  almacenamiento: Almacenamiento,
  buffer: Buffer,
  opciones: { carpeta: string; nombreOriginal: string; tamanoDeclarado?: number },
): Promise<ResultadoProcesado> {
  const validacion: ResultadoValidacion = validarImagen(buffer, opciones.tamanoDeclarado);
  if (!validacion.ok) {
    return { ok: false, motivo: validacion.motivo };
  }

  let metadatos;
  try {
    metadatos = await sharp(buffer).metadata();
  } catch {
    // La firma decía que era una imagen pero el contenido está roto.
    return { ok: false, motivo: 'No pudimos leer la imagen. Probá con otro archivo' };
  }

  /**
   * Las fotos de celular suelen venir apaisadas con una marca EXIF que dice
   * "rotar 90°". Sharp reporta en `width`/`height` el bitmap crudo, y en
   * `autoOrient` las dimensiones tal como se ven una vez aplicada esa marca.
   *
   * Hay que guardar las de `autoOrient`: las variantes salen rotadas, así que
   * si guardáramos las crudas diríamos que una foto vertical es apaisada, y la
   * página reservaría el espacio al revés — el salto de layout que queremos
   * evitar (RNF-01).
   */
  const width = metadatos.autoOrient?.width ?? metadatos.width;
  const height = metadatos.autoOrient?.height ?? metadatos.height;

  if (!width || !height) {
    return { ok: false, motivo: 'No pudimos leer el tamaño de la imagen' };
  }

  // Identificador único: dos archivos con el mismo nombre nunca se pisan, y
  // permite cachear para siempre porque una ruta dada no cambia de contenido.
  const nombre = sanearNombre(opciones.nombreOriginal);
  const carpeta = opciones.carpeta.replace(/^\/+|\/+$/g, '');
  const rutaBase = `${carpeta}/${nombre}-${randomUUID().slice(0, 8)}`;

  const variantes: ImagenProcesada['variantes'] = [];

  for (const ancho of anchosPara(width)) {
    const convertida = await sharp(buffer)
      .rotate() // respeta la orientación EXIF de las fotos de celular
      .resize({ width: ancho, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const ruta = `${rutaBase}-${ancho}.webp`;
    await almacenamiento.guardar(ruta, convertida, 'image/webp');
    variantes.push({ ancho, ruta, bytes: convertida.length });
  }

  return { ok: true, imagen: { rutaBase, width, height, variantes } };
}

/** Borra todas las variantes de una imagen. */
export async function borrarImagen(
  almacenamiento: Almacenamiento,
  rutaBase: string,
  width: number,
): Promise<void> {
  await Promise.all(
    anchosPara(width).map((ancho) => almacenamiento.borrar(`${rutaBase}-${ancho}.webp`)),
  );
}

/**
 * Arma el `srcset` para que el navegador elija el ancho que necesita.
 * Se pasa `width` porque de él dependen las variantes que existen.
 */
export function construirSrcSet(
  almacenamiento: Almacenamiento,
  rutaBase: string,
  width: number,
): string {
  return anchosPara(width)
    .map((a) => `${almacenamiento.urlPublica(`${rutaBase}-${a}.webp`)} ${a}w`)
    .join(', ');
}
