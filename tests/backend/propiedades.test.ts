/**
 * Crear, editar y publicar una propiedad.
 *
 * Lo que se prueba acá no es que el formulario ande: es lo que la clienta va
 * a hacer mal alguna vez. Publicar sin foto. Poner dos propiedades con el
 * mismo nombre. Dejar el precio vacío. Pegar un enlace que no es de Drive.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import {
  crearPropiedad,
  editarPropiedad,
  listarPropiedades,
  obtenerPropiedadDelPanel,
} from '../../backend/lib/propiedades';
import { amenities, properties, propertyTypes, zones } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;
let idZona: number;
let idTipo: number;
let idAmenidades: number[];

const base = () => ({
  titleEs: 'Casa Abatón',
  propertyTypeId: idTipo,
  zoneId: idZona,
  operation: 'venta',
  constructionStatus: 'terminado',
  priceUsd: 1680000,
  bedrooms: 6,
  bathrooms: 5,
});

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;

  const [z] = await db
    .insert(zones)
    .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
    .returning();
  const [t] = await db.insert(propertyTypes).values({ slug: 'casa', nameEs: 'Casa' }).returning();
  const a = await db
    .insert(amenities)
    .values([
      { slug: 'piscina', nameEs: 'Piscina', icon: 'piscina' },
      { slug: 'gimnasio', nameEs: 'Gimnasio', icon: 'gimnasio' },
    ])
    .returning();

  idZona = z!.id;
  idTipo = t!.id;
  idAmenidades = a.map((x) => x.id);
});

afterEach(async () => {
  await cerrar();
});

describe('crear', () => {
  it('guarda la propiedad y nace en borrador', async () => {
    const r = await crearPropiedad(db, base());
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;

    const [p] = await db.select().from(properties).where(eq(properties.id, r.id));
    // Publicar tiene que ser un acto aparte y deliberado.
    expect(p!.status).toBe('borrador');
    expect(p!.slug).toBe('casa-abaton');
    expect(p!.titleEs).toBe('Casa Abatón');
    expect(p!.priceUsd).toBe('1680000.00');
  });

  it('dos propiedades con el mismo título no comparten dirección', async () => {
    const a = await crearPropiedad(db, base());
    const b = await crearPropiedad(db, base());
    expect(a.tipo === 'ok' && a.slug).toBe('casa-abaton');
    expect(b.tipo === 'ok' && b.slug).toBe('casa-abaton-2');
  });

  it('guarda las amenidades elegidas', async () => {
    const r = await crearPropiedad(db, { ...base(), amenityIds: idAmenidades });
    if (r.tipo !== 'ok') throw new Error('no se creó');

    const p = await obtenerPropiedadDelPanel(db, r.id);
    expect(p!.amenityIds.sort()).toEqual([...idAmenidades].sort());
  });
});

describe('lo que la clienta va a equivocar', () => {
  it('sin precio y sin "a consultar", no deja guardar', async () => {
    const r = await crearPropiedad(db, { ...base(), priceUsd: '' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    // El mensaje tiene que decir qué hacer, no qué regla se rompió.
    expect(r.campos.priceUsd).toContain('a consultar');
  });

  it('marcando "a consultar" el precio puede ir vacío', async () => {
    const r = await crearPropiedad(db, { ...base(), priceUsd: '', priceOnRequest: true });
    expect(r.tipo).toBe('ok');
  });

  it('dejar desarrollista y propietario sin elegir NO impide guardar', async () => {
    // Los dos son opcionales, y "— Sin elegir —" manda ''. Sin cuidado,
    // `Number('')` es 0 y la propiedad entera no se podía guardar.
    const r = await crearPropiedad(db, { ...base(), developerId: '', ownerId: '' });
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;

    const [p] = await db.select().from(properties).where(eq(properties.id, r.id));
    expect(p!.developerId).toBeNull();
    expect(p!.ownerId).toBeNull();
  });

  it('los mensajes están en castellano, no en inglés de la librería', async () => {
    const r = await crearPropiedad(db, { ...base(), zoneId: '' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    // Un "Too small: expected number to be >0" en pantalla es una fuga de
    // las tripas de la validación al usuario.
    expect(r.campos.zoneId).toBe('Elegí una zona');
  });

  it('metros y año vacíos quedan en nulo, no en cero', async () => {
    // `Number('')` es 0: sin cuidado, una propiedad sin metros cargados
    // mostraría "0 m²" en el sitio, que se lee como un error.
    const r = await crearPropiedad(db, {
      ...base(),
      areaCoveredM2: '',
      areaTotalM2: '',
      yearBuilt: '',
    });
    if (r.tipo !== 'ok') throw new Error('debería crearse');

    const [p] = await db.select().from(properties).where(eq(properties.id, r.id));
    expect(p!.areaCoveredM2).toBeNull();
    expect(p!.areaTotalM2).toBeNull();
    expect(p!.yearBuilt).toBeNull();
  });

  it('un título de dos letras se rechaza', async () => {
    const r = await crearPropiedad(db, { ...base(), titleEs: 'Ca' });
    expect(r.tipo).toBe('datos');
  });

  it('sin zona o sin tipología, se rechaza', async () => {
    expect((await crearPropiedad(db, { ...base(), zoneId: 0 })).tipo).toBe('datos');
    expect((await crearPropiedad(db, { ...base(), propertyTypeId: 0 })).tipo).toBe('datos');
  });
});

describe('el enlace de Drive se valida', () => {
  it('acepta un enlace de Drive', async () => {
    const r = await crearPropiedad(db, {
      ...base(),
      driveUrl: 'https://drive.google.com/drive/folders/abc123',
    });
    expect(r.tipo).toBe('ok');
  });

  it('rechaza un enlace que no es de Drive', async () => {
    const r = await crearPropiedad(db, { ...base(), driveUrl: 'https://dropbox.com/x' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.driveUrl).toContain('Drive');
  });

  it('rechaza algo que ni siquiera es una dirección', async () => {
    expect((await crearPropiedad(db, { ...base(), driveUrl: 'pegué cualquier cosa' })).tipo).toBe(
      'datos',
    );
  });

  it('vacío es válido: el enlace es opcional', async () => {
    expect((await crearPropiedad(db, { ...base(), driveUrl: '' })).tipo).toBe('ok');
  });
});

describe('publicar', () => {
  async function crearBorrador() {
    const r = await crearPropiedad(db, base());
    if (r.tipo !== 'ok') throw new Error('no se creó');
    return r.id;
  }

  it('sin imagen principal, publicar se rechaza con un mensaje claro', async () => {
    const id = await crearBorrador();
    const r = await editarPropiedad(db, id, { status: 'publicado' });

    expect(r.tipo).toBe('falta-portada');
    if (r.tipo !== 'falta-portada') return;
    expect(r.mensaje).toBe('Cargá la imagen principal antes de publicar');

    // Y no quedó publicada a medias.
    const [p] = await db.select().from(properties).where(eq(properties.id, id));
    expect(p!.status).toBe('borrador');
  });

  it('con imagen principal, publica y sella la fecha', async () => {
    const id = await crearBorrador();
    await db
      .update(properties)
      .set({ coverPath: 'propiedades/casa/portada-abc', coverWidth: 1600, coverHeight: 1200 })
      .where(eq(properties.id, id));

    const r = await editarPropiedad(db, id, { status: 'publicado' });
    expect(r.tipo).toBe('ok');

    const [p] = await db.select().from(properties).where(eq(properties.id, id));
    expect(p!.status).toBe('publicado');
    expect(p!.publishedAt).not.toBeNull();
  });

  it('cambiar el título NO cambia la dirección', async () => {
    const id = await crearBorrador();
    await editarPropiedad(db, id, { titleEs: 'Casa Abatón Renovada' });

    const [p] = await db.select().from(properties).where(eq(properties.id, id));
    // La dirección es pública: cambiarla rompe los enlaces compartidos.
    expect(p!.slug).toBe('casa-abaton');
    expect(p!.titleEs).toBe('Casa Abatón Renovada');
  });

  it('editar una propiedad que no existe se avisa, no revienta', async () => {
    const r = await editarPropiedad(db, '00000000-0000-0000-0000-000000000000', { bedrooms: 3 });
    expect(r.tipo).toBe('no-existe');
  });
});

describe('el listado del panel', () => {
  beforeEach(async () => {
    await crearPropiedad(db, base());
    await crearPropiedad(db, { ...base(), titleEs: 'Villa Sián' });
    const r = await crearPropiedad(db, { ...base(), titleEs: 'Torre Mirador' });
    if (r.tipo === 'ok') {
      await db
        .update(properties)
        .set({ coverPath: 'x', status: 'publicado' })
        .where(eq(properties.id, r.id));
    }
  });

  it('trae todas y cuenta el total', async () => {
    const l = await listarPropiedades(db);
    expect(l.total).toBe(3);
    expect(l.items).toHaveLength(3);
  });

  it('filtra por estado', async () => {
    expect((await listarPropiedades(db, { estado: 'publicado' })).total).toBe(1);
    expect((await listarPropiedades(db, { estado: 'borrador' })).total).toBe(2);
  });

  it('busca por texto sin importar mayúsculas ni acentos del patrón', async () => {
    const l = await listarPropiedades(db, { texto: 'villa' });
    expect(l.total).toBe(1);
    expect(l.items[0]!.titulo).toBe('Villa Sián');
  });

  it('un estado inventado no filtra nada en vez de romper', async () => {
    expect((await listarPropiedades(db, { estado: 'inventado' })).total).toBe(3);
  });

  it('el tope por página se respeta', async () => {
    const l = await listarPropiedades(db, { porPagina: 2 });
    expect(l.items).toHaveLength(2);
    expect(l.total).toBe(3);
  });

  it('NUNCA devuelve datos de propietarios (RNF-10)', async () => {
    const l = await listarPropiedades(db);
    for (const item of l.items) {
      expect(Object.keys(item)).not.toContain('ownerId');
      expect(Object.keys(item)).not.toContain('owner');
    }
  });
});
