/**
 * Validación de archivos de imagen.
 *
 * La regla central: **el tipo se decide por el contenido del archivo, no por su
 * nombre ni por el `Content-Type` que declara el cliente**. Ambos los controla
 * quien sube, así que renombrar `algo.exe` a `foto.jpg` no debe alcanzar para
 * que entre.
 */

export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type TipoPermitido = (typeof TIPOS_PERMITIDOS)[number];

/** 10 MB por archivo (data_model.md). */
export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/** Hasta 15 imágenes de galería por propiedad. La portada no cuenta. */
export const MAXIMO_IMAGENES_GALERIA = 15;

export type ResultadoValidacion =
  | { ok: true; tipo: TipoPermitido; extension: 'jpg' | 'png' | 'webp' }
  | { ok: false; motivo: string };

/**
 * Lee la firma binaria (los primeros bytes) para saber qué es el archivo
 * realmente. Cada formato tiene una marca reconocible al principio.
 */
function detectarPorFirma(
  buffer: Buffer,
): { tipo: TipoPermitido; extension: 'jpg' | 'png' | 'webp' } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { tipo: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const firmaPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (firmaPng.every((byte, i) => buffer[i] === byte)) {
    return { tipo: 'image/png', extension: 'png' };
  }

  // WebP: "RIFF" ... "WEBP" (el tamaño va en el medio, bytes 4 a 7)
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { tipo: 'image/webp', extension: 'webp' };
  }

  return null;
}

/**
 * Valida un archivo subido. Devuelve el tipo real o el motivo del rechazo,
 * en un mensaje que se le puede mostrar a la clienta.
 */
export function validarImagen(buffer: Buffer, tamanoDeclarado?: number): ResultadoValidacion {
  if (buffer.length === 0) {
    return { ok: false, motivo: 'El archivo está vacío' };
  }

  // Se mide el buffer real, no lo que diga el cliente.
  if (buffer.length > TAMANO_MAXIMO_BYTES) {
    const mb = (buffer.length / 1024 / 1024).toFixed(1);
    return { ok: false, motivo: `La imagen pesa ${mb} MB y el máximo es 10 MB` };
  }

  // Si el tamaño declarado no coincide con el real, algo no cierra.
  if (tamanoDeclarado !== undefined && tamanoDeclarado !== buffer.length) {
    return { ok: false, motivo: 'El archivo llegó incompleto o alterado' };
  }

  const detectado = detectarPorFirma(buffer);
  if (!detectado) {
    return { ok: false, motivo: 'El archivo no es una imagen JPG, PNG o WebP' };
  }

  return { ok: true, ...detectado };
}

/**
 * Limpia el nombre original para usarlo en la ruta de almacenamiento.
 * Quita todo lo que pueda salirse de la carpeta o romper una URL.
 */
export function sanearNombre(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .replace(/\.[^.]+$/, '') // extensión: la ponemos nosotros según la firma
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base || 'imagen';
}

export type ResultadoCupo = { ok: true } | { ok: false; motivo: string };

/**
 * Verifica si entran más imágenes en la galería de una propiedad.
 *
 * El mensaje dice cuántas entran todavía, no solo que no se puede: si alguien
 * arrastra 20 fotos de una vez, tiene que poder entender qué hacer.
 */
export function verificarCupoGaleria(actuales: number, aAgregar: number): ResultadoCupo {
  if (aAgregar <= 0) {
    return { ok: false, motivo: 'No seleccionaste ninguna imagen' };
  }

  const disponibles = MAXIMO_IMAGENES_GALERIA - actuales;

  if (disponibles <= 0) {
    return {
      ok: false,
      motivo: `Llegaste al máximo de ${MAXIMO_IMAGENES_GALERIA} imágenes. Borrá alguna para subir otra`,
    };
  }

  if (aAgregar > disponibles) {
    const plural = disponibles === 1 ? 'entra 1 imagen más' : `entran ${disponibles} imágenes más`;
    return {
      ok: false,
      motivo: `Seleccionaste ${aAgregar} imágenes pero solo ${plural}`,
    };
  }

  return { ok: true };
}
