/**
 * Las listas que alimentan el formulario de una propiedad: zonas, tipologías,
 * desarrollistas, propietarios y amenidades.
 *
 * Hasta ahora había que entrar a la base para sumar una zona. Esto es lo que
 * saca a Musapp del camino.
 *
 * Cuatro reglas gobiernan este archivo.
 *
 * 1. **Nada se borra si está en uso.** La base ya lo impide para zonas y
 *    tipologías, pero con un error de restricción que nadie entiende. Para
 *    desarrollistas y propietarios *no* lo impide: los dejaría en nulo en
 *    todas las propiedades, y para amenidades las sacaría de todas, en
 *    silencio. Se decide acá, igual para los cinco, diciendo cuántas
 *    propiedades la usan.
 * 2. **La dirección pública no se recalcula.** El slug de una zona sale del
 *    nombre la primera vez y se queda: forma parte de las direcciones del
 *    sitio.
 * 3. **Un nombre repetido se avisa, no se revienta.** Los desarrollistas
 *    tienen nombre único en la base; sin este control, cargar uno repetido
 *    devolvía un error de restricción.
 * 4. **Los propietarios no salen nunca al sitio** (D-09, RNF-10). Viven acá
 *    porque el formulario de la propiedad los necesita, y en ningún otro lado.
 *
 * Recibe la base por parámetro (D-17).
 */
