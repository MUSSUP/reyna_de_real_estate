/**
 * Portada y galería.
 *
 * Lo que importa acá no es que una foto suba: es qué pasa con el archivo que
 * no es una foto, con la número dieciséis, y con la portada que se quiere
 * quitar de una propiedad ya publicada.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { crearBaseEfimera } from '../base-efimera';
import {
  actualizarGaleria,
  agregarAGaleria,
  borrarDeGaleria,
  borrarPortada,
  guardarPortada,
} from '../../backend/lib/imagenesPropiedad';
import { crearPropiedad } from '../../backend/lib/propiedades';
import { properties, propertyImages, propertyTypes, zones } from '../../backend/db/schema';
import type { Almacenamiento } from '../../backend/lib/storage';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;
let idPropiedad: string;
let guardados: Map<string, Buffer>;
let almacen: Almacenamiento;

/** Almacenamiento en memoria: guarda lo mismo que el bucket, sin red. */
function almacenFalso(): { almacen: Almacenamiento; guardados: Map<string, Buffer> } {
  const guardados = new Map<string, Buffer>();
  return {
    guardados,
    almacen: {
      async guardar(ruta, contenido) {
        guardados.set(ruta, contenido as Buffer);
      },
      async borrar(ruta) {
        guardados.delete(ruta);
      },
      urlPublica: (ruta: string) => `https://ejemplo.test/${ruta}`,
    } as Almacenamiento,
  };
}

/** Un JPEG de verdad, del tamaño pedido. */
const jpeg = (ancho = 1600, alto = 1200) =>
  sharp({
    create: { width: ancho, height: alto, channels: 3, background: { r: 30, g: 79, b: 76 } },
  })
    .jpeg()
    .toBuffer();

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;

  const [z] = await db
    .insert(zones)
    .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
    .returning();
  const [t] = await db.insert(propertyTypes).values({ slug: 'casa', nameEs: 'Casa' }).returning();

  const r = await crearPropiedad(db, {
    titleEs: 'Casa de prueba',
    propertyTypeId: t!.id,
    zoneId: z!.id,
    operation: 'venta',
    constructionStatus: 'terminado',
    priceUsd: 100000,
  });
  if (r.tipo !== 'ok') throw new Error('no se creó la propiedad');
  idPropiedad = r.id;

  const f = almacenFalso();
  almacen = f.almacen;
  guardados = f.guardados;
});

afterEach(async () => {
  await cerrar();
});

describe('la imagen principal', () => {
  it('se guarda con sus dimensiones y sus variantes', async () => {
    const r = await guardarPortada(db, almacen, idPropiedad, {
      nombre: 'frente.jpg',
      buffer: await jpeg(1600, 1200),
    });
    expect(r.tipo).toBe('ok');

    const [p] = await db.select().from(properties).where(eq(properties.id, idPropiedad));
    expect(p!.coverPath).toBeTruthy();
    // Sin las dimensiones, el HTML pide una variante que puede no existir.
    expect(p!.coverWidth).toBe(1600);
    expect(p!.coverHeight).toBe(1200);

    // Tres variantes: 400, 800 y 1600.
    expect([...guardados.keys()].filter((k) => k.endsWith('.webp'))).toHaveLength(3);
  });

  it('una imagen chica genera solo las variantes que existen', async () => {
    await guardarPortada(db, almacen, idPropiedad, {
      nombre: 'chica.jpg',
      buffer: await jpeg(500, 375),
    });

    const [p] = await db.select().from(properties).where(eq(properties.id, idPropiedad));
    expect(p!.coverWidth).toBe(500);
    // 400 y 500: no se inventa una de 1600 que no se podría generar.
    const anchos = [...guardados.keys()].map((k) => k.match(/-(\d+)\.webp$/)?.[1]).sort();
    expect(anchos).toEqual(['400', '500']);
  });

  it('reemplazarla borra la anterior del almacenamiento', async () => {
    await guardarPortada(db, almacen, idPropiedad, { nombre: 'a.jpg', buffer: await jpeg() });
    const primeras = [...guardados.keys()];

    await guardarPortada(db, almacen, idPropiedad, { nombre: 'b.jpg', buffer: await jpeg() });

    // Ninguna de las viejas sobrevive: si no, el bucket crece para siempre.
    for (const vieja of primeras) expect(guardados.has(vieja)).toBe(false);
    expect([...guardados.keys()]).toHaveLength(3);
  });

  it('un archivo que no es una imagen se rechaza aunque se llame .jpg', async () => {
    const r = await guardarPortada(db, almacen, idPropiedad, {
      nombre: 'virus.jpg',
      buffer: Buffer.from('MZ\x90\x00ejecutable disfrazado'),
    });

    expect(r.tipo).toBe('rechazada');
    // No se guardó nada: la firma binaria manda, no la extensión.
    expect(guardados.size).toBe(0);
    const [p] = await db.select().from(properties).where(eq(properties.id, idPropiedad));
    expect(p!.coverPath).toBeNull();
  });

  it('no se puede quitar la portada de una propiedad publicada', async () => {
    await guardarPortada(db, almacen, idPropiedad, { nombre: 'a.jpg', buffer: await jpeg() });
    await db.update(properties).set({ status: 'publicado' }).where(eq(properties.id, idPropiedad));

    const r = await borrarPortada(db, almacen, idPropiedad);

    expect(r.tipo).toBe('rechazada');
    if (r.tipo !== 'rechazada') return;
    expect(r.motivo).toContain('borrador');

    // Y sigue teniendo portada: no quedó publicada sin foto.
    const [p] = await db.select().from(properties).where(eq(properties.id, idPropiedad));
    expect(p!.coverPath).toBeTruthy();
  });

  it('en borrador sí se puede quitar', async () => {
    await guardarPortada(db, almacen, idPropiedad, { nombre: 'a.jpg', buffer: await jpeg() });
    const r = await borrarPortada(db, almacen, idPropiedad);

    expect(r.tipo).toBe('ok');
    const [p] = await db.select().from(properties).where(eq(properties.id, idPropiedad));
    expect(p!.coverPath).toBeNull();
    expect(p!.coverWidth).toBeNull();
    expect(guardados.size).toBe(0);
  });
});

