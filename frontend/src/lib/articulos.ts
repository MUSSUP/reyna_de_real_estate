/**
 * Cómo se lee el cuerpo de una noticia o un informe.
 *
 * El texto lo escribe la clienta desde el panel. **Nunca se inserta como
 * HTML**: se parte en bloques y cada bloque se renderiza como un elemento, con
 * el texto interpolado — que Astro escapa solo. Meter contenido editable en la
 * página con `set:html` es la forma más común de abrir un XSS, y acá no hace
 * ninguna falta.
 *
 * Los enlaces son la excepción aparente, y tampoco usan `set:html`: un párrafo
 * se parte además en **trozos**, y el que lleva dirección se dibuja como un
 * `<a>` con el texto y el `href` interpolados. Sigue sin haber HTML editable
 * en la página; lo único que entra es una dirección, y antes pasa por
 * `urlSegura`, que valida en positivo.
 */
import { urlSegura } from '../../../backend/lib/urlSegura';

/**
 * Un pedazo de párrafo. Sin `url` es texto; con `url` es un enlace.
 *
 * Existe para poder dibujar enlaces sin insertar HTML. El componente recorre
 * los trozos y decide el elemento; el texto y la dirección siempre viajan
 * interpolados.
 *
 * **No vive dentro del bloque a propósito.** Un bloque describe la estructura
 * del texto —qué es título, qué es cita— y el corte en enlaces es una
 * decisión de cómo se dibuja un párrafo. Guardar las dos cosas juntas
 * duplicaba el mismo texto en dos formas, con el riesgo de que una quedara
 * vieja; el componente pide el corte cuando lo necesita.
 */
export type Trozo = { texto: string; url?: string };

export type Bloque =
  /** `##` — una sección del texto. */
  | { tipo: 'titulo'; texto: string }
  /** `###` — un apartado dentro de una sección. En el informe son los pilares. */
  | { tipo: 'pilar'; texto: string }
  /** `>` — una cita destacada, para respirar entre bloques largos. */
  | { tipo: 'cita'; texto: string }
  | { tipo: 'parrafo'; texto: string };

/**
 * `[texto](dirección)`, la forma de Markdown que ya conoce cualquiera que
 * haya escrito en internet.
 *
 * El texto no puede tener `]` ni salto de línea, y la dirección no puede
 * tener espacios ni `)`. Es a propósito: un patrón estrecho no se pelea con
 * los corchetes y paréntesis que alguien escriba por otro motivo.
 */
const ENLACE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/**
 * Parte un párrafo en texto y enlaces.
 *
 * Una dirección que no sirve **no se descarta**: el párrafo queda tal como se
 * escribió, con los corchetes a la vista. Es más honesto que tragarse el
 * texto o dibujar un enlace que no lleva a ninguna parte — quien escribió ve
 * que algo no salió y puede corregirlo.
 */
export function trozosDeParrafo(texto: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;

  for (const encontrado of texto.matchAll(ENLACE)) {
    const url = encontrado[2]!.trim();
    const indice = encontrado.index!;

    // `urlSegura` acepta la cadena vacía (un campo sin llenar no es un error)
    // y rutas del propio sitio. Acá lo vacío sí es un error: un enlace sin
    // destino no es un enlace.
    if (url === '' || !urlSegura(url)) continue;

    if (indice > desde) trozos.push({ texto: texto.slice(desde, indice) });
    trozos.push({ texto: encontrado[1]!.trim(), url });
    desde = indice + encontrado[0]!.length;
  }

  if (desde < texto.length) trozos.push({ texto: texto.slice(desde) });
  return trozos;
}

/**
 * Parte el cuerpo en bloques.
 *
 * Reconoce cuatro cosas y nada más: `##` es una sección, `###` un apartado,
 * `>` una cita, y lo demás son párrafos separados por una línea en blanco.
 * Cualquier otro símbolo se muestra tal cual, que es lo que espera quien
 * escribe sin saber de marcado.
 *
 * La cita entró porque el informe la usa dos veces y, sin reconocerla, el `>`
 * aparecía impreso en la página. Lo mismo le pasaría a la clienta el día que
 * quiera citar algo desde el panel.
 */
export function bloquesDeTexto(cuerpo: string | null | undefined): Bloque[] {
  if (!cuerpo) return [];

  return cuerpo
    .split(/\n\s*\n/)
    .map((bruto) => bruto.trim())
    .filter((bruto) => bruto !== '')
    .flatMap((bruto): Bloque[] => {
      // Un título puede venir pegado a su párrafo, sin línea en blanco en el
      // medio — así está escrito el informe. Por eso se separa la primera
      // línea del resto en vez de tomar el bloque entero como título: si no,
      // el párrafo termina adentro del encabezado.
      const encabezado = bruto.match(/^(#{2,3})[ \t]+([^\n]*)\n?([\s\S]*)$/);
      if (encabezado) {
        const tipo = encabezado[1] === '###' ? 'pilar' : 'titulo';
        const bloques: Bloque[] = [{ tipo, texto: encabezado[2]!.trim() }];
        const resto = encabezado[3]!.trim();
        if (resto) bloques.push(...bloquesDeTexto(resto));
        return bloques;
      }

      // La cita puede ocupar varias líneas; cada una repite el `>`.
      if (/^>[ \t]?/.test(bruto)) {
        return [
          {
            tipo: 'cita',
            texto: bruto
              .split('\n')
              .map((l) => l.replace(/^>[ \t]?/, '').trim())
              .join(' ')
              .trim(),
          },
        ];
      }

      // Un salto simple dentro del párrafo es continuación, no corte.
      return [{ tipo: 'parrafo', texto: bruto.replace(/\s*\n\s*/g, ' ') }];
    });
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** "14 de agosto de 2026". Se arma a mano para no depender de la zona horaria del servidor. */
export function fechaLegible(fecha: Date | string | null | undefined): string {
  if (!fecha) return '';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Para el atributo `datetime`, que los buscadores sí leen. */
export function fechaISO(fecha: Date | string | null | undefined): string | undefined {
  if (!fecha) return undefined;
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

/** Minutos de lectura, redondeando siempre hacia arriba. */
export function minutosDeLectura(cuerpo: string | null | undefined): number {
  const palabras = (cuerpo ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}
