/**
 * Los textos y datos del sitio.
 *
 * El caso que manda acá es uno: **una dirección que escribe alguien y termina
 * en un `href` es código.** `javascript:alert(1)` en el enlace de Instagram se
 * ejecuta en el navegador de cualquiera que entre al sitio, y escapar no
 * protege de eso. Lo demás —correos, teléfonos, largos— es que la pantalla
 * diga qué arreglar en vez de "inválido".
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import {
  CATALOGO,
  guardarConfiguracion,
  listarConfiguracion,
  urlSegura,
} from '../../backend/lib/configuracion';
import { siteSettings } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;

/**
 * Valor de arranque realista según el tipo.
 *
 * Importa: si un correo arrancara con un texto cualquiera, volver a mandarlo
 * tal cual lo rechazaría su propia validación, y la prueba de "guardar lo
 * mismo no cambia nada" fallaría por la siembra, no por el código.
 */
function inicial(tipo: string): string {
  if (tipo === 'url') return 'https://ejemplo.test/a';
  if (tipo === 'email') return 'alguien@ejemplo.test';
  if (tipo === 'telefono') return '+54 9 351 819 4131';
  return 'valor inicial';
}

const leer = async (key: string) =>
  (await db.select().from(siteSettings).where(eq(siteSettings.key, key)))[0]?.valueEs ?? null;

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;

  // Las claves existen antes: el panel edita, no inventa configuración.
  await db.insert(siteSettings).values(
    CATALOGO.map((c) => ({
      key: c.key,
      valueEs: inicial(c.tipo),
      group: c.grupo,
      inputType: c.tipo,
    })),
  );
});

afterEach(async () => {
  await cerrar();
});

describe('direcciones peligrosas', () => {
  const peligrosas = [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '  javascript:alert(1)  ',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'JAVASCRIPT:alert(1)',
  ];

  it.each(peligrosas)('rechaza %s en el enlace de Instagram', async (mala) => {
    const r = await guardarConfiguracion(db, { 'redes.instagram': mala });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.errores['redes.instagram']).toContain('http');

    // Y no se guardó: el sitio sigue con la dirección buena.
    expect(await leer('redes.instagram')).toBe('https://ejemplo.test/a');
  });

  it('rechaza lo mismo en el video de la portada y en el retrato', async () => {
    for (const clave of ['hero.video_url', 'nosotros.photo']) {
      const r = await guardarConfiguracion(db, { [clave]: 'javascript:alert(1)' });
      expect(r.tipo).toBe('datos');
    }
  });

  it('acepta http y https', async () => {
    const r = await guardarConfiguracion(db, {
      'redes.instagram': 'https://instagram.com/reyna',
      'redes.facebook': 'http://facebook.com/reyna',
    });
    expect(r.tipo).toBe('ok');
    expect(await leer('redes.instagram')).toBe('https://instagram.com/reyna');
  });

  it('una dirección vacía se permite: hay respaldo', async () => {
    const r = await guardarConfiguracion(db, { 'hero.video_url': '' });
    expect(r.tipo).toBe('ok');
    expect(await leer('hero.video_url')).toBe('');
  });

  it('rechaza algo que no es una dirección', async () => {
    const r = await guardarConfiguracion(db, { 'redes.youtube': 'instagram.com/reyna' });
    expect(r.tipo).toBe('datos');
  });

  it('el control se puede usar solo, sin base', () => {
    // Es el mismo que usa el sitio al dibujar, como segunda red.
    expect(urlSegura('https://a.test')).toBe(true);
    expect(urlSegura('')).toBe(true);
    expect(urlSegura('   ')).toBe(true);
    expect(urlSegura('javascript:alert(1)')).toBe(false);
    expect(urlSegura('//a.test/x')).toBe(false);
  });
});

