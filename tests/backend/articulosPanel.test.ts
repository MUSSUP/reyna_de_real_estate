/**
 * Noticias e informes desde el panel.
 *
 * Lo que se prueba acá es lo que deja el sitio raro sin que nadie se dé
 * cuenta: una noticia publicada sin texto, el informe de la portada duplicado,
 * una dirección pública que cambia porque se corrigió una coma del título, y
 * un archivo de imagen que queda ocupando el almacenamiento para siempre.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { crearBaseEfimera } from '../base-efimera';
import {
  borrarArticulo,
  crearArticulo,
  editarArticulo,
  listarArticulos,
  obtenerArticuloDelPanel,
} from '../../backend/lib/articulosPanel';
import { borrarPortadaArticulo, guardarPortadaArticulo } from '../../backend/lib/imagenesArticulo';
import { borrarImagen } from '../../backend/lib/images';
import { articles } from '../../backend/db/schema';
import type { Almacenamiento } from '../../backend/lib/storage';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;
let almacen: Almacenamiento;
let guardados: Map<string, Buffer>;

function almacenFalso() {
  const archivos = new Map<string, Buffer>();
  return {
    archivos,
    almacen: {
      async guardar(ruta: string, contenido: Buffer) {
        archivos.set(ruta, contenido);
      },
      async borrar(ruta: string) {
        archivos.delete(ruta);
      },
      urlPublica: (ruta: string) => `https://ejemplo.test/${ruta}`,
    } as Almacenamiento,
  };
}

const jpeg = (ancho = 1600, alto = 1200) =>
  sharp({
    create: { width: ancho, height: alto, channels: 3, background: { r: 30, g: 79, b: 76 } },
  })
    .jpeg()
    .toBuffer();

const base = () => ({
  type: 'noticia' as const,
  titleEs: 'Tulum cierra el semestre con récord de ventas',
  bodyEs: 'El mercado de Riviera Maya volvió a crecer.',
});

const crear = async (extra: Record<string, unknown> = {}) => {
  const r = await crearArticulo(db, { ...base(), ...extra });
  if (r.tipo !== 'ok') throw new Error(`no se creó: ${JSON.stringify(r)}`);
  return r;
};

/**
 * Un artículo listo para publicar: creado **y con imagen**.
 *
 * Publicar exige imagen, igual que en propiedades, así que las pruebas que
 * publican tienen que pasar por acá. Las que prueban el rechazo usan `crear`.
 */
const crearConImagen = async (extra: Record<string, unknown> = {}) => {
  const r = await crear(extra);
  const g = await guardarPortadaArticulo(db, almacen, r.id, {
    nombre: 'tapa.jpg',
    buffer: await jpeg(800, 600),
  });
  if (g.tipo !== 'ok') throw new Error(`no se guardó la imagen: ${JSON.stringify(g)}`);
  return r;
};

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;
  const f = almacenFalso();
  almacen = f.almacen;
  guardados = f.archivos;
});

afterEach(async () => {
  await cerrar();
});

