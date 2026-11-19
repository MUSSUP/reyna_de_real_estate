/**
 * Recuperar la contraseña, e invitar a alguien al panel.
 *
 * Es el camino que convierte "perdí la clave" en algo resoluble sin una
 * terminal. Y es, por eso mismo, **una puerta de entrada al panel**: lo que se
 * prueba acá no es que funcione —eso se nota— sino lo que no se nota hasta que
 * ya pasó:
 *
 * - que el token guardado no sirva para entrar si la base se filtra,
 * - que un enlace usado o vencido no valga una segunda vez,
 * - que pedir un enlace nuevo invalide el anterior,
 * - que nadie se quede afuera de su propio panel,
 * - y que invitar no cree jamás una contraseña que alguien conozca.
 */
import { beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import type { Db } from '../../backend/db/client';
import { adminUsers, passwordResets } from '../../backend/db/schema';
import { hashearContrasena, verificarContrasena } from '../../backend/lib/auth';
import {
  LARGO_MINIMO,
  VALIDEZ_MINUTOS,
  cifrarToken,
  emitirToken,
  leerToken,
  pedirReset,
  restablecer,
} from '../../backend/lib/recuperacion';
import {
  cambiarRol,
  invitarUsuario,
  listarUsuarios,
  quitarUsuario,
} from '../../backend/lib/usuarios';

let db: Db;
let cerrar: () => Promise<void>;
let laura: string;

beforeAll(() => {
  process.env.JWT_SECRET = 'secreto-de-prueba-de-32-caracteres-o-mas';
});

beforeEach(async () => {
  ({ db, cerrar } = await crearBaseEfimera());
  const [fila] = await db
    .insert(adminUsers)
    .values({
      email: 'laura@ejemplo.test',
      name: 'Laura',
      role: 'completo',
      passwordHash: await hashearContrasena('contrasena-original-larga'),
    })
    .returning({ id: adminUsers.id });
  laura = fila!.id;
});

afterEach(async () => {
  await cerrar();
});

describe('pedir el enlace', () => {
  it('devuelve un token para un correo que existe', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    expect(pedido?.nombre).toBe('Laura');
    expect(pedido?.token.length).toBeGreaterThan(30);
  });

  it('no distingue mayúsculas ni espacios', async () => {
    expect(await pedirReset(db, '  LAURA@Ejemplo.TEST ')).not.toBeNull();
  });

  it('devuelve null si el correo no existe, sin crear nada', async () => {
    expect(await pedirReset(db, 'nadie@ejemplo.test')).toBeNull();
    expect(await db.select().from(passwordResets)).toHaveLength(0);
  });

  // Si la base se filtra, lo que hay adentro no tiene que servir para entrar.
  it('en la base queda el token cifrado, nunca el original', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    const [fila] = await db.select().from(passwordResets);

    expect(fila!.tokenHash).not.toBe(pedido!.token);
    expect(fila!.tokenHash).toBe(cifrarToken(pedido!.token));
  });

  it('un pedido nuevo invalida el anterior', async () => {
    const primero = await pedirReset(db, 'laura@ejemplo.test');
    const segundo = await pedirReset(db, 'laura@ejemplo.test');

    expect(await leerToken(db, primero!.token)).toBeNull();
    expect(await leerToken(db, segundo!.token)).not.toBeNull();
  });
});

describe('usar el enlace', () => {
  it('cambia la contraseña y la vieja deja de servir', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    const r = await restablecer(db, pedido!.token, 'una-contrasena-nueva');
    expect(r.tipo).toBe('ok');

    const [usuario] = await db.select().from(adminUsers).where(eq(adminUsers.id, laura));
    expect(await verificarContrasena('una-contrasena-nueva', usuario!.passwordHash)).toBe(true);
    expect(await verificarContrasena('contrasena-original-larga', usuario!.passwordHash)).toBe(
      false,
    );
  });

  it('el mismo enlace no sirve dos veces', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    await restablecer(db, pedido!.token, 'una-contrasena-nueva');

    const segunda = await restablecer(db, pedido!.token, 'otra-contrasena-mas');
    expect(segunda.tipo).toBe('enlace');
  });

  it('un enlace vencido no sirve', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    await db
      .update(passwordResets)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(passwordResets.tokenHash, cifrarToken(pedido!.token)));

    expect(await leerToken(db, pedido!.token)).toBeNull();
    expect((await restablecer(db, pedido!.token, 'una-contrasena-nueva')).tipo).toBe('enlace');
  });

  it('vence a los sesenta minutos', async () => {
    await pedirReset(db, 'laura@ejemplo.test');
    const [fila] = await db.select().from(passwordResets);
    const minutos = (fila!.expiresAt.getTime() - fila!.createdAt.getTime()) / 60_000;

    expect(Math.round(minutos)).toBe(VALIDEZ_MINUTOS);
  });

  it('un token inventado no sirve', async () => {
    expect(await leerToken(db, 'esto-no-es-un-token')).toBeNull();
    expect(await leerToken(db, '')).toBeNull();
  });

  it('rechaza una contraseña corta sin quemar el enlace', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    const corta = await restablecer(db, pedido!.token, 'a'.repeat(LARGO_MINIMO - 1));

    expect(corta.tipo).toBe('datos');
    // El enlace sigue vivo: quien se equivocó puede reintentar.
    expect(await leerToken(db, pedido!.token)).not.toBeNull();
  });

  it('rechaza algo que no es texto', async () => {
    const pedido = await pedirReset(db, 'laura@ejemplo.test');
    expect((await restablecer(db, pedido!.token, { malicioso: true })).tipo).toBe('datos');
  });
});

