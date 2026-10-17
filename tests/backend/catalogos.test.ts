/**
 * Las listas que alimentan el formulario de una propiedad.
 *
 * Lo que importa acá es el borrado. La base impide borrar una zona en uso,
 * pero con un error de restricción que nadie entiende. Y para desarrollistas,
 * propietarios y amenidades **no lo impide**: los dejaría en nulo, o las
 * sacaría de todas las propiedades, en silencio. Eso es un dato perdido sin
 * aviso, que es la peor clase de pérdida.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import {
  borrarItem,
  CAMPOS,
  CATALOGOS,
  crearItem,
  editarItem,
  esCatalogo,
  listarCatalogo,
  META,
} from '../../backend/lib/catalogos';
import { amenities, properties, propertyAmenities, zones } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;

const idDe = (r: Awaited<ReturnType<typeof crearItem>>) => {
  if (r.tipo !== 'ok') throw new Error(`no se creó: ${JSON.stringify(r)}`);
  return r.id;
};

/** Una propiedad mínima que usa la zona y la tipología que se le pasan. */
async function propiedadQueUsa(
  zonaId: number,
  tipoId: number,
  extra: Record<string, unknown> = {},
) {
  const [p] = await db
    .insert(properties)
    .values({
      slug: `prop-${Math.random().toString(36).slice(2, 8)}`,
      titleEs: 'Propiedad de prueba',
      propertyTypeId: tipoId,
      zoneId: zonaId,
      operation: 'venta',
      constructionStatus: 'terminado',
      ...extra,
    })
    .returning({ id: properties.id });
  return p!.id;
}

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;
});

afterEach(async () => {
  await cerrar();
});