describe('crear', () => {
  it('nace en borrador y sin destacar', async () => {
    const r = await crear();
    const a = await obtenerArticuloDelPanel(db, r.id);
    expect(a).toMatchObject({ status: 'borrador', isPinned: false, type: 'noticia' });
  });

  it('la dirección se arma del título', async () => {
    const r = await crear();
    expect(r.slug).toBe('tulum-cierra-el-semestre-con-record-de-ventas');
  });

  it('dos títulos iguales no se pisan la dirección', async () => {
    const a = await crear();
    const b = await crear();
    expect(b.slug).not.toBe(a.slug);
  });

  it('rechaza un título demasiado corto, en castellano', async () => {
    const r = await crearArticulo(db, { ...base(), titleEs: 'ok' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.titleEs).toContain('3 caracteres');
  });

  it('rechaza un tipo que no existe', async () => {
    const r = await crearArticulo(db, { ...base(), type: 'editorial' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.campos.type).toContain('noticia');
  });

  it('un copete vacío se guarda como nulo, no como cadena vacía', async () => {
    const r = await crear({ excerptEs: '' });
    expect((await obtenerArticuloDelPanel(db, r.id))!.excerptEs).toBeNull();
  });
});

describe('publicar', () => {
  it('no se puede publicar sin texto', async () => {
    const r = await crear({ bodyEs: '' });
    const e = await editarArticulo(db, r.id, { status: 'publicado' });
    expect(e.tipo).toBe('falta-texto');

    // Y quedó en borrador: una tarjeta en el sitio que lleva a una página en
    // blanco es peor que no tener la noticia.
    expect((await obtenerArticuloDelPanel(db, r.id))!.status).toBe('borrador');
  });

  it('tampoco con un texto de solo espacios', async () => {
    const r = await crear({ bodyEs: '   \n  ' });
    expect((await editarArticulo(db, r.id, { status: 'publicado' })).tipo).toBe('falta-texto');
  });

  it('se puede publicar y escribir el texto en el mismo guardado', async () => {
    const r = await crearConImagen({ bodyEs: '' });
    const e = await editarArticulo(db, r.id, {
      status: 'publicado',
      bodyEs: 'Ahora sí hay texto.',
    });
    expect(e.tipo).toBe('ok');
  });

  it('no se puede publicar sin imagen, y lo dice', async () => {
    const r = await crear();
    const e = await editarArticulo(db, r.id, { status: 'publicado' });
    expect(e.tipo).toBe('falta-imagen');
    if (e.tipo !== 'falta-imagen') return;
    expect(e.mensaje).toContain('imagen');

    // Y quedó en borrador, igual que cuando falta el texto.
    expect((await obtenerArticuloDelPanel(db, r.id))!.status).toBe('borrador');
  });

  it('con imagen y texto, publica', async () => {
    const r = await crearConImagen();
    expect((await editarArticulo(db, r.id, { status: 'publicado' })).tipo).toBe('ok');
    expect((await obtenerArticuloDelPanel(db, r.id))!.status).toBe('publicado');
  });

  it('con los dos faltando, nombra el texto primero', async () => {
    // No es arbitrario: sin texto no hay artículo, y con imagen y sin texto
    // queda una tarjeta linda que lleva a una página en blanco.
    const r = await crear({ bodyEs: '' });
    expect((await editarArticulo(db, r.id, { status: 'publicado' })).tipo).toBe('falta-texto');
  });

  it('quitar la imagen de uno publicado y volver a guardar lo rechaza', async () => {
    const r = await crearConImagen();
    await editarArticulo(db, r.id, { status: 'publicado' });
    await borrarPortadaArticulo(db, almacen, r.id);

    // Queda publicado —no se despublica solo— pero no se puede republicar sin
    // volver a subirla. Es el mismo criterio que en propiedades.
    expect((await editarArticulo(db, r.id, { status: 'publicado' })).tipo).toBe('falta-imagen');
  });

  it('la fecha se sella una vez y no se vuelve a tocar', async () => {
    const r = await crearConImagen();
    await editarArticulo(db, r.id, { status: 'publicado' });
    const primera = (await obtenerArticuloDelPanel(db, r.id))!.publishedAt;

    await editarArticulo(db, r.id, { titleEs: 'Mismo título con una coma, corregida' });
    await editarArticulo(db, r.id, { status: 'borrador' });
    await editarArticulo(db, r.id, { status: 'publicado' });

    // Si cambiara en cada edición, corregir una coma reordenaría el sitio.
    expect((await obtenerArticuloDelPanel(db, r.id))!.publishedAt).toEqual(primera);
  });
});

describe('la dirección pública', () => {
  it('no cambia aunque se reescriba el título entero', async () => {
    const r = await crear();
    await editarArticulo(db, r.id, { titleEs: 'Otro título completamente distinto' });

    // Cambiarla rompe todo enlace que alguien haya compartido.
    expect((await obtenerArticuloDelPanel(db, r.id))!.slug).toBe(r.slug);
  });
});

describe('un solo destacado por tipo', () => {
  it('marcar uno nuevo desmarca el anterior', async () => {
    const a = await crear();
    const b = await crear();

    await editarArticulo(db, a.id, { isPinned: true });
    await editarArticulo(db, b.id, { isPinned: true });

    expect((await obtenerArticuloDelPanel(db, a.id))!.isPinned).toBe(false);
    expect((await obtenerArticuloDelPanel(db, b.id))!.isPinned).toBe(true);
  });

  it('una noticia destacada y un informe destacado conviven', async () => {
    const noticia = await crear();
    const informe = await crear({ type: 'informe', titleEs: 'Reyna Insights, primer semestre' });

    await editarArticulo(db, noticia.id, { isPinned: true });
    await editarArticulo(db, informe.id, { isPinned: true });

    expect((await obtenerArticuloDelPanel(db, noticia.id))!.isPinned).toBe(true);
    expect((await obtenerArticuloDelPanel(db, informe.id))!.isPinned).toBe(true);
  });

  it('volver a marcar el que ya estaba lo deja marcado', async () => {
    const a = await crear();
    await editarArticulo(db, a.id, { isPinned: true });
    await editarArticulo(db, a.id, { isPinned: true });
    expect((await obtenerArticuloDelPanel(db, a.id))!.isPinned).toBe(true);
  });

  it('cambiar de tipo un destacado no choca con el destacado del tipo nuevo', async () => {
    const informe = await crear({ type: 'informe', titleEs: 'Informe que ya estaba' });
    await editarArticulo(db, informe.id, { isPinned: true });

    const noticia = await crear();
    await editarArticulo(db, noticia.id, { isPinned: true });

    // Pasa a informe llevándose su marca: la base no admite dos por tipo.
    const e = await editarArticulo(db, noticia.id, { type: 'informe' });
    expect(e.tipo).toBe('ok');

    const destacados = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.isPinned, true));
    expect(destacados).toHaveLength(1);
  });
});

