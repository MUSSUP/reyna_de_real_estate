/**
 * La bandeja de consultas.
 *
 * Lo que se sostiene acá: que lo que dejó el visitante **no se pueda editar**,
 * que las notas internas no se filtren, y que el CSV no se convierta en un
 * vehículo para ejecutar algo en la computadora de la clienta.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import {
  contarPorEstado,
  editarConsulta,
  exportarCsv,
  listarConsultas,
} from '../../backend/lib/consultasPanel';
import { leads } from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;

async function sembrar() {
  await db.insert(leads).values([
    {
      name: 'Ana Pérez',
      email: 'ana@ejemplo.com',
      phone: '+52 984 000 0000',
      interest: 'invertir',
      message: 'Me interesa la casa de Tulum',
      status: 'nuevo',
      createdAt: new Date('2026-03-10T12:00:00Z'),
    },
    {
      name: 'Bruno Díaz',
      email: 'bruno@ejemplo.com',
      interest: 'rentar',
      status: 'contactado',
      createdAt: new Date('2026-05-20T12:00:00Z'),
    },
    {
      name: 'Carla Ruiz',
      email: 'carla@ejemplo.com',
      interest: 'consulta',
      status: 'cerrado',
      createdAt: new Date('2026-07-01T12:00:00Z'),
    },
  ]);
}

beforeEach(async () => {
  const e = await crearBaseEfimera();
  db = e.db;
  cerrar = e.cerrar;
  await sembrar();
});

afterEach(async () => {
  await cerrar();
});

describe('listar y filtrar', () => {
  it('trae las consultas de la más nueva a la más vieja', async () => {
    const l = await listarConsultas(db);
    expect(l.total).toBe(3);
    expect(l.items.map((c) => c.nombre)).toEqual(['Carla Ruiz', 'Bruno Díaz', 'Ana Pérez']);
  });

  it('filtra por estado', async () => {
    expect((await listarConsultas(db, { estado: 'nuevo' })).total).toBe(1);
    expect((await listarConsultas(db, { estado: 'contactado' })).total).toBe(1);
  });

  it('un estado inventado no filtra nada en vez de romper', async () => {
    expect((await listarConsultas(db, { estado: 'inventado' })).total).toBe(3);
  });

  it('filtra por rango de fechas, incluyendo el último día completo', async () => {
    const l = await listarConsultas(db, { desde: '2026-05-01', hasta: '2026-07-01' });
    // Si el "hasta" no llegara al final del día, Carla (1 de julio) quedaría afuera.
    expect(l.items.map((c) => c.nombre)).toEqual(['Carla Ruiz', 'Bruno Díaz']);
  });

  it('una fecha ilegible no filtra en vez de romper', async () => {
    expect((await listarConsultas(db, { desde: 'ayer' })).total).toBe(3);
  });

  it('cuenta por estado', async () => {
    const c = await contarPorEstado(db);
    expect(c).toEqual({ nuevo: 1, contactado: 1, cerrado: 1, descartado: 0 });
  });
});

describe('lo que dejó el visitante es inmutable', () => {
  it('solo cambian el estado y las notas', async () => {
    const [c] = await listarConsultas(db).then((l) => l.items);
    const r = await editarConsulta(db, c!.id, {
      estado: 'contactado',
      notas: '  La llamé el martes  ',
    });
    expect(r.tipo).toBe('ok');

    const [despues] = await db.select().from(leads).where(eq(leads.id, c!.id));
    expect(despues!.status).toBe('contactado');
    expect(despues!.notes).toBe('La llamé el martes');
    // Y lo demás intacto.
    expect(despues!.name).toBe(c!.nombre);
    expect(despues!.email).toBe(c!.email);
  });

  it('un intento de cambiar el nombre o el mensaje se ignora', async () => {
    const [c] = await listarConsultas(db).then((l) => l.items);
    await editarConsulta(db, c!.id, {
      estado: 'cerrado',
      // @ts-expect-error — a propósito: se simula un cuerpo malicioso
      nombre: 'Otro nombre',
      mensaje: 'Mensaje cambiado',
    });

    const [despues] = await db.select().from(leads).where(eq(leads.id, c!.id));
    expect(despues!.name).toBe(c!.nombre);
    expect(despues!.message).toBe(c!.mensaje);
  });

  it('una nota vacía borra la nota, no guarda una cadena vacía', async () => {
    const [c] = await listarConsultas(db).then((l) => l.items);
    await editarConsulta(db, c!.id, { notas: 'algo' });
    await editarConsulta(db, c!.id, { notas: '   ' });

    const [despues] = await db.select().from(leads).where(eq(leads.id, c!.id));
    expect(despues!.notes).toBeNull();
  });

  it('un estado inventado se rechaza', async () => {
    const [c] = await listarConsultas(db).then((l) => l.items);
    expect((await editarConsulta(db, c!.id, { estado: 'inventado' })).tipo).toBe('datos');
  });

  it('editar una consulta que no existe se avisa, no revienta', async () => {
    const r = await editarConsulta(db, '00000000-0000-0000-0000-000000000000', { estado: 'nuevo' });
    expect(r.tipo).toBe('no-existe');
  });
});

describe('el CSV', () => {
  it('empieza con el BOM, para que Excel muestre bien los acentos', async () => {
    const csv = await exportarCsv(db);
    // Sin esto, "Teléfono" se abre como "TelÃ©fono".
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Teléfono');
    expect(csv).toContain('Ana Pérez');
  });

  it('respeta los filtros del listado', async () => {
    const csv = await exportarCsv(db, { estado: 'nuevo' });
    expect(csv).toContain('Ana Pérez');
    expect(csv).not.toContain('Bruno Díaz');
  });

  it('una fórmula escrita por un visitante NO se ejecuta al abrirlo', async () => {
    await db.insert(leads).values({
      name: 'Atacante',
      email: 'x@ejemplo.com',
      interest: 'consulta',
      message: '=HYPERLINK("http://malo.example","clic")',
    });

    const csv = await exportarCsv(db);
    // Excel trata como fórmula lo que empieza con = + - @. Se le antepone
    // una comilla simple para que quede como texto.
    expect(csv).not.toContain(',"=HYPERLINK');
    expect(csv).toContain("'=HYPERLINK");
  });

  it('las comillas del mensaje no rompen las columnas', async () => {
    await db.insert(leads).values({
      name: 'Comillas',
      email: 'c@ejemplo.com',
      interest: 'consulta',
      message: 'Dijo "hola" y, además, usó comas',
    });

    const csv = await exportarCsv(db);
    expect(csv).toContain('Dijo ""hola"" y, además, usó comas');
  });

  it('incluye las notas internas: el archivo es para la clienta', async () => {
    const [c] = await listarConsultas(db).then((l) => l.items);
    await editarConsulta(db, c!.id, { notas: 'Cliente difícil' });

    const csv = await exportarCsv(db);
    expect(csv).toContain('Cliente difícil');
  });
});
