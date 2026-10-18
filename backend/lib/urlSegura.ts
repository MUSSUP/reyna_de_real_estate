/**
 * Si una dirección se puede poner en un `href` o un `src`.
 *
 * Vive en su propio archivo **sin ninguna dependencia**, por la misma razón
 * que `anchosImagen.ts` (D-19): esto lo necesitan las páginas del sitio al
 * dibujar, y el módulo de configuración arrastra la base de datos entera.
 *
 * Se valida en positivo —solo `http` y `https`— y no con una lista de
 * esquemas prohibidos, porque esa lista siempre se queda corta: `javascript:`,
 * `data:`, `vbscript:`, y lo que aparezca el año que viene.
 */
export function urlSegura(valor: string): boolean {
  const v = valor.trim();
  if (v === '') return true;

  /*
    Una dirección del propio sitio, como `/video/hero.mp4`.

    Hace falta y no es un permiso de más. La política de seguridad del sitio
    solo deja cargar medios del propio dominio, así que **un video siempre va
    a vivir acá**; sin esto, el campo "Video de fondo" del panel rechazaba lo
    único que funciona y aceptaba direcciones externas que el navegador
    después bloqueaba al reproducir. Un callejón sin salida.

    No hay riesgo: sin esquema no hay `javascript:` posible. Lo que sí se
    rechaza es `//otro-sitio.com`, que parece una ruta y es una dirección
    externa con el esquema implícito.
  */
  if (v.startsWith('/') && !v.startsWith('//')) return true;

  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

    /*
      Un dominio sin punto no existe en internet.
      
      Pasó de verdad: el campo del video era `<input type="url">`, alguien
      pegó `/video/hero.mp4`, y **el navegador le agregó `https://` adelante**
      para que pasara su propia validación. Quedó guardado
      `https://video/hero.mp4`, que es una dirección válida apuntando a un
      sitio llamado "video" — y el video dejó de verse, sin que nada avisara.

      El control es simple y no tiene falsos positivos acá: toda dirección
      pública tiene al menos un punto. `localhost` se deja pasar porque se usa
      al desarrollar.
    */
    const sinPunto = !u.hostname.includes('.');
    const esLocal = u.hostname === 'localhost';
    return !sinPunto || esLocal;
  } catch {
    return false;
  }
}