import { count, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../db/client';
import {
  amenities,
  developers,
  owners,
  properties,
  propertyAmenities,
  propertyTypes,
  zones,
} from '../db/schema';
import { generarSlug, slugUnico } from './slug';
import { erroresPorCampo } from './validation';

export const CATALOGOS = [
  'zonas',
  'tipologias',
  'desarrollistas',
  'propietarios',
  'amenidades',
] as const;
export type NombreCatalogo = (typeof CATALOGOS)[number];

export function esCatalogo(v: string): v is NombreCatalogo {
  return (CATALOGOS as readonly string[]).includes(v);
}

/**
 * Los títulos van escritos, no armados con una concatenación.
 *
 * "Nueva " + singular daba "Nueva desarrollista" y "Nueva propietario". El
 * género es del sustantivo, así que vive con el sustantivo.
 */
export const META: Record<
  NombreCatalogo,
  {
    titulo: string;
    singular: string;
    /** Título del formulario cuando es un alta. */
    nuevo: string;
    /** Y cuando es una edición. */
    editar: string;
    vacio: string;
    descripcion: string;
    interno?: boolean;
  }
> = {
  zonas: {
    titulo: 'Zonas',
    singular: 'zona',
    nuevo: 'Nueva zona',
    editar: 'Editar la zona',
    vacio: 'Todavía no hay ninguna zona.',
    descripcion: 'Dónde está cada propiedad. Alimentan el buscador y el badge de país.',
  },
  tipologias: {
    titulo: 'Tipologías',
    singular: 'tipología',
    nuevo: 'Nueva tipología',
    editar: 'Editar la tipología',
    vacio: 'Todavía no hay ninguna tipología.',
    descripcion: 'Casa, departamento, terreno. Alimentan el filtro del catálogo.',
  },
  desarrollistas: {
    titulo: 'Desarrollistas',
    singular: 'desarrollista',
    nuevo: 'Nuevo desarrollista',
    editar: 'Editar el desarrollista',
    vacio: 'Todavía no hay ningún desarrollista.',
    descripcion: 'Quién construye. Es opcional en una propiedad.',
  },
  propietarios: {
    titulo: 'Propietarios',
    singular: 'propietario',
    nuevo: 'Nuevo propietario',
    editar: 'Editar el propietario',
    vacio: 'Todavía no hay ningún propietario.',
    descripcion: 'Datos de contacto de terceros. Nunca salen al sitio público.',
    interno: true,
  },
  amenidades: {
    titulo: 'Amenidades',
    singular: 'amenidad',
    nuevo: 'Nueva amenidad',
    editar: 'Editar la amenidad',
    vacio: 'Todavía no hay ninguna amenidad.',
    descripcion: 'Piscina, gimnasio, seguridad. Se marcan en cada propiedad.',
  },
};

/**
 * Qué campos tiene cada catálogo, para que la pantalla los dibuje.
 *
 * Vive acá, al lado de la validación, y no en la página: si se separaran, un
 * campo nuevo aparecería en el formulario sin validarse, o se validaría sin
 * aparecer.
 */
export interface CampoCatalogo {
  nombre: string;
  etiqueta: string;
  tipo?: 'text' | 'number' | 'url' | 'email' | 'tel';
  ayuda?: string;
  obligatorio?: boolean;
  multilinea?: boolean;
}

export const CAMPOS: Record<NombreCatalogo, CampoCatalogo[]> = {
  zonas: [
    { nombre: 'ciudad', etiqueta: 'Ciudad', obligatorio: true },
    { nombre: 'zona', etiqueta: 'Zona o barrio', ayuda: 'Opcional. Por ejemplo, Aldea Zamá.' },
    { nombre: 'pais', etiqueta: 'País' },
    { nombre: 'codigoPais', etiqueta: 'Código de país', ayuda: 'Dos letras: MX, AR.' },
    { nombre: 'orden', etiqueta: 'Orden', tipo: 'number', ayuda: 'Más chico aparece antes.' },
  ],
  tipologias: [
    { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
    { nombre: 'orden', etiqueta: 'Orden', tipo: 'number', ayuda: 'Más chico aparece antes.' },
  ],
  desarrollistas: [
    { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
    {
      nombre: 'sitio',
      etiqueta: 'Sitio web',
      tipo: 'url',
      ayuda: 'Opcional, con http:// o https://',
    },
    { nombre: 'notas', etiqueta: 'Notas', multilinea: true, ayuda: 'Internas. No salen al sitio.' },
  ],
  propietarios: [
    { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
    { nombre: 'email', etiqueta: 'Correo', tipo: 'email' },
    { nombre: 'notas', etiqueta: 'Notas', multilinea: true },
  ],
  amenidades: [{ nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true }],
};

// --- Validación --------------------------------------------------------------

const textoObligatorio = (etiqueta: string, max = 120) =>
  z
    .string()
    .trim()
    .min(2, `${etiqueta} necesita al menos 2 caracteres`)
    .max(max, `${etiqueta} no puede pasar de ${max} caracteres`);

const vacioEsNulo = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : v);

const textoOpcional = (etiqueta: string, max = 500) =>
  z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .max(max, `${etiqueta} no puede pasar de ${max} caracteres`)
      .optional()
      .transform((v) => v ?? null),
  );

const ordenOpcional = z.preprocess(
  vacioEsNulo,
  z.coerce
    .number()
    .int('El orden tiene que ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .max(9999, 'El orden no puede pasar de 9999')
    .optional()
    .transform((v) => v ?? 0),
);

const esquemaZona = z.object({
  ciudad: textoObligatorio('La ciudad'),
  zona: textoOpcional('La zona', 120),
  pais: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .max(60, 'El país no puede pasar de 60 caracteres')
      .optional()
      .transform((v) => v ?? 'México'),
  ),
  codigoPais: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'El código de país son dos letras, como MX o AR')
      .optional()
      .transform((v) => v ?? 'MX'),
  ),
  orden: ordenOpcional,
});

const esquemaTipologia = z.object({
  nombre: textoObligatorio('El nombre'),
  orden: ordenOpcional,
});

const esquemaDesarrollista = z.object({
  nombre: textoObligatorio('El nombre'),
  sitio: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .max(500, 'La dirección es demasiado larga')
      .refine((v) => /^https?:\/\//i.test(v), 'Tiene que empezar con http:// o https://')
      .optional()
      .transform((v) => v ?? null),
  ),
  notas: textoOpcional('Las notas', 1000),
});

const esquemaPropietario = z.object({
  nombre: textoObligatorio('El nombre'),
  telefono: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .regex(/^\+?[\d\s()./-]{6,25}$/, 'Dejá solo números, espacios, + y guiones')
      .optional()
      .transform((v) => v ?? null),
  ),
  email: z.preprocess(
    vacioEsNulo,
    z
      .string()
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'No parece un correo electrónico')
      .optional()
      .transform((v) => v ?? null),
  ),
  notas: textoOpcional('Las notas', 1000),
});

