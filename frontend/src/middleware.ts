import { defineMiddleware } from 'astro:middleware';
import { leerCookie, leerToken } from '../../backend/lib/auth';

/**
 * La puerta del panel.
 *
 * Está acá y no en cada página **a propósito** (D-13): si cada pantalla
 * escribiera su propia verificación, tarde o temprano una quedaría sin
 * proteger, y sería justo la que nadie mira. Una página nueva bajo `/admin`
 * queda protegida por existir, sin que haya que acordarse de nada.
 *
 * Hace dos cosas:
 *
 * 1. **Sin sesión válida, redirige al ingreso.** No devuelve un 401 con JSON:
 *    quien navega espera una pantalla, no un error de API. Los endpoints sí
 *    devuelven 401, y eso lo maneja `requerirSesion`.
 *
 * 2. **Prohíbe guardar en caché todo el panel.** Sin esto, al cerrar sesión el
 *    botón "atrás" del navegador vuelve a mostrar la última pantalla desde el
 *    historial —con los datos a la vista— aunque la sesión ya no exista.
 */
const RAIZ_PANEL = '/admin';
const INGRESO = '/admin/login';

export const onRequest = defineMiddleware(async (contexto, siguiente) => {
  const ruta = contexto.url.pathname;

  // Las páginas del panel; los endpoints `/api/admin/**` se protegen solos.
  const esPanel = ruta === RAIZ_PANEL || ruta.startsWith(`${RAIZ_PANEL}/`);
  if (!esPanel) return siguiente();

  const token = leerCookie(contexto.request.headers.get('cookie'));
  const sesion = token ? await leerToken(token) : null;

  if (ruta === INGRESO) {
    // Con sesión viva, el ingreso no tiene sentido: se va al tablero.
    if (sesion) return contexto.redirect(RAIZ_PANEL);
    return sinCache(await siguiente());
  }

  if (!sesion) {
    // Se recuerda adónde iba, para volver ahí después de entrar.
    const destino = ruta === RAIZ_PANEL ? '' : `?volver=${encodeURIComponent(ruta)}`;
    return contexto.redirect(`${INGRESO}${destino}`);
  }

  // Las pantallas del panel pueden leer quién entró sin volver a validar.
  contexto.locals.sesion = sesion;
  return sinCache(await siguiente());
});

/** Ni el navegador ni un intermediario deben quedarse con una pantalla del panel. */
function sinCache(respuesta: Response): Response {
  respuesta.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  respuesta.headers.set('Pragma', 'no-cache');
  return respuesta;
}
