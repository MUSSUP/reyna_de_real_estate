import type { APIRoute } from 'astro';
import {
  NOTICIAS_POR_PAGINA,
  obtenerInformes,
  obtenerNoticias,
  obtenerPublicadas,
} from '../lib/datos';

/**
 * El mapa del sitio para los buscadores.
 *
 * Se genera al construir, como el resto del sitio público (D-04), así que
 * refleja exactamente lo que la clienta publicó la última vez.
 *
 * **Hoy no sirve de nada, y está bien.** El sitio se entrega con la
 * indexación bloqueada (`robots.txt` + la cabecera `X-Robots-Tag`): mientras
 * muestre datos de demostración, ocho propiedades inventadas bajo la marca de
 * la clienta es lo peor que podría aparecer si alguien la busca. Esto queda
 * listo para el día que se abra — la acción A-11, que son tres pasos y están
 * escritos en `docs/entrega.md`.
 *
 * Escrito a mano en vez de con un paquete. Son veinte líneas, y agregar una
 * dependencia a este proyecto ya salió mal una vez: `npm audit fix` rompió el
 * árbol entero y hubo que restaurar el `package-lock.json` de una copia.
 *
 * **Lo que NO entra, a propósito**: el panel y las APIs (no son públicos), las
 * páginas de error y las de "consulta no enviada" (no hay nada que buscar en
 * ellas), `/gracias` (sólo tiene sentido después de enviar un formulario) y
 * `/sistema`, que es el muestrario de componentes.
 */
export const prerender = true;

/** Las fechas van sin hora: es lo que los buscadores usan, y no da pistas de cuándo se trabaja. */
const soloFecha = (f: Date | string | null | undefined) => {
  if (!f) return undefined;
  const d = typeof f === 'string' ? new Date(f) : f;
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

interface Entrada {
  ruta: string;
  fecha?: string | undefined;
  /** Cuánto importa esta página respecto de las otras del sitio, de 0 a 1. */
  peso: string;
}

export const GET: APIRoute = async ({ site }) => {
  const [propiedades, noticias, informes] = await Promise.all([
    obtenerPublicadas(),
    obtenerNoticias(),
    obtenerInformes(),
  ]);

  const paginasDeNoticias = Math.ceil(noticias.length / NOTICIAS_POR_PAGINA);

  const entradas: Entrada[] = [
    { ruta: '/', peso: '1.0' },
    { ruta: '/propiedades', peso: '0.9' },
    { ruta: '/noticias', peso: '0.7' },
  ];

  // La primera página del listado es `/noticias`, así que las extra arrancan
  // en la 2 — igual que las rutas que se generan.
  for (let n = 2; n <= paginasDeNoticias; n++) {
    entradas.push({ ruta: `/noticias/pagina/${n}`, peso: '0.4' });
  }

  // Las fichas son el contenido que de verdad se busca: una propiedad concreta
  // en una zona concreta.
  //
  // Van sin `lastmod`: `PropiedadLista` trae sólo los campos públicos
  // (`camposPublicos` en `lib/datos.ts`) y `updatedAt` no está entre ellos.
  // Ese conjunto acotado es la defensa que mantiene los datos de los
  // propietarios fuera del sitio, y no se amplía por una fecha que el
  // formato declara opcional y los buscadores casi no miran.
  for (const p of propiedades) {
    entradas.push({ ruta: `/propiedades/${p.slug}`, peso: '0.8' });
  }

  for (const n of noticias) {
    entradas.push({
      ruta: `/noticias/${n.slug}`,
      fecha: soloFecha(n.updatedAt ?? n.publishedAt),
      peso: '0.6',
    });
  }

  for (const i of informes) {
    entradas.push({
      ruta: `/insights/${i.slug}`,
      fecha: soloFecha(i.updatedAt ?? i.publishedAt),
      peso: '0.6',
    });
  }

  // `site` sale de astro.config. Si faltara, una dirección relativa haría un
  // mapa inválido en silencio, así que mejor que falle la construcción.
  if (!site) throw new Error('Falta `site` en astro.config: el mapa del sitio necesita el dominio');
  const base = site.href.replace(/\/$/, '');

  const cuerpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entradas.map(({ ruta, fecha, peso }) =>
      [
        '  <url>',
        `    <loc>${base}${ruta}</loc>`,
        fecha ? `    <lastmod>${fecha}</lastmod>` : null,
        `    <priority>${peso}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(cuerpo, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
