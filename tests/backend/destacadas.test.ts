/**
 * Las destacadas de la portada.
 *
 * Lo que se prueba acá es lo que rompe el carrusel sin que nadie se dé cuenta:
 * una destacada sin foto, un orden que cambia solo entre dos cargas, y el
 * guardado que marca "cambios sin publicar" por haber mirado la pantalla.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import {
  aplicarMovimiento,
  guardarDestacadas,
  listarDestacables,
  proximaPosicion,
} from '../../backend/lib/destacadas';
import { editarPropiedad } from '../../backend/lib/propiedades';
import { properties, propertyTypes, zones } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;
let idZona: number;
let idTipo: number;

/** Una propiedad lista para destacar, salvo lo que se pida distinto. */
async function sembrar(
  titulo: string,
  opciones: { publicada?: boolean; conPortada?: boolean } = {},
): Promise<string> {
  const { publicada = true, conPortada = true } = opciones;
  const [p] = await db
    .insert(properties)
    .values({
      slug: titulo.toLowerCase().replace(/\s+/g, '-'),
      titleEs: titulo,
      propertyTypeId: idTipo,
      zoneId: idZona,
      operation: 'venta',
      constructionStatus: 'terminado',
      status: publicada ? 'publicado' : 'borrador',
      coverPath: conPortada ? `propiedades/${titulo}` : null,
    })
    .returning({ id: properties.id });
  return p!.id;
}

const ordenGuardado = async (ids: string[]) => {
  const filas = await db
    .select({ id: properties.id, orden: properties.featuredOrder, dest: properties.isFeatured })
    .from(properties)
    .where(inArray(properties.id, ids));
  return new Map(filas.map((f) => [f.id, { orden: f.orden, dest: f.dest }]));
};

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;

  const [z] = await db
    .insert(zones)
    .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
    .returning();
  const [t] = await db.insert(propertyTypes).values({ slug: 'casa', nameEs: 'Casa' }).returning();
  idZona = z!.id;
  idTipo = t!.id;
});

afterEach(async () => {
  await cerrar();
});

describe('guardar la lista', () => {
  it('guarda el orden que llega, no el alfabético', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    const c = await sembrar('Loft Bahía');

    const r = await guardarDestacadas(db, [b, c, a]);
    expect(r.tipo).toBe('ok');

    const g = await ordenGuardado([a, b, c]);
    expect(g.get(b)!.orden).toBe(0);
    expect(g.get(c)!.orden).toBe(1);
    expect(g.get(a)!.orden).toBe(2);
  });

  it('las que salen de la lista dejan de estar destacadas y sin posición', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    await guardarDestacadas(db, [a, b]);

    await guardarDestacadas(db, [b]);

    const g = await ordenGuardado([a, b]);
    expect(g.get(a)).toEqual({ orden: null, dest: false });
    expect(g.get(b)).toEqual({ orden: 0, dest: true });
  });

  it('una lista vacía deja la portada sin destacadas', async () => {
    const a = await sembrar('Casa Abatón');
    await guardarDestacadas(db, [a]);

    const r = await guardarDestacadas(db, []);
    expect(r).toMatchObject({ tipo: 'ok', cantidad: 0 });
    expect((await ordenGuardado([a])).get(a)).toEqual({ orden: null, dest: false });
  });

  it('rechaza una propiedad sin imagen principal, y dice cuál', async () => {
    const buena = await sembrar('Casa Abatón');
    const sinFoto = await sembrar('Villa Zafiro', { conPortada: false });

    const r = await guardarDestacadas(db, [buena, sinFoto]);
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.mensaje).toContain('Villa Zafiro');
    expect(r.mensaje).toContain('imagen principal');
  });

  it('rechaza una propiedad sin publicar', async () => {
    const borrador = await sembrar('Villa Zafiro', { publicada: false });
    const r = await guardarDestacadas(db, [borrador]);
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.mensaje).toContain('no está publicada');
  });

  it('si una no sirve, no guarda ninguna', async () => {
    const buena = await sembrar('Casa Abatón');
    const sinFoto = await sembrar('Villa Zafiro', { conPortada: false });

    await guardarDestacadas(db, [buena, sinFoto]);

    // Media portada guardada es peor que un rechazo: se valida todo antes.
    expect((await ordenGuardado([buena])).get(buena)).toEqual({ orden: null, dest: false });
  });

  it('rechaza una repetida en vez de guardarla dos veces', async () => {
    const a = await sembrar('Casa Abatón');
    const r = await guardarDestacadas(db, [a, a]);
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.mensaje).toContain('repetida');
  });

  it('rechaza algo que no es un identificador', async () => {
    expect((await guardarDestacadas(db, ['no-soy-un-uuid'])).tipo).toBe('datos');
    expect((await guardarDestacadas(db, 'una-sola')).tipo).toBe('datos');
  });

  it('una propiedad que se borró de la base no cuelga el guardado', async () => {
    const a = await sembrar('Casa Abatón');
    await db.delete(properties).where(eq(properties.id, a));

    const r = await guardarDestacadas(db, [a]);
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.mensaje).toContain('ya no existe');
  });
});

