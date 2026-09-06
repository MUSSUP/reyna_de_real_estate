/**
 * Una base Postgres de verdad, en memoria, por cada prueba.
 *
 * No se simula la base: se corren las migraciones reales sobre PGlite, que es
 * Postgres compilado a WebAssembly. Así lo que se prueba es el SQL que va a
 * producción — restricciones, valores por defecto y tipos incluidos — y no una
 * imitación que se comporta distinto justo donde importa.
 */
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Db } from '../backend/db/client';

const MIGRACIONES = fileURLToPath(new URL('../backend/db/migrations/', import.meta.url));

export async function crearBaseEfimera(): Promise<{ db: Db; cerrar: () => Promise<void> }> {
  const cliente = new PGlite();

  const archivos = readdirSync(MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const archivo of archivos) {
    const sql = readFileSync(MIGRACIONES + archivo, 'utf8');
    for (const bloque of sql.split('--> statement-breakpoint')) {
      const limpio = bloque.trim();
      if (limpio) await cliente.exec(limpio);
    }
  }

  return {
    db: drizzle(cliente) as unknown as Db,
    cerrar: () => cliente.close(),
  };
}
