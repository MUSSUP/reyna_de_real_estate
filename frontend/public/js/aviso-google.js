/**
 * Muestra —y deja descartar— el recordatorio de que el sitio no está en Google.
 *
 * **Muestra, no esconde.** El recuadro viene con `hidden` desde el servidor, y
 * este script se lo saca si todavía no fue descartado. Al revés —visible por
 * omisión y escondido por el script— el recuadro aparecería y desaparecería en
 * cada visita de quien ya lo descartó, para siempre.
 *
 * El descarte se guarda en el navegador. Toda lectura y escritura va dentro de
 * un `try`: en una ventana privada, o con los datos del sitio bloqueados,
 * `localStorage` no lanza `null`, **lanza una excepción**. Sin el `try` el
 * script se corta antes de mostrar nada y el recordatorio no aparece nunca,
 * que es justo el fallo que no se nota.
 */
(function () {
  'use strict';

  var CLAVE = 'reyna:aviso-google-visto';

  var aviso = document.querySelector('[data-aviso-google]');
  if (!aviso) return;

  var yaLoVio = false;
  try {
    yaLoVio = window.localStorage.getItem(CLAVE) === '1';
  } catch {
    // Sin almacenamiento el aviso se muestra siempre. Para un recordatorio es
    // el lado correcto en el que equivocarse.
    yaLoVio = false;
  }

  if (yaLoVio) return;

  aviso.hidden = false;

  var boton = aviso.querySelector('[data-aviso-google-ocultar]');
  if (!boton) return;

  boton.addEventListener('click', function () {
    aviso.hidden = true;
    try {
      window.localStorage.setItem(CLAVE, '1');
    } catch {
      // No se pudo guardar: vuelve a aparecer la próxima vez. Molesta, pero no
      // rompe nada, y es preferible a tragarse el recordatorio en silencio.
    }
  });
})();