describe('crear', () => {
  it('una zona con ciudad y zona se muestra con las dos', async () => {
    await crearItem(db, 'zonas', { ciudad: 'Tulum', zona: 'Aldea Zamá' });
    const l = await listarCatalogo(db, 'zonas');
    expect(l[0]!.nombre).toBe('Tulum · Aldea Zamá');
  });

  it('una zona sin barrio se muestra con la ciudad sola', async () => {
    await crearItem(db, 'zonas', { ciudad: 'Playa del Carmen' });
    expect((await listarCatalogo(db, 'zonas'))[0]!.nombre).toBe('Playa del Carmen');
  });

  it('la dirección de la zona sale del nombre y es única', async () => {
    await crearItem(db, 'zonas', { ciudad: 'Tulum' });
    await crearItem(db, 'zonas', { ciudad: 'Tulum' });
    const slugs = (await db.select({ slug: zones.slug }).from(zones)).map((z) => z.slug);
    expect(new Set(slugs).size).toBe(2);
  });

  it('el país y el código tienen valor por defecto', async () => {
    const id = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const z = (await listarCatalogo(db, 'zonas')).find((x) => x.id === id)!;
    expect(z.campos).toMatchObject({ pais: 'México', codigoPais: 'MX' });
  });

  it('el código de país se pasa a mayúsculas', async () => {
    const id = idDe(await crearItem(db, 'zonas', { ciudad: 'Córdoba', codigoPais: 'ar' }));
    expect((await listarCatalogo(db, 'zonas')).find((x) => x.id === id)!.campos.codigoPais).toBe(
      'AR',
    );
  });

  it('rechaza un código de país que no son dos letras', async () => {
    const r = await crearItem(db, 'zonas', { ciudad: 'Tulum', codigoPais: 'MEX' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.codigoPais).toContain('dos letras');
  });

  it('rechaza un nombre de un solo carácter, en castellano', async () => {
    const r = await crearItem(db, 'tipologias', { nombre: 'a' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.nombre).toContain('2 caracteres');
  });

  it('un desarrollista repetido se avisa en vez de reventar', async () => {
    await crearItem(db, 'desarrollistas', { nombre: 'Grupo Sukha' });
    const r = await crearItem(db, 'desarrollistas', { nombre: 'Grupo Sukha' });
    expect(r.tipo).toBe('repetido');
    if (r.tipo !== 'repetido') return;
    expect(r.mensaje).toContain('Grupo Sukha');
  });

  it('un sitio web que no es una dirección se rechaza', async () => {
    const r = await crearItem(db, 'desarrollistas', { nombre: 'Grupo X', sitio: 'grupox.com' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.sitio).toContain('http');
  });

  it('un sitio vacío se guarda nulo, no como cadena vacía', async () => {
    const id = idDe(await crearItem(db, 'desarrollistas', { nombre: 'Grupo Y', sitio: '' }));
    expect(
      (await listarCatalogo(db, 'desarrollistas')).find((x) => x.id === id)!.campos.sitio,
    ).toBeNull();
  });

  it('un correo de propietario mal escrito se rechaza', async () => {
    const r = await crearItem(db, 'propietarios', { nombre: 'Juan', email: 'juan arroba mail' });
    expect(r.tipo).toBe('datos');
  });

  it('una amenidad se crea con su slug y no hay que inventar un ícono', async () => {
    const id = idDe(await crearItem(db, 'amenidades', { nombre: 'Piscina climatizada' }));
    const [a] = await db.select().from(amenities).where(eq(amenities.id, id));
    // El sitio pinta un rombo genérico: el ícono no se usa, pero la columna
    // es obligatoria. Se deriva del slug.
    expect(a!.slug).toBe('piscina-climatizada');
    expect(a!.icon).toBe('piscina-climatizada');
  });
});

describe('editar', () => {
  it('cambia los datos y deja la dirección como estaba', async () => {
    const id = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const antes = (await db.select().from(zones).where(eq(zones.id, id)))[0]!.slug;

    expect((await editarItem(db, 'zonas', id, { ciudad: 'Tulum Centro' })).tipo).toBe('ok');

    const z = (await db.select().from(zones).where(eq(zones.id, id)))[0]!;
    expect(z.city).toBe('Tulum Centro');
    // Forma parte de las direcciones del sitio: cambiarla rompe enlaces.
    expect(z.slug).toBe(antes);
  });

  it('avisa si no existe en vez de crearlo', async () => {
    expect((await editarItem(db, 'tipologias', 9999, { nombre: 'Loft' })).tipo).toBe('no-existe');
  });

  it('un desarrollista no puede tomar el nombre de otro', async () => {
    await crearItem(db, 'desarrollistas', { nombre: 'Grupo A' });
    const b = idDe(await crearItem(db, 'desarrollistas', { nombre: 'Grupo B' }));

    expect((await editarItem(db, 'desarrollistas', b, { nombre: 'Grupo A' })).tipo).toBe(
      'repetido',
    );
  });

  it('pero sí puede guardarse con su propio nombre sin cambios', async () => {
    const a = idDe(await crearItem(db, 'desarrollistas', { nombre: 'Grupo A' }));
    const r = await editarItem(db, 'desarrollistas', a, {
      nombre: 'Grupo A',
      sitio: 'https://grupoa.test',
    });
    expect(r.tipo).toBe('ok');
  });
});

describe('borrar lo que está en uso', () => {
  it('una zona en uso no se borra, y dice cuántas propiedades la usan', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    await propiedadQueUsa(zona, tipo);
    await propiedadQueUsa(zona, tipo);

    const r = await borrarItem(db, 'zonas', zona);
    expect(r.tipo).toBe('en-uso');
    if (r.tipo !== 'en-uso') return;
    expect(r.mensaje).toContain('2 propiedades');
    expect(r.mensaje).toContain('Tulum');

    // Y sigue ahí: la base lo habría rechazado con un error indescifrable.
    expect(await listarCatalogo(db, 'zonas')).toHaveLength(1);
  });

  it('con una sola propiedad lo dice en singular', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    await propiedadQueUsa(zona, tipo);

    const r = await borrarItem(db, 'tipologias', tipo);
    if (r.tipo !== 'en-uso') throw new Error('debería estar en uso');
    expect(r.mensaje).toContain('hay una propiedad');
  });

  it('un desarrollista en uso tampoco: la base lo dejaría en nulo en silencio', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    const dev = idDe(await crearItem(db, 'desarrollistas', { nombre: 'Grupo Sukha' }));
    await propiedadQueUsa(zona, tipo, { developerId: dev });

    expect((await borrarItem(db, 'desarrollistas', dev)).tipo).toBe('en-uso');
  });

  it('un propietario en uso tampoco', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    const dueno = idDe(await crearItem(db, 'propietarios', { nombre: 'Juan Pérez' }));
    await propiedadQueUsa(zona, tipo, { ownerId: dueno });

    expect((await borrarItem(db, 'propietarios', dueno)).tipo).toBe('en-uso');
  });

  it('una amenidad en uso tampoco: la sacaría de todas las propiedades', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    const prop = await propiedadQueUsa(zona, tipo);
    const am = idDe(await crearItem(db, 'amenidades', { nombre: 'Piscina' }));
    await db.insert(propertyAmenities).values({ propertyId: prop, amenityId: am });

    expect((await borrarItem(db, 'amenidades', am)).tipo).toBe('en-uso');
  });
});