const esquemaAmenidad = z.object({
  nombre: textoObligatorio('El nombre', 60),
});

const ESQUEMAS = {
  zonas: esquemaZona,
  tipologias: esquemaTipologia,
  desarrollistas: esquemaDesarrollista,
  propietarios: esquemaPropietario,
  amenidades: esquemaAmenidad,
} as const;

// --- Leer --------------------------------------------------------------------

export interface ItemCatalogo {
  id: number;
  /** Lo que se ve en la lista. */
  nombre: string;
  /** Lo de más, para el formulario de edición. */
  campos: Record<string, string | number | null>;
  /** Cuántas propiedades la usan. De esto depende si se puede borrar. */
  enUso: number;
}

/** Cuántas propiedades usan cada elemento, en una sola consulta por catálogo. */
async function usos(db: Db, nombre: NombreCatalogo): Promise<Map<number, number>> {
  const filas = await (async () => {
    switch (nombre) {
      case 'zonas':
        return db
          .select({ id: properties.zoneId, n: count() })
          .from(properties)
          .groupBy(properties.zoneId);
      case 'tipologias':
        return db
          .select({ id: properties.propertyTypeId, n: count() })
          .from(properties)
          .groupBy(properties.propertyTypeId);
      case 'desarrollistas':
        return db
          .select({ id: properties.developerId, n: count() })
          .from(properties)
          .groupBy(properties.developerId);
      case 'propietarios':
        return db
          .select({ id: properties.ownerId, n: count() })
          .from(properties)
          .groupBy(properties.ownerId);
      case 'amenidades':
        return db
          .select({ id: propertyAmenities.amenityId, n: count() })
          .from(propertyAmenities)
          .groupBy(propertyAmenities.amenityId);
    }
  })();

  const mapa = new Map<number, number>();
  for (const f of filas) if (f.id !== null) mapa.set(f.id, f.n);
  return mapa;
}

export async function listarCatalogo(db: Db, nombre: NombreCatalogo): Promise<ItemCatalogo[]> {
  const enUso = await usos(db, nombre);
  const uso = (id: number) => enUso.get(id) ?? 0;

  switch (nombre) {
    case 'zonas': {
      const filas = await db.select().from(zones).orderBy(zones.sortOrder, zones.city);
      return filas.map((z) => ({
        id: z.id,
        nombre: z.zone ? `${z.city} · ${z.zone}` : z.city,
        campos: {
          ciudad: z.city,
          zona: z.zone,
          pais: z.country,
          codigoPais: z.countryCode,
          orden: z.sortOrder,
        },
        enUso: uso(z.id),
      }));
    }
    case 'tipologias': {
      const filas = await db
        .select()
        .from(propertyTypes)
        .orderBy(propertyTypes.sortOrder, propertyTypes.nameEs);
      return filas.map((t) => ({
        id: t.id,
        nombre: t.nameEs,
        campos: { nombre: t.nameEs, orden: t.sortOrder },
        enUso: uso(t.id),
      }));
    }
    case 'desarrollistas': {
      const filas = await db.select().from(developers).orderBy(developers.name);
      return filas.map((d) => ({
        id: d.id,
        nombre: d.name,
        campos: { nombre: d.name, sitio: d.website, notas: d.notes },
        enUso: uso(d.id),
      }));
    }
    case 'propietarios': {
      const filas = await db.select().from(owners).orderBy(owners.name);
      return filas.map((o) => ({
        id: o.id,
        nombre: o.name,
        campos: { nombre: o.name, telefono: o.phone, email: o.email, notas: o.notes },
        enUso: uso(o.id),
      }));
    }
    case 'amenidades': {
      const filas = await db.select().from(amenities).orderBy(amenities.nameEs);
      return filas.map((a) => ({
        id: a.id,
        nombre: a.nameEs,
        campos: { nombre: a.nameEs },
        enUso: uso(a.id),
      }));
    }
  }
}

// --- Escribir ----------------------------------------------------------------