describe('el listado', () => {
  it('filtra por tipo y por estado', async () => {
    const n = await crearConImagen();
    await crear({ type: 'informe', titleEs: 'Un informe de mercado' });
    await editarArticulo(db, n.id, { status: 'publicado' });

    expect((await listarArticulos(db, { tipo: 'informe' })).total).toBe(1);
    expect((await listarArticulos(db, { estado: 'publicado' })).total).toBe(1);
    expect((await listarArticulos(db, { estado: 'borrador' })).total).toBe(1);
    expect((await listarArticulos(db, {})).total).toBe(2);
  });

  it('un filtro inventado no filtra en vez de reventar', async () => {
    await crear();
    expect((await listarArticulos(db, { tipo: 'editorial', estado: 'vaya' })).total).toBe(1);
  });

  it('muestra primero lo último que se tocó', async () => {
    const viejo = await crear();
    const nuevo = await crear({ titleEs: 'Noticia escrita después' });
    await editarArticulo(db, viejo.id, { excerptEs: 'Retocada ahora' });

    const l = await listarArticulos(db, {});
    expect(l.items[0]!.id).toBe(viejo.id);
    expect(l.items[1]!.id).toBe(nuevo.id);
  });
});

describe('la imagen', () => {
  it('se guarda con las dimensiones, que es de lo que depende qué variante pide el sitio', async () => {
    const r = await crear();
    const g = await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'tapa.jpg',
      buffer: await jpeg(1600, 900),
    });
    expect(g.tipo).toBe('ok');

    const a = await obtenerArticuloDelPanel(db, r.id);
    expect(a!.coverPath).toContain(`articulos/${r.slug}`);
    expect(a!.coverWidth).toBe(1600);
    expect(a!.coverHeight).toBe(900);
  });

  it('rechaza un archivo que no es una imagen', async () => {
    const r = await crear();
    const g = await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'virus.jpg',
      buffer: Buffer.from('MZ\x90\x00 no soy una foto'),
    });
    expect(g.tipo).toBe('rechazada');
    expect((await obtenerArticuloDelPanel(db, r.id))!.coverPath).toBeNull();
  });

  it('reemplazar la imagen borra la anterior del almacenamiento', async () => {
    const r = await crear();
    await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'a.jpg',
      buffer: await jpeg(800, 600),
    });
    const primeras = [...guardados.keys()];

    await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'b.jpg',
      buffer: await jpeg(800, 600),
    });

    for (const vieja of primeras) expect(guardados.has(vieja)).toBe(false);
    expect(guardados.size).toBeGreaterThan(0);
  });

  it('quitarla deja el artículo sin imagen y sin archivos sueltos', async () => {
    const r = await crear();
    await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'a.jpg',
      buffer: await jpeg(800, 600),
    });

    expect((await borrarPortadaArticulo(db, almacen, r.id)).tipo).toBe('ok');
    expect((await obtenerArticuloDelPanel(db, r.id))!.coverPath).toBeNull();
    expect(guardados.size).toBe(0);
  });

  it('quitarla cuando no hay no es un error', async () => {
    const r = await crear();
    expect((await borrarPortadaArticulo(db, almacen, r.id)).tipo).toBe('ok');
  });

  it('sobre un artículo que no existe avisa en vez de crear nada', async () => {
    const inexistente = '11111111-1111-1111-1111-111111111111';
    const g = await guardarPortadaArticulo(db, almacen, inexistente, {
      nombre: 'a.jpg',
      buffer: await jpeg(400, 300),
    });
    expect(g.tipo).toBe('no-existe');
    expect(guardados.size).toBe(0);
  });
});

describe('borrar', () => {
  it('se lleva la imagen: si no, el archivo queda ocupando lugar para siempre', async () => {
    const r = await crear();
    await guardarPortadaArticulo(db, almacen, r.id, {
      nombre: 'a.jpg',
      buffer: await jpeg(800, 600),
    });
    expect(guardados.size).toBeGreaterThan(0);

    expect(
      await borrarArticulo(db, r.id, (ruta, ancho) => borrarImagen(almacen, ruta, ancho)),
    ).toBe(true);
    expect(await obtenerArticuloDelPanel(db, r.id)).toBeNull();
    expect(guardados.size).toBe(0);
  });

  it('un artículo sin imagen se borra igual', async () => {
    const r = await crear();
    expect(
      await borrarArticulo(db, r.id, (ruta, ancho) => borrarImagen(almacen, ruta, ancho)),
    ).toBe(true);
  });

  it('borrar algo que no existe devuelve falso, no explota', async () => {
    expect(await borrarArticulo(db, '11111111-1111-1111-1111-111111111111')).toBe(false);
  });
});

describe('editar algo que no existe', () => {
  it('avisa en vez de crearlo', async () => {
    const e = await editarArticulo(db, '11111111-1111-1111-1111-111111111111', { titleEs: 'Hola' });
    expect(e.tipo).toBe('no-existe');
  });
});