describe('borrar lo que no está en uso', () => {
  it('se borra', async () => {
    const id = idDe(await crearItem(db, 'zonas', { ciudad: 'Holbox' }));
    expect((await borrarItem(db, 'zonas', id)).tipo).toBe('ok');
    expect(await listarCatalogo(db, 'zonas')).toHaveLength(0);
  });

  it('borrar algo que no existe avisa en vez de explotar', async () => {
    expect((await borrarItem(db, 'amenidades', 9999)).tipo).toBe('no-existe');
  });

  it('una zona que quedó libre al borrarse la propiedad ya se puede borrar', async () => {
    const zona = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    const prop = await propiedadQueUsa(zona, tipo);

    expect((await borrarItem(db, 'zonas', zona)).tipo).toBe('en-uso');
    await db.delete(properties).where(eq(properties.id, prop));
    expect((await borrarItem(db, 'zonas', zona)).tipo).toBe('ok');
  });
});

describe('el conteo de uso', () => {
  it('cuenta las propiedades de cada uno, sin mezclar', async () => {
    const a = idDe(await crearItem(db, 'zonas', { ciudad: 'Tulum' }));
    const b = idDe(await crearItem(db, 'zonas', { ciudad: 'Playa del Carmen' }));
    const tipo = idDe(await crearItem(db, 'tipologias', { nombre: 'Casa' }));
    await propiedadQueUsa(a, tipo);
    await propiedadQueUsa(a, tipo);
    await propiedadQueUsa(b, tipo);

    const l = await listarCatalogo(db, 'zonas');
    expect(l.find((x) => x.id === a)!.enUso).toBe(2);
    expect(l.find((x) => x.id === b)!.enUso).toBe(1);
  });

  it('lo que nadie usa cuenta cero', async () => {
    const id = idDe(await crearItem(db, 'amenidades', { nombre: 'Gimnasio' }));
    expect((await listarCatalogo(db, 'amenidades')).find((x) => x.id === id)!.enUso).toBe(0);
  });
});

describe('la forma del catálogo', () => {
  it('los cinco catálogos se listan vacíos sin romperse', async () => {
    for (const nombre of CATALOGOS) {
      expect(await listarCatalogo(db, nombre)).toEqual([]);
    }
  });

  it('cada catálogo declara sus campos, y todos tienen etiqueta en castellano', () => {
    for (const nombre of CATALOGOS) {
      expect(CAMPOS[nombre].length).toBeGreaterThan(0);
      for (const c of CAMPOS[nombre]) expect(c.etiqueta.length).toBeGreaterThan(2);
    }
  });

  it('los títulos concuerdan en género, que es lo que rompe una concatenación', () => {
    // "Nueva " + singular daba "Nueva desarrollista" y "Nueva propietario".
    expect(META.desarrollistas.nuevo).toBe('Nuevo desarrollista');
    expect(META.propietarios.nuevo).toBe('Nuevo propietario');
    expect(META.zonas.nuevo).toBe('Nueva zona');
    expect(META.amenidades.nuevo).toBe('Nueva amenidad');
    expect(META.tipologias.nuevo).toBe('Nueva tipología');
  });

  it('un nombre de catálogo inventado no pasa el control', () => {
    expect(esCatalogo('zonas')).toBe(true);
    expect(esCatalogo('propiedades')).toBe(false);
    expect(esCatalogo('')).toBe(false);
  });
});
