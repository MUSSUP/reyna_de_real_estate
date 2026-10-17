/**
 * Que ningún mensaje de error llegue a la pantalla en inglés.
 *
 * No es una cuestión de prolijidad. Lo que ve la clienta cuando algo sale mal
 * es exactamente este texto, debajo del campo: si dice "Too big: expected
 * string to have <=200 characters", no sabe qué arreglar y nos escribe.
 *
 * Esta prueba existe porque **ya pasó**: la revisión del Hito 2 encontró siete
 * mensajes de Zod sin traducir después de que yo diera el tema por cerrado. En
 * vez de volver a revisarlos de a uno, se prueban todos de una: se le dan
 * datos malos a cada esquema y se exige que nada de lo que vuelve parezca
 * inglés.
 */
import { describe, expect, it } from 'vitest';
import {
  erroresPorCampo,
  esquemaArticulo,
  esquemaConsulta,
  esquemaPropiedad,
  esquemaPropiedadParcial,
} from '../../backend/lib/validation';
import { CATALOGOS } from '../../backend/lib/catalogos';
import { crearItem } from '../../backend/lib/catalogos';
import { crearBaseEfimera } from '../base-efimera';

/**
 * Palabras que solo aparecen en los mensajes de fábrica de Zod.
 *
 * Se buscan palabras y no "cualquier texto en inglés": alcanza para atrapar
 * los mensajes sin traducir y no se queja de un "WhatsApp" o un "https".
 */
const DELATORAS = [
  'expected',
  'received',
  'invalid',
  'too big',
  'too small',
  'required',
  'must be',
  'string',
  'number',
  'characters',
  'at least',
  'at most',
  'unrecognized',
  'nan',
];

function enIngles(mensaje: string): string[] {
  const m = mensaje.toLowerCase();
  return DELATORAS.filter((d) => m.includes(d));
}

/** Corre un esquema con datos malos y devuelve todos los mensajes que salen. */
function mensajesDe(esquema: { safeParse: (v: unknown) => unknown }, entrada: unknown): string[] {
  const r = esquema.safeParse(entrada) as {
    success: boolean;
    error?: Parameters<typeof erroresPorCampo>[0];
  };
  if (r.success || !r.error) return [];
  return Object.values(erroresPorCampo(r.error));
}

function exigirCastellano(mensajes: string[], contexto: string) {
  for (const m of mensajes) {
    const malas = enIngles(m);
    expect(malas, `${contexto} devolvió un mensaje en inglés: "${m}"`).toEqual([]);
    expect(m.length, `${contexto} devolvió un mensaje vacío`).toBeGreaterThan(3);
  }
}

describe('una propiedad con todo mal', () => {
  const casos: [string, unknown][] = [
    ['vacío', {}],
    ['título corto', { titleEs: 'ab' }],
    ['título larguísimo', { titleEs: 'a'.repeat(400) }],
    ['descripción larguísima', { titleEs: 'Casa', descriptionEs: 'x'.repeat(6000) }],
    ['tipología y zona sin elegir', { titleEs: 'Casa', propertyTypeId: '', zoneId: '' }],
    ['dormitorios imposibles', { titleEs: 'Casa', bedrooms: 99 }],
    ['dormitorios que no son número', { titleEs: 'Casa', bedrooms: 'tres' }],
    ['dormitorios negativos', { titleEs: 'Casa', bedrooms: -1 }],
    ['baños con coma', { titleEs: 'Casa', bathrooms: 2.5 }],
    ['baños negativos', { titleEs: 'Casa', bathrooms: -1 }],
    ['precio que no es número', { titleEs: 'Casa', priceUsd: 'carísimo' }],
    ['precio negativo', { titleEs: 'Casa', priceUsd: -5 }],
    ['año imposible', { titleEs: 'Casa', yearBuilt: 9999 }],
    ['metros imposibles', { titleEs: 'Casa', areaCoveredM2: 99_999_999 }],
    ['metros que no son número', { titleEs: 'Casa', areaTotalM2: 'muchos' }],
    ['amenidades que no son una lista', { titleEs: 'Casa', amenityIds: 'piscina' }],
    ['una amenidad inventada', { titleEs: 'Casa', amenityIds: [-3] }],
    ['operación inventada', { titleEs: 'Casa', operation: 'trueque' }],
    ['obra inventada', { titleEs: 'Casa', constructionStatus: 'soñada' }],
    ['enlace que no es de Drive', { titleEs: 'Casa', driveUrl: 'https://dropbox.com/x' }],
  ];

  it.each(casos)('%s se explica en castellano', (nombre, entrada) => {
    const mensajes = [
      ...mensajesDe(esquemaPropiedad, entrada),
      ...mensajesDe(esquemaPropiedadParcial, entrada),
    ];
    expect(mensajes.length, `"${nombre}" no produjo ningún error, revisá el caso`).toBeGreaterThan(
      0,
    );
    exigirCastellano(mensajes, `propiedad (${nombre})`);
  });
});

