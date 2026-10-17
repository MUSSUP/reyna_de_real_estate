/**
 * Que los datos de los propietarios no lleguen nunca al sitio público.
 *
 * `owners` guarda nombre, teléfono, correo y notas de **terceros** que le
 * confiaron una propiedad a Laura. No es información de la marca: es
 * información de otras personas. Que se filtre no es un defecto estético, es
 * un problema con la gente que confió.
 *
 * Es RNF-10 y la decisión D-09, y hasta ahora no tenía ninguna prueba: la
 * revisión del Hito 1 lo marcó (I-7) y la del Hito 2 lo volvió a marcar.
 *
 * Se prueba por dos caminos distintos a propósito.
 *
 * 1. **Sobre el código fuente**: ningún archivo que se dibuje en el sitio
 *    público puede ni mencionar la tabla. Esto atrapa el caso que importa —
 *    alguien agrega un `join` "para mostrar el contacto" sin pensarlo.
 * 2. **Sobre la base**: se carga una propiedad con propietario y se mira la
 *    forma de lo que devuelve la consulta pública.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import { owners, properties, propertyTypes, zones } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

// `fileURLToPath` y no `.pathname`: la ruta del proyecto tiene espacios.
const RAIZ = fileURLToPath(new URL('../../frontend/src/', import.meta.url));

/** Todos los archivos de una carpeta, hacia abajo. */
function archivosDe(carpeta: string, extensiones = ['.astro', '.ts', '.tsx']): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(carpeta)) {
    const ruta = carpeta + entrada;
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivosDe(ruta + '/', extensiones));
    } else if (extensiones.some((e) => entrada.endsWith(e))) {
      salida.push(ruta);
    }
  }
  return salida;
}

/**
 * Lo que se dibuja en el sitio público: las páginas que no son del panel, sus
 * componentes y la capa de datos que usan.
 */
function archivosDelSitioPublico(): string[] {
  const paginas = archivosDe(RAIZ + 'pages/').filter(
    (r) => !r.includes('/pages/admin/') && !r.includes('/pages/api/admin/'),
  );
  return [
    ...paginas,
    ...archivosDe(RAIZ + 'components/public/'),
    ...archivosDe(RAIZ + 'layouts/'),
    RAIZ + 'lib/datos.ts',
    RAIZ + 'lib/articulos.ts',
    RAIZ + 'lib/whatsapp.ts',
  ];
}

/** Lo que nombra la tabla de propietarios, de una forma u otra. */
const DELATORES = ['owners', 'ownerId', 'owner_id', 'propietario'];

/**
 * Saca los comentarios antes de buscar.
 *
 * Hace falta porque `lib/datos.ts` **advierte en prosa** sobre esto —"nada de
 * acá puede devolver datos de `owners`"— y sin quitar los comentarios la
 * prueba acusaba justamente al archivo que hace lo correcto. Lo que se vigila
 * es el código, no lo que se escribe sobre él.
 *
 * El `//` se corta solo cuando no viene de un `:`, para no comerse la mitad
 * de una línea por un `https://`.
 */
function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('los propietarios y el sitio público', () => {
  it('ningún archivo del sitio público nombra la tabla', () => {
    const culpables: string[] = [];

    for (const ruta of archivosDelSitioPublico()) {
      const contenido = sinComentarios(readFileSync(ruta, 'utf8'));
      for (const d of DELATORES) {
        // Se busca la palabra entera: `propiedad` no es `propietario`, y
        // `ownership` —que sí es pública— no es `owners`.
        if (new RegExp(`\\b${d}\\b`).test(contenido)) {
          culpables.push(`${ruta.replace(RAIZ, '')} nombra "${d}"`);
        }
      }
    }

    // Si esto falla, alguien agregó un join "para mostrar el contacto".
    expect(culpables).toEqual([]);
  });

  it('la lista de archivos revisados no quedó vacía por un error de ruta', () => {
    // Sin esto, equivocarse en la ruta haría que la prueba pase sin revisar
    // nada, que es lo peor que le puede pasar a una prueba de seguridad.
    const archivos = archivosDelSitioPublico();
    expect(archivos.length).toBeGreaterThan(15);
    expect(archivos.some((r) => r.endsWith('pages/index.astro'))).toBe(true);
    expect(archivos.some((r) => r.endsWith('lib/datos.ts'))).toBe(true);
  });

  it('la red sigue viendo una referencia de verdad', () => {
    // Si `sinComentarios` se pasara de celosa, la prueba pasaría siempre y no
    // estaría vigilando nada. Acá se le da código real y se exige que lo vea.
    const codigo = [
      "import { owners } from '../db/schema';",
      'const url = "https://ejemplo.test/x"; // owners va en el comentario',
      '.leftJoin(owners, eq(properties.ownerId, owners.id))',
    ].join('\n');

    const limpio = sinComentarios(codigo);
    expect(/\bowners\b/.test(limpio)).toBe(true);
    expect(/\bownerId\b/.test(limpio)).toBe(true);
    // Y la advertencia en prosa no cuenta como uso.
    expect(/\bowners\b/.test(sinComentarios('// nada de owners acá'))).toBe(false);
    expect(/\bowners\b/.test(sinComentarios('/* ojo con owners */'))).toBe(false);
  });

  it('el panel sí los usa, y es el único que puede', () => {
    // La contracara: si nadie los usara, la columna del formulario estaría
    // rota y esta prueba pasaría por el motivo equivocado.
    const panel = readFileSync(RAIZ + 'lib/panel.ts', 'utf8');
    expect(panel).toContain('owners');
  });
});

