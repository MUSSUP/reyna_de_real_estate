/**
 * Datos estructurados para los buscadores, serializados sin abrir un agujero.
 *
 * El problema concreto: `JSON.stringify` **no escapa `</script>`**. Un título
 * que contenga `</script><img src=x onerror=...>` cierra el bloque y lo que
 * sigue se ejecuta en la página pública. Y acá va con `set:html`, así que
 * Astro no escapa nada: el bloque tiene que salir crudo o el buscador no lo
 * lee.
 *
 * Hasta UJ-10 los títulos los ponía la siembra. Desde que la clienta escribe
 * noticias e informes desde el panel, el campo es **entrada externa** — el
 * mismo razonamiento que se le aplicó a las direcciones en UJ-12, y que acá
 * faltaba.
 *
 * Se escapan `<`, `>` y `&` como secuencias Unicode. JSON las entiende igual,
 * así que lo que leen Google y las redes es idéntico; lo que cambia es que ya
 * no hay forma de escribir `</script>` en la salida.
 */
export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}
