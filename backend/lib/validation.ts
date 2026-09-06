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
  name: z.string().trim().min(2, 'Escribí tu nombre').max(100, 'El nombre es demasiado largo'),
  email: z.email('Revisá el email: parece que falta algo').max(200),
  phone: z
    .string()
    .trim()
    .min(6, 'El teléfono es muy corto')
    .max(25, 'El teléfono es demasiado largo')
    .optional()
    .or(z.literal('')),
  interest: z.enum(INTERESES).default('consulta'),
  message: z.string().trim().max(2000, 'El mensaje no puede pasar de 2000 caracteres').optional(),
  /** La propiedad desde la que consultó. El servidor la resuelve a un id. */
  propertySlug: z.string().trim().max(200).optional(),
  sourcePath: z.string().trim().max(300).optional(),
  /**
   * Trampa para robots. Está oculta por CSS: una persona no la ve y la deja
   * vacía; los programas que completan todo lo que encuentran la llenan.
   * Si viene con algo, la consulta se descarta **sin avisar** — decirle al
   * robot que lo detectamos solo le enseña a evitarlo la próxima.
   */
  website: z.string().max(200).optional(),
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
      .number()
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
  titleEs: z.string().trim().min(3, 'El título necesita al menos 3 caracteres').max(200),
  descriptionEs: z.string().trim().max(5000).optional(),

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

  operation: z.enum(OPERACIONES),
  constructionStatus: z.enum(ESTADOS_OBRA),
  ownership: z.enum(CARTERAS).default('propia'),

  yearBuilt: enteroOpcional(2200, 'Revisá el año'),
  priceUsd: z.preprocess(
    vacioEsNulo,
    z.coerce
      .number()
      .min(0, 'El precio no puede ser negativo')
      .optional()
      .transform((v) => v ?? null),
  ),
  priceOnRequest: z.coerce.boolean().default(false),

  areaCoveredM2: enteroOpcional(1_000_000, 'Revisá los metros'),
  areaTotalM2: enteroOpcional(1_000_000, 'Revisá los metros'),
  bedrooms: z.coerce.number().int().min(0).max(50).default(0),
  bathrooms: z.coerce.number().int().min(0).max(50).default(0),

  amenityIds: z.array(z.coerce.number().int().positive()).default([]),
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
