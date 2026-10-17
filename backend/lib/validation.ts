/**
 * Validación de la consulta del visitante.
 *
 * El esquema es uno solo y lo usan los dos lados. El navegador lo usa para
 * avisar antes de enviar; **el servidor siempre vuelve a validar**, porque
 * cualquiera puede llamar al endpoint sin pasar por el formulario.
 *
 * Los mensajes están escritos para que se lean debajo del campo: dicen qué
 * hacer, no qué regla se rompió. "Escribí tu nombre" y no "name is required".
 */
import { z } from 'zod';

export const INTERESES = ['invertir', 'rentar', 'consulta'] as const;
export type Interes = (typeof INTERESES)[number];

export const esquemaConsulta = z.object({
  name: z
    .string({ error: 'Escribí tu nombre' })
    .trim()
    .min(2, 'Escribí tu nombre')
    .max(100, 'El nombre es demasiado largo'),
  email: z.email('Revisá el email: parece que falta algo').max(200, 'El email es demasiado largo'),
  phone: z
    .string({ error: 'Revisá el teléfono' })
    .trim()
    .min(6, 'El teléfono es muy corto')
    .max(25, 'El teléfono es demasiado largo')
    .optional()
    .or(z.literal('')),
  interest: z.enum(INTERESES, { error: 'Elegí una de las opciones' }).default('consulta'),
  message: z
    .string({ error: 'No pudimos leer el mensaje' })
    .trim()
    .max(2000, 'El mensaje no puede pasar de 2000 caracteres')
    .optional(),
  /** La propiedad desde la que consultó. El servidor la resuelve a un id. */
  propertySlug: z.string().trim().max(200, 'Dirección demasiado larga').optional(),
  sourcePath: z.string().trim().max(300, 'Dirección demasiado larga').optional(),
  /**
   * Trampa para robots. Está oculta por CSS: una persona no la ve y la deja
   * vacía; los programas que completan todo lo que encuentran la llenan.
   * Si viene con algo, la consulta se descarta **sin avisar** — decirle al
   * robot que lo detectamos solo le enseña a evitarlo la próxima.
   */
  website: z.string().max(200, 'Valor demasiado largo').optional(),
});

export type Consulta = z.infer<typeof esquemaConsulta>;

/** Aplana los errores de Zod a `{ campo: mensaje }`, para pintarlos al lado del campo. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const problema of error.issues) {
    const campo = problema.path[0];
    if (typeof campo === 'string' && !salida[campo]) salida[campo] = problema.message;
  }
  return salida;
}

// --- Propiedades del panel ---------------------------------------------------

export const OPERACIONES = ['venta', 'renta'] as const;
export const ESTADOS_OBRA = ['pozo', 'construccion', 'terminado'] as const;
export const ESTADOS_PUBLICACION = ['borrador', 'publicado', 'archivado'] as const;
export const CARTERAS = ['propia', 'compartida'] as const;

/**
 * Un campo de formulario vacío es **ausencia de dato**, no un cero.
 *
 * `z.coerce.number()` convierte `''` en `0` —porque `Number('') === 0`—, así
 * que un precio en blanco se guardaba como USD 0 y la propiedad salía
 * publicada con ese precio. Lo mismo con los metros y el año. Por eso el vacío
 * se descarta **antes** de coercionar, y no después.
 */
const vacioEsNulo = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : v);

/** Un entero opcional que puede llegar vacío desde un formulario. */
const enteroOpcional = (max: number, mensaje: string) =>
  z.preprocess(
    vacioEsNulo,
    z.coerce
      .number({ error: mensaje })
      .int(mensaje)
      .min(0, mensaje)
      .max(max, mensaje)
      .optional()
      .transform((v) => v ?? null),
  );

/**
 * El enlace de Drive.
 *
 * Se valida que sea **de Drive** y no cualquier dirección: el campo existe
 * para el material pesado que la clienta comparte desde ahí, y un enlace a
 * otro lado en ese lugar es casi siempre un error de pegado.
 */
export const esquemaDrive = z
  .union([
    z
      .url('El enlace tiene que empezar con https://')
      .refine(
        (u) => /^https:\/\/(drive|docs)\.google\.com\//.test(u),
        'Tiene que ser un enlace de Google Drive',
      ),
    z.literal(''),
  ])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v));

