/**
 * Lo común a todas las pantallas del panel.
 *
 * Por ahora, cerrar sesión. Se hace con `fetch` y no con un enlace porque el
 * cierre tiene que ser un POST: un GET que cierra sesión lo puede disparar
 * cualquier página ajena con una imagen apuntando a esa dirección.
 */
(function () {
  'use strict';

  var boton = document.querySelector('[data-cerrar-sesion]');
  if (!boton || typeof window.fetch !== 'function') return;

  boton.addEventListener('click', function () {
    boton.disabled = true;
    boton.textContent = 'Saliendo…';

    fetch('/api/admin/auth/logout', { method: 'POST' })
      .then(function () {
        // `replace` borra el panel del historial: el botón "atrás" ya no
        // puede volver a una pantalla con datos de una sesión cerrada.
        window.location.replace('/admin/login');
      })
      .catch(function () {
        boton.disabled = false;
        boton.textContent = 'Salir';
      });
  });
})();
