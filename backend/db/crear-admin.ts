/**
 * Crea o actualiza la usuaria del panel.
 *
 *   npm run db:crear-admin
 *
 * La contraseña se pide por teclado y no se muestra: pasarla como argumento la
 * dejaría guardada en el historial del terminal.
 */
import { eq } from 'drizzle-orm';
import { createInterface } from 'node:readline/promises';
import { getDb } from './client';
import { adminUsers } from './schema';
import { hashearContrasena } from '../lib/auth';

const LARGO_MINIMO = 12;

async function preguntar(texto: string, ocultar = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  if (!ocultar) {
    const respuesta = await rl.question(texto);
    rl.close();
    return respuesta.trim();
  }

  // Se tapa el eco para que la contraseña no quede visible en pantalla.
  const salida = process.stdout as NodeJS.WriteStream & { muted?: boolean };
  const escribirOriginal = salida.write.bind(salida);
  salida.write = ((fragmento: string, ...resto: unknown[]) =>
    salida.muted ? true : escribirOriginal(fragmento, ...(resto as []))) as typeof salida.write;

  const promesa = rl.question(texto);
  salida.muted = true;
  const respuesta = await promesa;
  salida.muted = false;
  salida.write = escribirOriginal;
  escribirOriginal('\n');
  rl.close();
  return respuesta.trim();
}

const email = (await preguntar('Email: ')).toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Ese email no parece válido');
  process.exit(1);
}

const nombre = (await preguntar('Nombre: ')) || 'Administradora';

const contrasena = await preguntar('Contraseña: ', true);
if (contrasena.length < LARGO_MINIMO) {
  console.error(`La contraseña necesita al menos ${LARGO_MINIMO} caracteres`);
  process.exit(1);
}

const repetida = await preguntar('Repetir contraseña: ', true);
if (contrasena !== repetida) {
  console.error('Las contraseñas no coinciden');
  process.exit(1);
}

const db = getDb();
const hash = await hashearContrasena(contrasena);
const existente = (
  await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
)[0];

if (existente) {
  await db
    .update(adminUsers)
    .set({ passwordHash: hash, name: nombre })
    .where(eq(adminUsers.id, existente.id));
  console.warn(`\nContraseña actualizada para ${email}`);
} else {
  await db.insert(adminUsers).values({ email, passwordHash: hash, name: nombre });
  console.warn(`\nUsuaria creada: ${email}`);
}

process.exit(0);
