/**
 * Qué parte del panel es sólo de la dueña.
 *
 * Una sola lista, en un solo archivo, porque el modo de fallo de los permisos
 * es que una pantalla quede sin proteger — y sea justo la que importa. Si
 * mañana aparece otra área restringida, se agrega acá y no en siete lugares.
 *
 * **Lo único que se protege por ser dato ajeno son los propietarios**: nombre,
 * teléfono y correo de gente que le confió una propiedad a la dueña (RNF-10,
 * D-09). No es información de ella, es de terceros, y por eso sobrevive aunque
 * todo lo demás esté permitido.
 *
 * Las otras dos áreas se protegen por otra razón: configuración y usuarios
 * cambian cómo funciona el sitio para todos, no son trabajo de carga.
 *
 * Sin dependencias a propósito, igual que `urlSegura.ts` (D-19): lo usan tanto
 * las páginas al dibujar como los endpoints al verificar.
 */

/** El catálogo que no ve quien tiene acceso de contenido. */
export const CATALOGO_RESERVADO = 'propietarios';

/**
 * Si un catálogo es sólo para acceso completo.
 *
 * Los propietarios viven **dentro de Catálogos**, al lado de zonas y
 * tipologías. Por eso no alcanza con esconder una pantalla: el permiso entra
 * acá, por catálogo.
 */
export function catalogoReservado(nombre: string): boolean {
  return nombre === CATALOGO_RESERVADO;
}

/**
 * Las rutas del panel que exigen acceso completo.
 *
 * Se comparan por prefijo con la barra incluida, o exactas. `startsWith` a
 * secas dejaría pasar `/admin/configuracionX`.
 */
const RUTAS_RESERVADAS = ['/admin/configuracion', '/admin/usuarios'];

export function rutaReservada(ruta: string): boolean {
  return RUTAS_RESERVADAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
}

/**
 * Saca el propietario de lo que llega del formulario.
 *
 * Se usa cuando quien guarda no tiene acceso completo. **Quitar el campo no es
 * lo mismo que mandarlo vacío**: la capa que guarda sólo toca las columnas que
 * vienen definidas, así que al quitarlo, editar una propiedad deja su
 * propietario **intacto**. Mandar `null` lo borraría — y sería un robo de
 * datos disfrazado de permiso.
 *
 * No muta lo que recibe.
 */
export function sinPropietario(crudo: unknown): unknown {
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return crudo;
  const resto: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(crudo as Record<string, unknown>)) {
    if (clave !== 'ownerId') resto[clave] = valor;
  }
  return resto;
}
