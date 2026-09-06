/**
 * Ingreso al panel.
 *
 * El botón viene deshabilitado desde el HTML y se habilita acá. Así, si este
 * archivo no carga, nadie envía un formulario cuyo resultado sería un JSON en
 * pantalla: el botón no responde y el aviso de `<noscript>` explica por qué.
 */
(function () {
  'use strict';

  var formulario = document.querySelector('[data-formulario-ingreso]');
  if (!formulario) return;
  if (typeof window.fetch !== 'function') return;

  var boton = formulario.querySelector('[data-entrar]');
  var aviso = formulario.querySelector('[data-aviso-ingreso]');
  var volver = formulario.getAttribute('data-volver') || '/admin';

  // A partir de acá el envío está en nuestras manos.
  boton.disabled = false;

  function mostrarAviso(mensaje) {
    aviso.textContent = mensaje;
    aviso.classList.remove('hidden');
  }

  function ocupado(si) {
    boton.disabled = si;
    boton.textContent = si ? 'Ingresando…' : 'Ingresar';
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    aviso.classList.add('hidden');

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    ocupado(true);

    fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formulario.elements['email'].value,
        password: formulario.elements['password'].value,
      }),
    })
      .then(function (r) {
        return r
          .json()
          .catch(function () {
            return { ok: false };
          })
          .then(function (d) {
            return { estado: r.status, datos: d };
          });
      })
      .then(function (res) {
        if (res.datos && res.datos.ok) {
          // `replace` y no `href`: el ingreso no queda en el historial, así
          // que el botón "atrás" no vuelve a la pantalla de acceso.
          window.location.replace(volver);
          return;
        }
        ocupado(false);
        // La contraseña se limpia; el email se conserva para reintentar.
        formulario.elements['password'].value = '';
        formulario.elements['password'].focus();
        mostrarAviso((res.datos && res.datos.error) || 'Email o contraseña incorrectos');
      })
      .catch(function () {
        ocupado(false);
        mostrarAviso('No pudimos conectar. Revisá tu conexión y probá de nuevo.');
      });
  });
})();
