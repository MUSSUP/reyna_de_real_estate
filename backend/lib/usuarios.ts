/**
 * Quién entra al panel.
 *
 * **Invitar no manda una contraseña.** Se crea el usuario con una clave que no
 * sirve para nada y se le manda un enlace de los de `recuperacion.ts` para que
 * ponga la suya. Quien invita nunca conoce la clave del invitado, y no hay una
 * contraseña dando vueltas por correo.
 *
 * Dos barandas que no se negocian, porque el modo de fallo es quedarse afuera
 * del propio panel sin forma de volver:
 *
 * 1. **Nadie se quita a sí misma.**
 * 2. **Siempre queda al menos una persona con acceso completo.** Si no, el
 *    panel queda sin nadie que pueda administrar usuarios ni configuración, y
 *    recuperarlo exige una terminal.
 *
 * La base entra por parámetro (D-17).
 */
import { randomBytes } from 'node:crypto';
import { and, asc, eq, ne } from 'drizzle-orm';
import type { Db } from '../db/client';
import { adminUsers } from '../db/schema';
import type { RolAdmin } from '../db/schema';
import { hashearContrasena } from './auth';
import { emitirToken } from './recuperacion';

export const ROLES: { valor: RolAdmin; etiqueta: string; descripcion: string }[] = [
  {
    valor: 'completo',
    etiqueta: 'Acceso completo',
    descripcion: 'Todo, incluidos los propietarios, la configuración y los usuarios.',
  },
  {
    valor: 'contenido',
    etiqueta: 'Sólo contenido',
    descripcion:
      'Propiedades, fotos, destacadas, artículos, catálogos y consultas. No ve los propietarios, ni la configuración, ni esta pantalla.',
  },
];

export interface UsuarioDelPanel {
  id: string;
  email: string;
  nombre: string;
  rol: RolAdmin;
  ultimoIngreso: Date | null;
  creado: Date;
}

export type ResultadoUsuario =
  | { tipo: 'ok' }
  | { tipo: 'ok-invitado'; token: string; email: string; nombre: string }
  | { tipo: 'datos'; error: string };

/** Nunca devuelve el hash de la contraseña. */
export async function listarUsuarios(db: Db): Promise<UsuarioDelPanel[]> {
  return db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      nombre: adminUsers.name,
      rol: adminUsers.role,
      ultimoIngreso: adminUsers.lastLoginAt,
      creado: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));
}

/**
 * Crea la persona y devuelve el enlace para que ponga su contraseña.
 *
 * El enlace lo manda quien llama, por correo. Acá no se envía nada: esta capa
 * no sabe de proveedores de correo, igual que el resto de `backend/lib`.
 */
export async function invitarUsuario(
  db: Db,
  datos: { email: unknown; nombre: unknown; rol: unknown },
): Promise<ResultadoUsuario> {
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const rol = datos.rol;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { tipo: 'datos', error: 'Escribí un correo válido' };
  }
  if (nombre === '') {
    return { tipo: 'datos', error: 'Falta el nombre' };
  }
  if (rol !== 'completo' && rol !== 'contenido') {
    return { tipo: 'datos', error: 'Elegí qué va a poder hacer' };
  }

  const [yaEsta] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (yaEsta) {
    return { tipo: 'datos', error: 'Ya hay alguien con ese correo' };
  }

  // Una contraseña que nadie conoce ni puede adivinar: la persona entra por el
  // enlace, no por acá. Es más limpio que dejar el campo vacío, que obligaría
  // a que el ingreso contemple un caso raro.
  const inservible = await hashearContrasena(randomBytes(32).toString('base64url'));

  const [creado] = await db
    .insert(adminUsers)
    .values({ email, name: nombre, role: rol, passwordHash: inservible })
    .returning({ id: adminUsers.id });

  if (!creado) return { tipo: 'datos', error: 'No pudimos crear el acceso' };

  return {
    tipo: 'ok-invitado',
    token: await emitirToken(db, creado.id),
    email,
    nombre,
  };
}

export async function cambiarRol(
  db: Db,
  quienPide: string,
  id: string,
  rol: unknown,
): Promise<ResultadoUsuario> {
  if (rol !== 'completo' && rol !== 'contenido') {
    return { tipo: 'datos', error: 'Ese permiso no existe' };
  }
  if (id === quienPide) {
    return { tipo: 'datos', error: 'No podés cambiar tu propio permiso' };
  }
  if (rol === 'contenido' && !(await quedaOtroCompleto(db, id))) {
    return {
      tipo: 'datos',
      error: 'Tiene que quedar al menos una persona con acceso completo',
    };
  }

  await db.update(adminUsers).set({ role: rol }).where(eq(adminUsers.id, id));
  return { tipo: 'ok' };
}

export async function quitarUsuario(
  db: Db,
  quienPide: string,
  id: string,
): Promise<ResultadoUsuario> {
  if (id === quienPide) {
    return { tipo: 'datos', error: 'No podés quitarte a vos misma' };
  }
  if (!(await quedaOtroCompleto(db, id))) {
    return {
      tipo: 'datos',
      error: 'Tiene que quedar al menos una persona con acceso completo',
    };
  }

  // Los enlaces de recuperación de esa persona se van con ella: la clave
  // foránea es `on delete cascade`.
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  return { tipo: 'ok' };
}

/** Si, sacando a `excepto`, todavía hay alguien con acceso completo. */
async function quedaOtroCompleto(db: Db, excepto: string): Promise<boolean> {
  const otros = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, 'completo'), ne(adminUsers.id, excepto)))
    .limit(1);

  return otros.length > 0;
}
