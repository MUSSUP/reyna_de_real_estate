/**
 * Cliente de base de datos.
 *
 * El sitio público NO usa esto: se genera estático y no consulta la base (D-04).
 * Solo lo usan las funciones del panel y el alta de consultas.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { leerEnv, requerirEnv } from '../lib/entorno';

/**
 * Una sola conexión por instancia de función.
 * `max: 1` es deliberado: en un entorno sin servidor cada invocación es
 * efímera, y un pool grande agota las conexiones del plan gratuito.
 */
let clienteSql: ReturnType<typeof postgres> | undefined;

function obtenerCliente() {
  clienteSql ??= postgres(requerirEnv('DATABASE_URL'), {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // Supabase y la mayoría de los Postgres gestionados exigen TLS.
    ssl: leerEnv('NODE_ENV') === 'production' ? 'require' : undefined,
  });
  return clienteSql;
}

export function getDb() {
  return drizzle(obtenerCliente(), { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