describe('no tocar lo que no cambió', () => {
  it('guardar el mismo orden no modifica ninguna fila', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    await guardarDestacadas(db, [a, b]);

    const antes = (
      await db
        .select({ id: properties.id, m: properties.updatedAt })
        .from(properties)
        .where(inArray(properties.id, [a, b]))
    ).map((f) => f.m.getTime());

    const r = await guardarDestacadas(db, [a, b]);
    expect(r).toMatchObject({ tipo: 'ok', cambios: 0 });

    const despues = (
      await db
        .select({ id: properties.id, m: properties.updatedAt })
        .from(properties)
        .where(inArray(properties.id, [a, b]))
    ).map((f) => f.m.getTime());

    // Si tocara `updated_at`, el panel diría "tenés cambios sin publicar" por
    // haber abierto la pantalla y guardado sin mover nada.
    expect(despues).toEqual(antes);
  });

  it('mover una sola escribe solo las que se movieron', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    const c = await sembrar('Loft Bahía');
    await guardarDestacadas(db, [a, b, c]);

    // Se intercambian las dos primeras: la tercera se queda en su posición.
    const r = await guardarDestacadas(db, [b, a, c]);
    expect(r).toMatchObject({ tipo: 'ok', cambios: 2 });
  });
});

describe('qué muestra la pantalla', () => {
  it('separa las de la portada, las disponibles y las que no se ven', async () => {
    const enPortada = await sembrar('Casa Abatón');
    const libre = await sembrar('Villa Zafiro');
    await guardarDestacadas(db, [enPortada]);

    // Se despublica después de haber sido elegida: queda marcada y no se ve.
    const caida = await sembrar('Loft Bahía');
    await guardarDestacadas(db, [enPortada, caida]);
    await db.update(properties).set({ status: 'borrador' }).where(eq(properties.id, caida));

    const t = await listarDestacables(db);
    expect(t.destacadas.map((d) => d.id)).toEqual([enPortada]);
    expect(t.disponibles.map((d) => d.id)).toEqual([libre]);
    expect(t.invisibles.map((d) => d.id)).toEqual([caida]);
  });

  it('una publicada sin imagen principal no se ofrece para destacar', async () => {
    await sembrar('Villa Zafiro', { conPortada: false });
    const t = await listarDestacables(db);
    expect(t.disponibles).toHaveLength(0);
    expect(t.destacadas).toHaveLength(0);
    expect(t.invisibles).toHaveLength(0);
  });

  it('dos destacadas sin posición salen siempre en el mismo orden', async () => {
    // Es el estado que dejaban los datos viejos: marcadas a mano, sin orden.
    const b = await sembrar('Villa Zafiro');
    const a = await sembrar('Casa Abatón');
    await db
      .update(properties)
      .set({ isFeatured: true })
      .where(inArray(properties.id, [a, b]));

    const primera = await listarDestacables(db);
    const segunda = await listarDestacables(db);
    expect(primera.invisibles.map((x) => x.titulo)).toEqual(
      segunda.invisibles.map((x) => x.titulo),
    );
  });
});

describe('la casilla del formulario de la propiedad', () => {
  it('al marcar destacada le asigna una posición al final', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    await guardarDestacadas(db, [a]);

    await editarPropiedad(db, b, { isFeatured: true });

    const g = await ordenGuardado([a, b]);
    // Sin esto entraba al carrusel en un lugar indeterminado.
    expect(g.get(b)).toEqual({ orden: 1, dest: true });
  });

  it('al desmarcarla le borra la posición', async () => {
    const a = await sembrar('Casa Abatón');
    await guardarDestacadas(db, [a]);

    await editarPropiedad(db, a, { isFeatured: false });
    expect((await ordenGuardado([a])).get(a)).toEqual({ orden: null, dest: false });
  });

  it('volver a marcar una que ya estaba no le cambia la posición', async () => {
    const a = await sembrar('Casa Abatón');
    const b = await sembrar('Villa Zafiro');
    await guardarDestacadas(db, [a, b]);

    await editarPropiedad(db, a, { isFeatured: true });
    expect((await ordenGuardado([a])).get(a)!.orden).toBe(0);
  });

  it('la próxima posición es cero cuando no hay ninguna destacada', async () => {
    expect(await proximaPosicion(db)).toBe(0);
  });
});

describe('mover sin JavaScript', () => {
  const lista = ['a', 'b', 'c'];

  it('sube y baja', () => {
    expect(aplicarMovimiento(lista, 'subir:b')).toEqual(['b', 'a', 'c']);
    expect(aplicarMovimiento(lista, 'bajar:b')).toEqual(['a', 'c', 'b']);
  });

  it('quita y agrega al final', () => {
    expect(aplicarMovimiento(lista, 'quitar:b')).toEqual(['a', 'c']);
    expect(aplicarMovimiento(lista, 'agregar:d')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('un movimiento sin sentido deja la lista igual, sin error', () => {
    expect(aplicarMovimiento(lista, 'subir:a')).toEqual(lista);
    expect(aplicarMovimiento(lista, 'bajar:c')).toEqual(lista);
    expect(aplicarMovimiento(lista, 'quitar:z')).toEqual(lista);
    expect(aplicarMovimiento(lista, 'agregar:a')).toEqual(lista);
  });

  it('ignora lo que no entiende en vez de devolver una lista rota', () => {
    expect(aplicarMovimiento(lista, 'borrar-todo:a')).toEqual(lista);
    expect(aplicarMovimiento(lista, 'subir')).toEqual(lista);
    expect(aplicarMovimiento(lista, 'subir:')).toEqual(lista);
    expect(aplicarMovimiento(lista, '')).toEqual(lista);
  });

  it('no modifica la lista que recibe', () => {
    const original = ['a', 'b', 'c'];
    aplicarMovimiento(original, 'subir:b');
    expect(original).toEqual(['a', 'b', 'c']);
  });

  it('un identificador con dos puntos adentro sigue funcionando', () => {
    // El corte es en el primer `:`, no en el último: si fuera al revés, un
    // identificador con dos puntos partiría mal y el movimiento se perdería.
    expect(aplicarMovimiento(['x:y'], 'quitar:x:y')).toEqual([]);
  });
});
