import { defineConfig } from 'drizzle-kit';

/**
 * La URL viene siempre del entorno: nunca se escribe una credencial acá.
 * En desarrollo sale de .env; en producción, del panel de Netlify (Nivel 2).
 */
export default defineConfig({
  schema: './backend/db/schema.ts',
  out: './backend/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