describe('invitar al panel', () => {
  it('crea la persona con el rol pedido y devuelve un enlace que sirve', async () => {
    const r = await invitarUsuario(db, {
      email: 'ayudante@ejemplo.test',
      nombre: 'Ayudante',
      rol: 'contenido',
    });

    expect(r.tipo).toBe('ok-invitado');
    if (r.tipo !== 'ok-invitado') return;

    const destino = await leerToken(db, r.token);
    expect(destino?.email).toBe('ayudante@ejemplo.test');

    const usuarios = await listarUsuarios(db);
    expect(usuarios.find((u) => u.email === 'ayudante@ejemplo.test')?.rol).toBe('contenido');
  });

  // Nadie conoce la clave del invitado, ni siquiera quien lo invitó: entra por
  // el enlace y la pone. Así no hay contraseñas viajando por correo.
  it('la contraseña que queda no sirve para entrar', async () => {
    await invitarUsuario(db, {
      email: 'ayudante@ejemplo.test',
      nombre: 'Ayudante',
      rol: 'contenido',
    });

    const [creado] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, 'ayudante@ejemplo.test'));

    for (const intento of ['', 'password', 'ayudante', 'Ayudante', '123456789012']) {
      expect(await verificarContrasena(intento, creado!.passwordHash)).toBe(false);
    }
  });

  it('rechaza un correo repetido, uno inválido, y un rol que no existe', async () => {
    expect(
      (await invitarUsuario(db, { email: 'laura@ejemplo.test', nombre: 'Otra', rol: 'contenido' }))
        .tipo,
    ).toBe('datos');
    expect(
      (await invitarUsuario(db, { email: 'sin-arroba', nombre: 'Otra', rol: 'contenido' })).tipo,
    ).toBe('datos');
    expect(
      (await invitarUsuario(db, { email: 'ok@ejemplo.test', nombre: 'Otra', rol: 'jefa' })).tipo,
    ).toBe('datos');
    expect(
      (await invitarUsuario(db, { email: 'ok@ejemplo.test', nombre: '  ', rol: 'contenido' })).tipo,
    ).toBe('datos');
  });

  it('listar usuarios nunca devuelve el hash de la contraseña', async () => {
    const usuarios = await listarUsuarios(db);
    expect(JSON.stringify(usuarios)).not.toContain('$2');
    expect(Object.keys(usuarios[0]!)).not.toContain('passwordHash');
  });
});

describe('las barandas de quedarse afuera', () => {
  it('nadie se quita a sí misma ni se cambia el propio permiso', async () => {
    expect((await quitarUsuario(db, laura, laura)).tipo).toBe('datos');
    expect((await cambiarRol(db, laura, laura, 'contenido')).tipo).toBe('datos');
  });

  it('no se puede dejar el panel sin nadie con acceso completo', async () => {
    const invitada = await invitarUsuario(db, {
      email: 'otra@ejemplo.test',
      nombre: 'Otra',
      rol: 'completo',
    });
    expect(invitada.tipo).toBe('ok-invitado');

    const [fila] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, 'otra@ejemplo.test'));

    // Con dos completas, quitar una se puede.
    expect((await quitarUsuario(db, fila!.id, laura)).tipo).toBe('ok');
    // Ahora queda una sola: bajarla de rango o quitarla tiene que fallar.
    expect((await cambiarRol(db, 'otro-id', fila!.id, 'contenido')).tipo).toBe('datos');
    expect((await quitarUsuario(db, 'otro-id', fila!.id)).tipo).toBe('datos');
  });

  it('quitar a alguien se lleva sus enlaces de recuperación', async () => {
    const invitada = await invitarUsuario(db, {
      email: 'otra@ejemplo.test',
      nombre: 'Otra',
      rol: 'contenido',
    });
    if (invitada.tipo !== 'ok-invitado') throw new Error('no se creó');

    const [fila] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, 'otra@ejemplo.test'));

    expect((await quitarUsuario(db, laura, fila!.id)).tipo).toBe('ok');
    expect(await leerToken(db, invitada.token)).toBeNull();
  });

  it('cambiar el rol de otra persona funciona', async () => {
    await invitarUsuario(db, {
      email: 'otra@ejemplo.test',
      nombre: 'Otra',
      rol: 'contenido',
    });
    const [fila] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, 'otra@ejemplo.test'));

    expect((await cambiarRol(db, laura, fila!.id, 'completo')).tipo).toBe('ok');
    const usuarios = await listarUsuarios(db);
    expect(usuarios.find((u) => u.email === 'otra@ejemplo.test')?.rol).toBe('completo');
  });
});

describe('el rol por defecto', () => {
  // Las filas que ya existían no pueden perder acceso al migrar.
  it('un usuario creado sin rol queda con acceso completo', async () => {
    await db.insert(adminUsers).values({
      email: 'vieja@ejemplo.test',
      name: 'Vieja',
      passwordHash: await hashearContrasena('contrasena-cualquiera'),
    });

    const usuarios = await listarUsuarios(db);
    expect(usuarios.find((u) => u.email === 'vieja@ejemplo.test')?.rol).toBe('completo');
  });

  it('emitirToken sirve para alguien que ya existe', async () => {
    const token = await emitirToken(db, laura);
    expect((await leerToken(db, token))?.nombre).toBe('Laura');
  });
});
