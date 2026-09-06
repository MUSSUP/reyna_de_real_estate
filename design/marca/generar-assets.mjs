/**
 * Genera los assets públicos del logo a partir de los originales de la marca.
 *
 *   node design/marca/generar-assets.mjs
 *
 * Los originales de esta carpeta son la fuente: los entregó la clienta y no se
 * pueden regenerar. Todo lo que vive en `frontend/public/logos/` sale de acá.
 *
 * La clienta entregó ocho variantes (corona rosa o turquesa × texto negro,
 * blanco, rosa o turquesa). El sitio usa **solo la corona rosa**: el turquesa
 * no está en la paleta y sumarlo era cambiar la marca, no reemplazar un logo.
 *
 * Necesita `sharp`, que ya es dependencia del proyecto.
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// fileURLToPath y no .pathname: la ruta del proyecto tiene espacios.
const MARCA = fileURLToPath(new URL('.', import.meta.url));
const OUT = fileURLToPath(new URL('../../frontend/public/logos/', import.meta.url));
const CREMA = '#F2E9E4';

const recortado = (f) => sharp(MARCA + f).trim({ threshold: 1 });

// --- Lockups -------------------------------------------------------------
// La barra lo muestra a 44px de alto. A 160 sobra para pantallas 3x (132px)
// y el archivo pesa la mitad que a 240, sin diferencia visible.
for (const [origen, destino] of [
  ['lockup-rosa-texto-blanco.png', 'logo-claro.webp'],
  ['lockup-rosa-texto-negro.png', 'logo-oscuro.webp'],
]) {
  const info = await recortado(origen)
    .resize({ height: 160 })
    .webp({ quality: 90, effort: 6 })
    .toFile(OUT + destino);
  console.log(
    destino.padEnd(20),
    info.width + 'x' + info.height,
    (info.size / 1024).toFixed(1) + ' KB',
  );
}

// --- Isotipo -------------------------------------------------------------
// La corona rosa se lee bien sobre claro y sobre oscuro: un solo archivo.
{
  const info = await recortado('iso-rosa.png')
    .resize({ height: 264 })
    .webp({ quality: 90, effort: 6 })
    .toFile(OUT + 'iso.webp');
  console.log(
    'iso.webp'.padEnd(20),
    info.width + 'x' + info.height,
    (info.size / 1024).toFixed(1) + ' KB',
  );
}

// --- Favicon -------------------------------------------------------------
// La corona es apaisada (1.59:1). En un cuadrado siempre sobra alto, así que
// va a sangre a lo ancho: es lo que más presencia le da a 16px sin deformarla.
// Estirarla para llenar el cuadro se probó y se descartó: alarga las puntas.
{
  const corona = await recortado('iso-rosa.png').resize({ width: 64 }).png().toBuffer();
  const info = await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: corona, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(OUT + 'favicon.png');
  console.log(
    'favicon.png'.padEnd(20),
    info.width + 'x' + info.height,
    (info.size / 1024).toFixed(1) + ' KB',
  );
}

// --- Tarjeta social ------------------------------------------------------
// Faltaba: Base.astro la referenciaba y el archivo no existía.
{
  const logo = await recortado('lockup-rosa-texto-negro.png')
    .resize({ width: 820 })
    .png()
    .toBuffer();
  const info = await sharp({ create: { width: 1200, height: 630, channels: 4, background: CREMA } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(OUT + 'og-default.png');
  console.log(
    'og-default.png'.padEnd(20),
    info.width + 'x' + info.height,
    (info.size / 1024).toFixed(1) + ' KB',
  );
}
