/**
 * Lectura de variables de entorno.
 *
 * El proyecto las lee desde tres contextos distintos y cada uno las expone a su
 * manera: al construir el sitio (Astro/Vite las pone en `import.meta.env`), al
 * correr una función en Netlify (`process.env`), y en los scripts de consola
 * (`process.env`). Este módulo unifica los tres para no repetir la lógica.
 */
export function leerEnv(nombre: string): string | undefined {
  const deProceso = typeof process !== 'undefined' ? process.env?.[nombre] : undefined;
  if (deProceso) return deProceso;

  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return meta.env?.[nombre];
  } catch {
    return undefined;
  }
}

/** Igual que `leerEnv`, pero falla si no está. Para lo que no puede faltar. */
export function requerirEnv(nombre: string): string {
  const valor = leerEnv(nombre);
  if (!valor) {
    // Se nombra la variable que falta, nunca su valor.
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}