describe('la propiedad publicada no arrastra al propietario', () => {
  let db: Db;
  let cerrar: () => Promise<void>;

  beforeEach(async () => {
    const e = await crearBaseEfimera();
    db = e.db;
    cerrar = e.cerrar;
  });

  afterEach(async () => {
    await cerrar();
  });

  it('los campos públicos de una propiedad no incluyen nada del propietario', async () => {
    const [z] = await db
      .insert(zones)
      .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
      .returning();
    const [t] = await db.insert(propertyTypes).values({ slug: 'casa', nameEs: 'Casa' }).returning();
    const [o] = await db
      .insert(owners)
      .values({
        name: 'Propietario Confidencial',
        phone: '+52 984 000 9999',
        email: 'confidencial@ejemplo.test',
        notes: 'Acepta ofertas por debajo del precio',
      })
      .returning();

    await db.insert(properties).values({
      slug: 'casa-con-dueno',
      titleEs: 'Casa con dueño',
      propertyTypeId: t!.id,
      zoneId: z!.id,
      ownerId: o!.id,
      operation: 'venta',
      constructionStatus: 'terminado',
      status: 'publicado',
      coverPath: 'propiedades/casa-con-dueno',
    });

    // La misma selección de campos que usa el sitio: sin join a `owners` y
    // **sin la columna `ownerId`**, que por sí sola ya sería una pista.
    const filas = await db
      .select({
        slug: properties.slug,
        titulo: properties.titleEs,
        precioUsd: properties.priceUsd,
        ciudad: zones.city,
        tipologia: propertyTypes.nameEs,
      })
      .from(properties)
      .innerJoin(zones, eq(properties.zoneId, zones.id))
      .innerJoin(propertyTypes, eq(properties.propertyTypeId, propertyTypes.id))
      .where(eq(properties.status, 'publicado'));

    const serializado = JSON.stringify(filas);
    for (const secreto of [
      'Propietario Confidencial',
      '+52 984 000 9999',
      'confidencial@ejemplo.test',
      'Acepta ofertas',
    ]) {
      expect(serializado).not.toContain(secreto);
    }
    expect(Object.keys(filas[0]!)).not.toContain('ownerId');
  });
});

/**
 * D-19: lo que necesita el navegador no comparte archivo con lo que solo
 * corre en el servidor.
 *
 * Nació de un despliegue roto. `lib/datos.ts` importaba dos funciones de
 * aritmética desde el módulo de imágenes, y eso arrastraba `sharp` —una
 * librería nativa— a todas las páginas, donde en el servidor de Netlify no
 * podía ni cargarse. La revisión del Hito 2 encontró la misma forma otra vez,
 * en `articulosPanel`.
 *
 * Esta prueba sigue la cadena de importaciones de cada página y falla si
 * alguna llega a `sharp`.
 */
describe('sharp no llega a ninguna página', () => {
  /** Las importaciones relativas de un archivo, ya resueltas a una ruta. */
  function importaciones(ruta: string): string[] {
    const fuente = sinComentarios(readFileSync(ruta, 'utf8'));
    const carpeta = ruta.slice(0, ruta.lastIndexOf('/') + 1);
    const salida: string[] = [];

    for (const m of fuente.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const pedido = m[1]!;
      // Se normaliza a mano: no hay resolución de módulos acá, y alcanza.
      const partes = (carpeta + pedido).split('/');
      const pila: string[] = [];
      for (const parte of partes) {
        if (parte === '.' || parte === '') continue;
        if (parte === '..') pila.pop();
        else pila.push(parte);
      }
      const base = '/' + pila.join('/');

      for (const candidato of [base, base + '.ts', base + '.astro', base + '/index.ts']) {
        try {
          if (statSync(candidato).isFile()) {
            salida.push(candidato);
            break;
          }
        } catch {
          // No existe con esa extensión; se prueba la siguiente.
        }
      }
    }
    return salida;
  }

  /** Recorre la cadena completa y devuelve el camino hasta `sharp`, si llega. */
  function caminoHastaSharp(ruta: string, visto = new Set<string>()): string[] | null {
    if (visto.has(ruta)) return null;
    visto.add(ruta);

    const fuente = sinComentarios(readFileSync(ruta, 'utf8'));
    if (/from\s+['"]sharp['"]/.test(fuente)) return [ruta];

    for (const siguiente of importaciones(ruta)) {
      const camino = caminoHastaSharp(siguiente, visto);
      if (camino) return [ruta, ...camino];
    }
    return null;
  }

  it('ninguna página del sitio ni del panel lo arrastra', () => {
    // Los endpoints sí pueden: ahí es donde se procesan las imágenes.
    const paginas = archivosDe(RAIZ + 'pages/').filter((r) => !r.includes('/pages/api/'));
    expect(paginas.length).toBeGreaterThan(10);

    const culpables = paginas
      .map((r) => caminoHastaSharp(r))
      .filter((c): c is string[] => c !== null)
      .map((c) => c.map((r) => r.replace(RAIZ, '')).join(' → '));

    expect(culpables).toEqual([]);
  });

  it('la red funciona: sí lo ve donde está de verdad', () => {
    // Si no detectara nada, la prueba pasaría sin vigilar nada. Un endpoint de
    // portada tiene que dar positivo.
    const camino = caminoHastaSharp(
      fileURLToPath(
        new URL('../../frontend/src/pages/api/admin/articles/[id]/cover.ts', import.meta.url),
      ),
    );
    expect(camino).not.toBeNull();
  });
});