describe('una consulta del sitio con todo mal', () => {
  const casos: [string, unknown][] = [
    ['vacía', {}],
    ['nombre de una letra', { name: 'a', email: 'a@b.co' }],
    ['nombre larguísimo', { name: 'a'.repeat(200), email: 'a@b.co' }],
    ['email que no es email', { name: 'Ana', email: 'ana arroba mail' }],
    ['email larguísimo', { name: 'Ana', email: 'a'.repeat(200) + '@b.co' }],
    ['teléfono corto', { name: 'Ana', email: 'a@b.co', phone: '12' }],
    ['teléfono larguísimo', { name: 'Ana', email: 'a@b.co', phone: '1'.repeat(40) }],
    ['mensaje larguísimo', { name: 'Ana', email: 'a@b.co', message: 'x'.repeat(3000) }],
    ['interés inventado', { name: 'Ana', email: 'a@b.co', interest: 'curiosear' }],
  ];

  it.each(casos)('%s se explica en castellano', (nombre, entrada) => {
    const mensajes = mensajesDe(esquemaConsulta, entrada);
    expect(mensajes.length, `"${nombre}" no produjo ningún error`).toBeGreaterThan(0);
    exigirCastellano(mensajes, `consulta (${nombre})`);
  });
});

describe('un artículo con todo mal', () => {
  const casos: [string, unknown][] = [
    ['vacío', {}],
    ['título corto', { type: 'noticia', titleEs: 'ab' }],
    ['título larguísimo', { type: 'noticia', titleEs: 'a'.repeat(400) }],
    ['tipo inventado', { type: 'editorial', titleEs: 'Una nota' }],
    ['copete larguísimo', { type: 'noticia', titleEs: 'Una nota', excerptEs: 'x'.repeat(500) }],
    ['texto larguísimo', { type: 'noticia', titleEs: 'Una nota', bodyEs: 'x'.repeat(60_000) }],
    ['estado inventado', { type: 'noticia', titleEs: 'Una nota', status: 'archivado' }],
  ];

  it.each(casos)('%s se explica en castellano', (nombre, entrada) => {
    const mensajes = mensajesDe(esquemaArticulo, entrada);
    expect(mensajes.length, `"${nombre}" no produjo ningún error`).toBeGreaterThan(0);
    exigirCastellano(mensajes, `artículo (${nombre})`);
  });
});

describe('los catálogos con todo mal', () => {
  it('ninguno de los cinco explica un error en inglés', async () => {
    const { db, cerrar } = await crearBaseEfimera();
    try {
      // Datos malos del mismo tipo para todos: nombre de una letra, números
      // fuera de rango, correo y dirección mal escritos.
      const basura = {
        ciudad: 'a',
        nombre: 'a',
        orden: 99_999,
        codigoPais: 'MEX',
        sitio: 'no-es-una-direccion',
        email: 'arroba',
        telefono: 'llamame',
        notas: 'x'.repeat(2000),
      };

      for (const catalogo of CATALOGOS) {
        const r = await crearItem(db, catalogo, basura);
        expect(r.tipo, `${catalogo} debería rechazar estos datos`).toBe('datos');
        if (r.tipo !== 'datos') continue;
        exigirCastellano(Object.values(r.campos), `catálogo ${catalogo}`);
      }
    } finally {
      await cerrar();
    }
  });
});

describe('la propia red de esta prueba', () => {
  it('reconoce un mensaje de Zod sin traducir', () => {
    // Si esto dejara de detectar, la prueba pasaría sin probar nada.
    expect(enIngles('Too big: expected string to have <=200 characters').length).toBeGreaterThan(0);
    expect(enIngles('Invalid input: expected number, received NaN').length).toBeGreaterThan(0);
  });

  it('no se queja de un mensaje nuestro', () => {
    expect(enIngles('Escribí tu nombre')).toEqual([]);
    expect(enIngles('Tiene que ser un enlace de Google Drive')).toEqual([]);
    expect(enIngles('Escribinos por WhatsApp y te respondemos enseguida.')).toEqual([]);
  });
});