describe('correos y teléfonos', () => {
  it('rechaza un correo que no es un correo, y lo dice en castellano', async () => {
    const r = await guardarConfiguracion(db, { 'contacto.email': 'laura arroba gmail' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.errores['contacto.email']).toBe('No parece un correo electrónico');
  });

  it('acepta un teléfono como lo escribe cualquiera', async () => {
    for (const bueno of ['+52 984 311 5530', '+54 9 351 819-4131', '(0351) 819 4131']) {
      const r = await guardarConfiguracion(db, { 'whatsapp.primary': bueno });
      expect(r.tipo, bueno).toBe('ok');
    }
  });

  it('rechaza un teléfono con letras', async () => {
    const r = await guardarConfiguracion(db, { 'contacto.phone_mx': 'llamame al cel' });
    expect(r.tipo).toBe('datos');
  });
});

describe('textos', () => {
  it('un título con salto de línea se rechaza', async () => {
    const r = await guardarConfiguracion(db, { 'hero.title': 'Tu sueño.\nNuestro propósito.' });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(r.errores['hero.title']).toContain('una sola línea');
  });

  it('un párrafo con saltos de línea se acepta', async () => {
    const r = await guardarConfiguracion(db, { 'nosotros.body': 'Primero.\n\nSegundo.' });
    expect(r.tipo).toBe('ok');
    expect(await leer('nosotros.body')).toBe('Primero.\n\nSegundo.');
  });

  it('frena un pegado enorme', async () => {
    const r = await guardarConfiguracion(db, { 'hero.title': 'a'.repeat(400) });
    expect(r.tipo).toBe('datos');
  });

  it('recorta los espacios de los bordes', async () => {
    await guardarConfiguracion(db, { 'hero.title': '  Tu sueño.  ' });
    expect(await leer('hero.title')).toBe('Tu sueño.');
  });
});

describe('todo o nada', () => {
  it('con un campo mal no se guarda ninguno', async () => {
    const r = await guardarConfiguracion(db, {
      'hero.title': 'Título nuevo',
      'redes.instagram': 'javascript:alert(1)',
    });
    expect(r.tipo).toBe('datos');

    // Guardar la mitad deja la pantalla diciendo una cosa y el sitio otra.
    expect(await leer('hero.title')).toBe('valor inicial');
  });

  it('devuelve todos los errores juntos, no el primero', async () => {
    const r = await guardarConfiguracion(db, {
      'contacto.email': 'no-es-un-mail',
      'redes.instagram': 'javascript:alert(1)',
      'contacto.phone_mx': 'letras',
    });
    expect(r.tipo).toBe('datos');
    if (r.tipo !== 'datos') return;
    expect(Object.keys(r.errores).sort()).toEqual([
      'contacto.email',
      'contacto.phone_mx',
      'redes.instagram',
    ]);
  });
});

describe('qué se puede tocar', () => {
  it('una clave que no está en el catálogo se ignora', async () => {
    await db
      .insert(siteSettings)
      .values({ key: 'secreto.interno', valueEs: 'no tocar', group: 'otros' });

    const r = await guardarConfiguracion(db, { 'secreto.interno': 'cambiado' });
    expect(r).toMatchObject({ tipo: 'ok', cambios: 0 });
    expect(await leer('secreto.interno')).toBe('no tocar');
  });

  it('no crea claves nuevas aunque lleguen con nombre del catálogo', async () => {
    await db.delete(siteSettings).where(eq(siteSettings.key, 'redes.youtube'));
    const r = await guardarConfiguracion(db, { 'redes.youtube': 'https://youtube.com/x' });
    expect(r).toMatchObject({ tipo: 'ok', cambios: 0 });
    expect(await leer('redes.youtube')).toBeNull();
  });

  it('un valor que no es texto se rechaza en vez de guardarse como "[object Object]"', async () => {
    const r = await guardarConfiguracion(db, { 'hero.title': { malicioso: true } });
    expect(r.tipo).toBe('datos');
  });

  it('un cuerpo que no es un objeto no revienta', async () => {
    for (const basura of [null, 'texto', 42, ['a']]) {
      expect((await guardarConfiguracion(db, basura)).tipo).toBe('datos');
    }
  });
});

describe('no tocar lo que no cambió', () => {
  it('guardar los mismos valores no modifica ninguna fila', async () => {
    const antes = (await db.select().from(siteSettings)).map((f) => f.updatedAt.getTime());

    const todos = Object.fromEntries(CATALOGO.map((c) => [c.key, inicial(c.tipo)]));
    const r = await guardarConfiguracion(db, todos);
    expect(r).toMatchObject({ tipo: 'ok', cambios: 0 });

    const despues = (await db.select().from(siteSettings)).map((f) => f.updatedAt.getTime());
    // Si tocara `updated_at`, el panel diría "tenés cambios sin publicar" por
    // haber abierto la pantalla y guardado sin escribir nada.
    expect(despues).toEqual(antes);
  });

  it('cambiar uno cuenta uno', async () => {
    const r = await guardarConfiguracion(db, { 'hero.title': 'Otro título' });
    expect(r).toMatchObject({ tipo: 'ok', cambios: 1 });
  });
});

describe('qué muestra la pantalla', () => {
  it('agrupa los campos y no deja ninguno del catálogo afuera', async () => {
    const grupos = await listarConfiguracion(db);
    const claves = grupos.flatMap((g) => g.campos.map((c) => c.key));
    expect(claves.sort()).toEqual(CATALOGO.map((c) => c.key).sort());
  });

  it('una clave de la base que no está en el catálogo se muestra al final', async () => {
    await db.insert(siteSettings).values({ key: 'clave.vieja', valueEs: 'algo', group: 'raro' });

    const grupos = await listarConfiguracion(db);
    const ultimo = grupos[grupos.length - 1]!;
    // Ocultarla dejaría una clave sin forma de editarse y sin nadie que
    // supiera que existe.
    expect(ultimo.id).toBe('otros');
    expect(ultimo.campos.map((c) => c.key)).toContain('clave.vieja');
  });

  it('cada campo tiene etiqueta en castellano, no la clave cruda', async () => {
    const grupos = await listarConfiguracion(db);
    for (const g of grupos.filter((x) => x.id !== 'otros')) {
      for (const c of g.campos) expect(c.etiqueta).not.toContain('.');
    }
  });
});