/** El objeto sin la regla cruzada del precio. La edición parcial parte de acá. */
const objetoPropiedad = z.object({
  titleEs: z
    .string({ error: 'Escribí el título de la propiedad' })
    .trim()
    .min(3, 'El título necesita al menos 3 caracteres')
    .max(200, 'El título no puede pasar de 200 caracteres'),
  descriptionEs: z
    .string({ error: 'No pudimos leer la descripción' })
    .trim()
    .max(5000, 'La descripción no puede pasar de 5000 caracteres')
    .optional(),

  propertyTypeId: z.coerce
    .number({ error: 'Elegí una tipología' })
    .int('Elegí una tipología')
    .positive('Elegí una tipología'),
  zoneId: z.coerce
    .number({ error: 'Elegí una zona' })
    .int('Elegí una zona')
    .positive('Elegí una zona'),
  // Opcionales de verdad: "— Sin elegir —" manda '', y `Number('')` es 0, que
  // no pasa `.positive()`. Sin descartar el vacío antes, dejar cualquiera de
  // los dos sin elegir impedía guardar la propiedad entera.
  developerId: z.preprocess(
    vacioEsNulo,
    z.coerce
      .number()
      .int('Elegí un desarrollista de la lista')
      .positive('Elegí un desarrollista de la lista')
      .optional()
      .transform((v) => v ?? null),
  ),
  ownerId: z.preprocess(
    vacioEsNulo,
    z.coerce
      .number()
      .int('Elegí un propietario de la lista')
      .positive('Elegí un propietario de la lista')
      .optional()
      .transform((v) => v ?? null),
  ),

  operation: z.enum(OPERACIONES, { error: 'Elegí si es venta o renta' }),
  constructionStatus: z.enum(ESTADOS_OBRA, { error: 'Elegí el estado de la obra' }),
  ownership: z
    .enum(CARTERAS, { error: 'Elegí si es cartera propia o compartida' })
    .default('propia'),

  yearBuilt: enteroOpcional(2200, 'Revisá el año'),
  priceUsd: z.preprocess(
    vacioEsNulo,
    z.coerce
      .number({ error: 'El precio tiene que ser un número' })
      .min(0, 'El precio no puede ser negativo')
      .optional()
      .transform((v) => v ?? null),
  ),
  priceOnRequest: z.coerce.boolean().default(false),

  areaCoveredM2: enteroOpcional(1_000_000, 'Revisá los metros'),
  areaTotalM2: enteroOpcional(1_000_000, 'Revisá los metros'),
  bedrooms: z.coerce
    .number({ error: 'Los dormitorios tienen que ser un número' })
    .int('Los dormitorios tienen que ser un número entero')
    .min(0, 'Los dormitorios no pueden ser un número negativo')
    .max(50, 'Revisá los dormitorios: no pueden pasar de 50')
    .default(0),
  bathrooms: z.coerce
    .number({ error: 'Los baños tienen que ser un número' })
    .int('Los baños tienen que ser un número entero')
    .min(0, 'Los baños no pueden ser un número negativo')
    .max(50, 'Revisá los baños: no pueden pasar de 50')
    .default(0),

  amenityIds: z
    .array(z.coerce.number().int().positive('Hay una amenidad que no reconocemos'), {
      error: 'No pudimos leer las amenidades',
    })
    .default([]),
  driveUrl: esquemaDrive,
});

export const esquemaPropiedad = objetoPropiedad.refine(
  (d) => d.priceOnRequest || d.priceUsd !== null,
  {
    // Sin esto una propiedad puede quedar sin precio y sin decir que es a
    // consultar: en el sitio se vería un hueco donde va la cifra.
    message: 'Poné un precio, o marcá "a consultar"',
    path: ['priceUsd'],
  },
);

export type DatosPropiedad = z.infer<typeof esquemaPropiedad>;

/** En la edición todo es opcional: se manda solo lo que cambió. */
export const esquemaPropiedadParcial = objetoPropiedad.partial().extend({
  status: z.enum(ESTADOS_PUBLICACION).optional(),
  isFeatured: z.coerce.boolean().optional(),
});

// --- Artículos del panel -----------------------------------------------------

export const TIPOS_ARTICULO = ['noticia', 'informe'] as const;
export const ESTADOS_ARTICULO = ['borrador', 'publicado'] as const;

/**
 * Los topes son generosos a propósito: no están para disciplinar a nadie, sino
 * para frenar el pegado accidental de un documento entero en un campo de una
 * línea.
 */
const objetoArticulo = z.object({
  type: z.enum(TIPOS_ARTICULO, { error: 'Elegí si es una noticia o un informe' }),
  titleEs: z
    .string({ error: 'Escribí el título' })
    .trim()
    .min(3, 'El título necesita al menos 3 caracteres')
    .max(200, 'El título no puede pasar de 200 caracteres'),
  excerptEs: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .max(400, 'El copete no puede pasar de 400 caracteres')
      .optional()
      .transform((v) => v ?? null),
  ),
  bodyEs: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .max(50_000, 'El texto no puede pasar de 50.000 caracteres')
      .optional()
      .transform((v) => v ?? null),
  ),
  coverAltEs: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .max(200, 'La descripción de la imagen no puede pasar de 200 caracteres')
      .optional()
      .transform((v) => v ?? null),
  ),
  status: z.enum(ESTADOS_ARTICULO, { error: 'Estado inválido' }).optional(),
  isPinned: z.coerce.boolean().optional(),
});

export const esquemaArticulo = objetoArticulo;
export const esquemaArticuloParcial = objetoArticulo.partial();
export type DatosArticulo = z.infer<typeof esquemaArticulo>;
