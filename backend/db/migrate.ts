/**
 * Aplica las migraciones pendientes. Se corre a mano en el despliegue,
 * nunca automáticamente al arrancar una función.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await migrate(drizzle(sql), { migrationsFolder: './backend/db/migrations' });
  console.warn('Migraciones aplicadas');
} catch (error) {
  console.error('Fallaron las migraciones:', error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await sql.end();
}
