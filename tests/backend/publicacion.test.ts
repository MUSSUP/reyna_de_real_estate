/**
 * Publicar los cambios.
 *
 * Lo que importa acá no es que el botón dispare: es que **cinco guardados
 * seguidos produzcan un solo build**, que un webhook caído no mienta diciendo
 * que se publicó, y que después de un fallo se pueda reintentar.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { crearBaseEfimera } from '../base-efimera';
import {
  obtenerEstado,
  publicar,
  VENTANA_AGRUPADO_SEGUNDOS,
  type Disparador,
} from '../../backend/lib/publicacion';
import { crearPropiedad } from '../../backend/lib/propiedades';
import { properties, propertyTypes, publicaciones, zones } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;
const HOOK = 'https://api.netlify.com/build_hooks/abc123';

/** Un disparador que anota las llamadas en vez de salir a la red. */
function disparadorQueAnota(ok = true) {
  const llamadas: string[] = [];
  const disparar: Disparador = async (url) => {
    llamadas.push(url);
    return { ok, estado: ok ? 200 : 500 };
  };
  return { disparar, llamadas };
}

async function crearContenido() {
  const [z] = await db
    .insert(zones)
    .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
    .returning();
  const [t] = await db.insert(propertyTypes).values({ slug: 'casa', nameEs: 'Casa' }).returning();
  return crearPropiedad(db, {
    titleEs: 'Casa de prueba',
    propertyTypeId: t!.id,
    zoneId: z!.id,
    operation: 'venta',
    constructionStatus: 'terminado',
    priceOnRequest: true,
  });
}

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;
});

afterEach(async () => {
  await cerrar();
});

describe('disparar la publicación', () => {
  it('llama al webhook y la deja anotada', async () => {
    const { disparar, llamadas } = disparadorQueAnota();
    const r = await publicar({ db, urlDelWebhook: HOOK, disparar, pedidaPor: 'laura@ejemplo.com' });

    expect(r.tipo).toBe('encolada');
    expect(llamadas).toEqual([HOOK]);

    const filas = await db.select().from(publicaciones);
    expect(filas).toHaveLength(1);
    expect(filas[0]!.pedidaPor).toBe('laura@ejemplo.com');
  });

  it('varios guardados seguidos producen UN SOLO build', async () => {
    const { disparar, llamadas } = disparadorQueAnota();

    const resultados = [];
    for (let i = 0; i < 5; i++) {
      resultados.push(await publicar({ db, urlDelWebhook: HOOK, disparar }));
    }

    // Cada regeneración tarda minutos y consume minutos del plan gratuito.
    expect(llamadas).toHaveLength(1);
    expect(resultados[0]!.tipo).toBe('encolada');
    expect(resultados.slice(1).map((r) => r.tipo)).toEqual([
      'ya-encolada',
      'ya-encolada',
      'ya-encolada',
      'ya-encolada',
    ]);

    // Y al panel se le responde bien: la publicación va a ocurrir.
    expect(await db.select().from(publicaciones)).toHaveLength(1);
  });

  it('pasada la ventana, un pedido nuevo vuelve a disparar', async () => {
    const { disparar, llamadas } = disparadorQueAnota();
    await publicar({ db, urlDelWebhook: HOOK, disparar });

    // Se envejece la anotación más allá de la ventana de agrupado.
    const vieja = new Date(Date.now() - (VENTANA_AGRUPADO_SEGUNDOS + 10) * 1000);
    await db.update(publicaciones).set({ createdAt: vieja });

    const r = await publicar({ db, urlDelWebhook: HOOK, disparar });
    expect(r.tipo).toBe('encolada');
    expect(llamadas).toHaveLength(2);
  });
});

describe('cuando algo no está', () => {
  it('sin webhook configurado NO dice que publicó', async () => {
    const { disparar, llamadas } = disparadorQueAnota();
    const r = await publicar({ db, urlDelWebhook: '', disparar });

    expect(r.tipo).toBe('sin-configurar');
    if (r.tipo !== 'sin-configurar') return;
    expect(r.mensaje).toContain('administra');

    // Nada se disparó y nada se anotó: decir que se publicó sería peor que
    // no tener el botón.
    expect(llamadas).toHaveLength(0);
    expect(await db.select().from(publicaciones)).toHaveLength(0);
  });

  it('si el webhook falla, se avisa y NO queda anotada', async () => {
    const { disparar, llamadas } = disparadorQueAnota(false);
    const r = await publicar({ db, urlDelWebhook: HOOK, disparar });

    expect(r.tipo).toBe('fallo');
    expect(llamadas).toHaveLength(1);
    // Clave: si quedara anotada, la ventana de agrupado bloquearía los
    // reintentos durante un minuto justo cuando el build no salió.
    expect(await db.select().from(publicaciones)).toHaveLength(0);
  });

  it('después de un fallo se puede reintentar enseguida', async () => {
    const fallido = disparadorQueAnota(false);
    await publicar({ db, urlDelWebhook: HOOK, disparar: fallido.disparar });

    const bueno = disparadorQueAnota(true);
    const r = await publicar({ db, urlDelWebhook: HOOK, disparar: bueno.disparar });

    expect(r.tipo).toBe('encolada');
    expect(bueno.llamadas).toHaveLength(1);
  });

  it('si el disparador revienta, se avisa en vez de romper', async () => {
    const revienta: Disparador = async () => {
      throw new Error('sin red');
    };
    const r = await publicar({ db, urlDelWebhook: HOOK, disparar: revienta });
    expect(r.tipo).toBe('fallo');
    expect(await db.select().from(publicaciones)).toHaveLength(0);
  });
});

describe('el estado que ve el panel', () => {
  it('sin contenido y sin publicaciones, no hay nada pendiente', async () => {
    const e = await obtenerEstado(db);
    expect(e.hayCambiosSinPublicar).toBe(false);
    expect(e.ultimaPublicacion).toBeNull();
  });

  it('con contenido y sin publicar nunca, hay cambios pendientes', async () => {
    await crearContenido();
    const e = await obtenerEstado(db);
    expect(e.hayCambiosSinPublicar).toBe(true);
  });

  it('después de publicar, no quedan cambios pendientes', async () => {
    await crearContenido();
    const { disparar } = disparadorQueAnota();
    await publicar({ db, urlDelWebhook: HOOK, disparar });

    const e = await obtenerEstado(db);
    expect(e.hayCambiosSinPublicar).toBe(false);
    expect(e.publicando).toBe(true);
  });

  it('un cambio posterior vuelve a marcar pendiente', async () => {
    const creada = await crearContenido();
    const { disparar } = disparadorQueAnota();
    await publicar({ db, urlDelWebhook: HOOK, disparar });
    expect((await obtenerEstado(db)).hayCambiosSinPublicar).toBe(false);

    // Se toca la propiedad después de la publicación.
    if (creada.tipo !== 'ok') throw new Error('no se creó');
    await db.update(properties).set({ updatedAt: new Date(Date.now() + 1000) });

    expect((await obtenerEstado(db)).hayCambiosSinPublicar).toBe(true);
  });

  it('publicar NO se cuenta a sí mismo como un cambio pendiente', async () => {
    await crearContenido();
    const { disparar } = disparadorQueAnota();
    await publicar({ db, urlDelWebhook: HOOK, disparar });

    // El bucle que se quería evitar al no guardar la fecha en site_settings:
    // publicar marcaría un cambio, que marcaría pendiente, para siempre.
    for (let i = 0; i < 3; i++) {
      const e = await obtenerEstado(db);
      expect(e.hayCambiosSinPublicar).toBe(false);
    }
  });
});