describe('la galería', () => {
  const foto = async (n: number) => ({ nombre: `foto-${n}.jpg`, buffer: await jpeg(1600, 1200) });

  async function subir(cantidad: number) {
    const archivos = [];
    for (let i = 0; i < cantidad; i++) archivos.push(await foto(i));
    return agregarAGaleria(db, almacen, idPropiedad, archivos);
  }

  it('guarda varias de una vez, en orden', async () => {
    const r = await subir(3);
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.agregadas).toBe(3);

    const imgs = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad))
      .orderBy(propertyImages.sortOrder);

    expect(imgs).toHaveLength(3);
    expect(imgs.map((i) => i.sortOrder)).toEqual([0, 1, 2]);
  });

  it('el tope de 15 se respeta, y el aviso dice cuántas entran', async () => {
    await subir(15);

    const r = await subir(1);
    expect(r.tipo).toBe('rechazada');
    if (r.tipo !== 'rechazada') return;
    expect(r.motivo).toContain('15');

    const imgs = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad));
    expect(imgs).toHaveLength(15);
  });

  it('si se pasan del tope, el mensaje dice cuántas entran todavía', async () => {
    await subir(13);
    const r = await subir(5);

    expect(r.tipo).toBe('rechazada');
    if (r.tipo !== 'rechazada') return;
    // "entran 2 imágenes más" — decirle solo que no se puede no la ayuda.
    expect(r.motivo).toContain('2');
  });

  it('una foto rota no cancela a las buenas', async () => {
    const r = await agregarAGaleria(db, almacen, idPropiedad, [
      await foto(1),
      { nombre: 'rota.jpg', buffer: Buffer.from('no soy una imagen') },
      await foto(2),
    ]);

    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.agregadas).toBe(2);
  });

  it('si ninguna sirve, se avisa qué formatos se aceptan', async () => {
    const r = await agregarAGaleria(db, almacen, idPropiedad, [
      { nombre: 'a.jpg', buffer: Buffer.from('no') },
    ]);
    expect(r.tipo).toBe('rechazada');
    if (r.tipo !== 'rechazada') return;
    expect(r.motivo).toContain('JPG');
  });

  it('borrar una imagen la saca de la base y del almacenamiento', async () => {
    await subir(2);
    const imgs = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad));
    const antes = guardados.size;

    const r = await borrarDeGaleria(db, almacen, idPropiedad, imgs[0]!.id);
    expect(r.tipo).toBe('ok');

    expect(guardados.size).toBeLessThan(antes);
    const quedan = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad));
    expect(quedan).toHaveLength(1);
  });
});

describe('reordenar y describir', () => {
  it('el nuevo orden se guarda, y el texto alternativo también', async () => {
    await agregarAGaleria(db, almacen, idPropiedad, [
      { nombre: 'a.jpg', buffer: await jpeg() },
      { nombre: 'b.jpg', buffer: await jpeg() },
      { nombre: 'c.jpg', buffer: await jpeg() },
    ]);

    const imgs = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad))
      .orderBy(propertyImages.sortOrder);

    // Se manda al revés, con descripciones.
    await actualizarGaleria(db, idPropiedad, [
      { id: imgs[2]!.id, alt: 'La pileta' },
      { id: imgs[0]!.id, alt: 'El frente' },
      { id: imgs[1]!.id, alt: '' },
    ]);

    const despues = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, idPropiedad))
      .orderBy(propertyImages.sortOrder);

    expect(despues.map((i) => i.id)).toEqual([imgs[2]!.id, imgs[0]!.id, imgs[1]!.id]);
    expect(despues[0]!.altEs).toBe('La pileta');
    expect(despues[1]!.altEs).toBe('El frente');
    // Vacío es "sin descripción", no una cadena vacía.
    expect(despues[2]!.altEs).toBeNull();
  });

  it('un id de otra propiedad se ignora, no reordena nada ajeno', async () => {
    await agregarAGaleria(db, almacen, idPropiedad, [{ nombre: 'a.jpg', buffer: await jpeg() }]);

    const otra = await crearPropiedad(db, {
      titleEs: 'Otra casa',
      propertyTypeId: (await db.select().from(propertyTypes))[0]!.id,
      zoneId: (await db.select().from(zones))[0]!.id,
      operation: 'venta',
      constructionStatus: 'terminado',
      priceOnRequest: true,
    });
    if (otra.tipo !== 'ok') throw new Error('no se creó');

    await agregarAGaleria(db, almacen, otra.id, [{ nombre: 'x.jpg', buffer: await jpeg() }]);
    const ajena = (
      await db.select().from(propertyImages).where(eq(propertyImages.propertyId, otra.id))
    )[0]!;

    await actualizarGaleria(db, idPropiedad, [{ id: ajena.id, alt: 'intento de tocar otra' }]);

    const [sigueIgual] = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.id, ajena.id));
    expect(sigueIgual!.altEs).toBeNull();
  });
});