export type ResultadoCatalogo =
  | { tipo: 'ok'; id: number }
  | { tipo: 'datos'; campos: Record<string, string> }
  | { tipo: 'no-existe' }
  | { tipo: 'repetido'; mensaje: string }
  /** No se borra porque hay propiedades que la usan. Dice cuántas. */
  | { tipo: 'en-uso'; mensaje: string };

/** Un slug libre para las tablas que lo tienen único. */
async function slugLibre(db: Db, nombre: NombreCatalogo, base: string): Promise<string> {
  const tomados =
    nombre === 'zonas'
      ? (await db.select({ slug: zones.slug }).from(zones)).map((x) => x.slug)
      : nombre === 'tipologias'
        ? (await db.select({ slug: propertyTypes.slug }).from(propertyTypes)).map((x) => x.slug)
        : (await db.select({ slug: amenities.slug }).from(amenities)).map((x) => x.slug);
  return slugUnico(generarSlug(base), tomados);
}

/** Si ya existe otro con ese nombre. Los desarrollistas lo tienen único. */
async function nombreTomado(db: Db, valor: string, salvo?: number): Promise<boolean> {
  const filas = await db
    .select({ id: developers.id })
    .from(developers)
    .where(
      salvo === undefined
        ? eq(developers.name, valor)
        : sql`${developers.name} = ${valor} and ${ne(developers.id, salvo)}`,
    );
  return filas.length > 0;
}

export async function crearItem(
  db: Db,
  nombre: NombreCatalogo,
  crudo: unknown,
): Promise<ResultadoCatalogo> {
  const analizado = ESQUEMAS[nombre].safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  switch (nombre) {
    case 'zonas': {
      const d = analizado.data as z.infer<typeof esquemaZona>;
      const slug = await slugLibre(db, 'zonas', d.zona ? `${d.ciudad} ${d.zona}` : d.ciudad);
      const [f] = await db
        .insert(zones)
        .values({
          slug,
          city: d.ciudad,
          zone: d.zona,
          country: d.pais,
          countryCode: d.codigoPais,
          sortOrder: d.orden,
        })
        .returning({ id: zones.id });
      return { tipo: 'ok', id: f!.id };
    }
    case 'tipologias': {
      const d = analizado.data as z.infer<typeof esquemaTipologia>;
      const slug = await slugLibre(db, 'tipologias', d.nombre);
      const [f] = await db
        .insert(propertyTypes)
        .values({ slug, nameEs: d.nombre, sortOrder: d.orden })
        .returning({ id: propertyTypes.id });
      return { tipo: 'ok', id: f!.id };
    }
    case 'desarrollistas': {
      const d = analizado.data as z.infer<typeof esquemaDesarrollista>;
      if (await nombreTomado(db, d.nombre)) {
        return { tipo: 'repetido', mensaje: `Ya hay un desarrollista llamado "${d.nombre}"` };
      }
      const [f] = await db
        .insert(developers)
        .values({ name: d.nombre, website: d.sitio, notes: d.notas })
        .returning({ id: developers.id });
      return { tipo: 'ok', id: f!.id };
    }
    case 'propietarios': {
      const d = analizado.data as z.infer<typeof esquemaPropietario>;
      const [f] = await db
        .insert(owners)
        .values({ name: d.nombre, phone: d.telefono, email: d.email, notes: d.notas })
        .returning({ id: owners.id });
      return { tipo: 'ok', id: f!.id };
    }
    case 'amenidades': {
      const d = analizado.data as z.infer<typeof esquemaAmenidad>;
      const slug = await slugLibre(db, 'amenidades', d.nombre);
      // `icon` no se usa en ninguna parte del sitio —las amenidades se pintan
      // con un rombo genérico— pero la columna es obligatoria. Se deriva del
      // slug en vez de pedirle a alguien que escriba un nombre de ícono que
      // no hace nada.
      const [f] = await db
        .insert(amenities)
        .values({ slug, nameEs: d.nombre, icon: slug })
        .returning({ id: amenities.id });
      return { tipo: 'ok', id: f!.id };
    }
  }
}

