import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // PGlite arranca un Postgres por archivo; le sobra con esto y no queda
    // colgado para siempre si algo se traba.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    /*
      Tope de procesos en paralelo.
      
      Cada archivo levanta **un Postgres entero en memoria**. Sin tope, vitest
      abre uno por núcleo y se pelean por la máquina: una corrida tardó 474
      segundos con dos pruebas caídas por tiempo, y la siguiente murió sin
      memoria. No era un error del código — las trece pasan.
      
      Con dos procesos tarda 204 segundos y pasa entero. Más lento en una
      máquina ociosa, confiable en una ocupada; para una suite que decide si
      algo se entrega, la confiabilidad vale más.
    */
    maxWorkers: 2,
  },
});
