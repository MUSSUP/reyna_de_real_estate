/**
 * La bandeja de consultas del panel.
 *
 * Dos reglas gobiernan este archivo:
 *
 * 1. **Lo que dejó el visitante es inmutable.** Nombre, mail, teléfono,
 *    interés y mensaje se guardan y no se editan nunca. Solo cambian el
 *    estado y las notas internas, que son de la clienta.
 * 2. **Las notas no salen al sitio.** Son para ella; el visitante no las ve
 *    ni puede llegar a ellas.
 */
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { Db } from '../db/client';
import { leads, properties } from '../db/schema';

export const ESTADOS_CONSULTA = ['nuevo', 'contactado', 'cerrado', 'descartado'] as const;
export type EstadoConsulta = (typeof ESTADOS_CONSULTA)[number];

export const ETIQUETA_ESTADO: Record<EstadoConsulta, string> = {
  nuevo: 'Nueva',
  contactado: 'Contactada',
  cerrado: 'Cerrada',
  descartado: 'Descartada',
};

export const ETIQUETA_INTERES = {
  invertir: 'Invertir',
  rentar: 'Rentar',
  consulta: 'Consulta general',
} as const;

export interface FiltrosConsultas {
  estado?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
}

function esEstado(v: string | undefined): v is EstadoConsulta {
  return Boolean(v) && (ESTADOS_CONSULTA as readonly string[]).includes(v!);
}

/** Una fecha de la dirección. Si no se entiende, no filtra en vez de romper. */
function aFecha(v: string | undefined, finDelDia = false): Date | null {
  if (!v) return null;
  const d = new Date(finDelDia ? `${v}T23:59:59.999Z` : `${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function condiciones(f: FiltrosConsultas): SQL | undefined {
  const cs: SQL[] = [];
  if (esEstado(f.estado)) cs.push(eq(leads.status, f.estado));

  const desde = aFecha(f.desde);
  if (desde) cs.push(gte(leads.createdAt, desde));

  const hasta = aFecha(f.hasta, true);
  if (hasta) cs.push(lte(leads.createdAt, hasta));

  return cs.length ? and(...cs) : undefined;
}

/** Los campos que viajan al panel. Se nombran explícitos: nada de `select *`. */
const campos = {
  id: leads.id,
  nombre: leads.name,
  email: leads.email,
  telefono: leads.phone,
  interes: leads.interest,
  mensaje: leads.message,
  estado: leads.status,
  notas: leads.notes,
  origen: leads.sourcePath,
  avisado: leads.notifiedAt,
  creado: leads.createdAt,
  propiedad: properties.titleEs,
  propiedadSlug: properties.slug,
};

export async function listarConsultas(db: Db, filtros: FiltrosConsultas = {}) {
  const porPagina = Math.min(Math.max(filtros.porPagina ?? 50, 1), 200);
  const pagina = Math.max(filtros.pagina ?? 1, 1);
  const donde = condiciones(filtros);

  const [items, total] = await Promise.all([
    db
      .select(campos)
      .from(leads)
      .leftJoin(properties, eq(leads.propertyId, properties.id))
      .where(donde)
      .orderBy(desc(leads.createdAt))
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    db.select({ n: count() }).from(leads).where(donde),
  ]);

  return { items, total: total[0]?.n ?? 0, pagina, porPagina };
}

/** Cuántas hay en cada estado. Alimenta los contadores de los filtros. */
export async function contarPorEstado(db: Db): Promise<Record<EstadoConsulta, number>> {
  const filas = await db
    .select({ estado: leads.status, n: count() })
    .from(leads)
    .groupBy(leads.status);

  const salida = { nuevo: 0, contactado: 0, cerrado: 0, descartado: 0 };
  for (const f of filas) salida[f.estado as EstadoConsulta] = f.n;
  return salida;
}

export type ResultadoEdicion = { tipo: 'ok' } | { tipo: 'no-existe' } | { tipo: 'datos' };

/**
 * Cambia estado y notas. **Nada más.**
 *
 * Los datos del visitante no se tocan: si se pudieran editar, la bandeja
 * dejaría de ser un registro de lo que pasó y pasaría a ser un borrador.
 */
export async function editarConsulta(
  db: Db,
  id: string,
  cambios: { estado?: unknown; notas?: unknown },
): Promise<ResultadoEdicion> {
  const set: { status?: EstadoConsulta; notes?: string | null } = {};

  if (cambios.estado !== undefined) {
    if (typeof cambios.estado !== 'string' || !esEstado(cambios.estado)) return { tipo: 'datos' };
    set.status = cambios.estado;
  }

  if (cambios.notas !== undefined) {
    if (cambios.notas !== null && typeof cambios.notas !== 'string') return { tipo: 'datos' };
    const texto = typeof cambios.notas === 'string' ? cambios.notas.trim() : '';
    set.notes = texto ? texto.slice(0, 5000) : null;
  }

  if (Object.keys(set).length === 0) return { tipo: 'datos' };

  const r = await db.update(leads).set(set).where(eq(leads.id, id)).returning({ id: leads.id });
  return r.length ? { tipo: 'ok' } : { tipo: 'no-existe' };
}

// --- Exportar a CSV ---------------------------------------------------------

/**
 * Escapa un valor para CSV.
 *
 * Además de las comillas, se neutraliza el caso en que un valor empieza con
 * `=`, `+`, `-` o `@`: Excel lo interpretaría como **fórmula**. El mensaje lo
 * escribe cualquiera desde internet, así que alguien podría dejar una fórmula
 * que se ejecute al abrir el archivo en la computadora de la clienta.
 */
function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return '""';
  let s = String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const COLUMNAS = [
  'Fecha',
  'Nombre',
  'Email',
  'Teléfono',
  'Interés',
  'Propiedad',
  'Mensaje',
  'Estado',
  'Notas internas',
  'Aviso por mail',
] as const;

export async function exportarCsv(db: Db, filtros: FiltrosConsultas = {}): Promise<string> {
  const { items } = await listarConsultas(db, { ...filtros, porPagina: 200 });

  const filas = items.map((c) =>
    [
      celda(c.creado instanceof Date ? c.creado.toISOString().slice(0, 10) : c.creado),
      celda(c.nombre),
      celda(c.email),
      celda(c.telefono),
      celda(ETIQUETA_INTERES[c.interes as keyof typeof ETIQUETA_INTERES] ?? c.interes),
      celda(c.propiedad),
      celda(c.mensaje),
      celda(ETIQUETA_ESTADO[c.estado as EstadoConsulta] ?? c.estado),
      celda(c.notas),
      celda(c.avisado ? 'Enviado' : 'Sin aviso'),
    ].join(','),
  );

  // El BOM es lo que hace que Excel muestre bien los acentos. Sin él,
  // "Teléfono" se abre como "TelÃ©fono".
  return '﻿' + [COLUMNAS.map(celda).join(','), ...filas].join('\r\n') + '\r\n';
}