export async function editarItem(
  db: Db,
  nombre: NombreCatalogo,
  id: number,
  crudo: unknown,
): Promise<ResultadoCatalogo> {
  const analizado = ESQUEMAS[nombre].safeParse(crudo);
  if (!analizado.success) return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };

  // El slug **no** se recalcula aunque cambie el nombre: forma parte de las
  // direcciones del sitio.
  switch (nombre) {
    case 'zonas': {
      const d = analizado.data as z.infer<typeof esquemaZona>;
      const r = await db
        .update(zones)
        .set({
          city: d.ciudad,
          zone: d.zona,
          country: d.pais,
          countryCode: d.codigoPais,
          sortOrder: d.orden,
        })
        .where(eq(zones.id, id))
        .returning({ id: zones.id });
      return r.length ? { tipo: 'ok', id } : { tipo: 'no-existe' };
    }
    case 'tipologias': {
      const d = analizado.data as z.infer<typeof esquemaTipologia>;
      const r = await db
        .update(propertyTypes)
        .set({ nameEs: d.nombre, sortOrder: d.orden })
        .where(eq(propertyTypes.id, id))
        .returning({ id: propertyTypes.id });
      return r.length ? { tipo: 'ok', id } : { tipo: 'no-existe' };
    }
    case 'desarrollistas': {
      const d = analizado.data as z.infer<typeof esquemaDesarrollista>;
      if (await nombreTomado(db, d.nombre, id)) {
        return { tipo: 'repetido', mensaje: `Ya hay otro desarrollista llamado "${d.nombre}"` };
      }
      const r = await db
        .update(developers)
        .set({ name: d.nombre, website: d.sitio, notes: d.notas })
        .where(eq(developers.id, id))
        .returning({ id: developers.id });
      return r.length ? { tipo: 'ok', id } : { tipo: 'no-existe' };
    }
    case 'propietarios': {
      const d = analizado.data as z.infer<typeof esquemaPropietario>;
      const r = await db
        .update(owners)
        .set({ name: d.nombre, phone: d.telefono, email: d.email, notes: d.notas })
        .where(eq(owners.id, id))
        .returning({ id: owners.id });
      return r.length ? { tipo: 'ok', id } : { tipo: 'no-existe' };
    }
    case 'amenidades': {
      const d = analizado.data as z.infer<typeof esquemaAmenidad>;
      const r = await db
        .update(amenities)
        .set({ nameEs: d.nombre })
        .where(eq(amenities.id, id))
        .returning({ id: amenities.id });
      return r.length ? { tipo: 'ok', id } : { tipo: 'no-existe' };
    }
  }
}

/**
 * Borra, pero solo si no está en uso.
 *
 * La base impide borrar una zona o una tipología en uso, con un error de
 * restricción que nadie entiende. Para desarrollistas y propietarios **no** lo
 * impide: los dejaría en nulo en todas las propiedades. Para amenidades, las
 * sacaría de todas. En los tres últimos casos el dato se perdería en silencio,
 * así que la decisión se toma acá, igual para los cinco.
 */
export async function borrarItem(
  db: Db,
  nombre: NombreCatalogo,
  id: number,
): Promise<ResultadoCatalogo> {
  const lista = await listarCatalogo(db, nombre);
  const item = lista.find((x) => x.id === id);
  if (!item) return { tipo: 'no-existe' };

  if (item.enUso > 0) {
    const n = item.enUso;
    return {
      tipo: 'en-uso',
      mensaje: `No se puede borrar "${item.nombre}": ${
        n === 1 ? 'hay una propiedad que la usa' : `hay ${n} propiedades que la usan`
      }. Cambialas primero.`,
    };
  }

  switch (nombre) {
    case 'zonas':
      await db.delete(zones).where(eq(zones.id, id));
      break;
    case 'tipologias':
      await db.delete(propertyTypes).where(eq(propertyTypes.id, id));
      break;
    case 'desarrollistas':
      await db.delete(developers).where(eq(developers.id, id));
      break;
    case 'propietarios':
      await db.delete(owners).where(eq(owners.id, id));
      break;
    case 'amenidades':
      await db.delete(amenities).where(eq(amenities.id, id));
      break;
  }

  return { tipo: 'ok', id };
}
