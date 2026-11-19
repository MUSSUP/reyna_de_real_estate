/**
 * Las dos pantallas de recuperación: pedir el enlace y poner la contraseña.
 *
 * Un solo archivo porque comparten todo salvo el endpoint y el texto. Cada
 * formulario se activa sólo si está en la página.
 *
 * Los botones **nacen deshabilitados en el HTML** y se habilitan acá: sin este
 * script el endpoint devolvería JSON y el navegador lo mostraría en pantalla.
 * Es preferible un botón que no se puede apretar y lo dice.
 */
(function () {
  'use strict';

  if (typeof window.fetch !== 'function') return;

  function avisar(caja, mensaje, tono) {
    caja.textContent = mensaje;
    caja.className =
      'rounded-[var(--radius-campo)] px-4 py-3 text-sm ' +
      (tono === 'ok' ? 'bg-[#eef5f4] text-[#1e4f4c]' : 'bg-red-50 text-red-800');
    caja.classList.remove('hidden');
  }

  function conectar(formulario, boton, aviso, trabajo) {
    boton.disabled = false;
    var etiqueta = boton.textContent;
    var enviando = false;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (enviando) return;
      enviando = true;
      boton.disabled = true;
      boton.textContent = 'Un momento…';
      aviso.classList.add('hidden');

      trabajo()
        .catch(function () {
          avisar(aviso, 'No pudimos conectar. Revisá la conexión y probá de nuevo.', 'error');
        })
        .finally(function () {
          enviando = false;
          boton.disabled = false;
          boton.textContent = etiqueta;
        });
    });
  }

  // --- Pedir el enlace -------------------------------------------------------

  var pedido = document.querySelector('[data-formulario-recuperar]');
  if (pedido) {
    var botonPedido = pedido.querySelector('[data-enviar]');
    var avisoPedido = pedido.querySelector('[data-aviso-recuperar]');

    conectar(pedido, botonPedido, avisoPedido, function () {
      var email = pedido.querySelector('#rec-email').value;

      return fetch('/api/admin/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) {
          return r.json().catch(function () {
            return null;
          });
        })
        .then(function (j) {
          if (j && j.ok) {
            // Siempre el mismo mensaje: no se revela si la dirección existe.
            avisar(avisoPedido, j.data.mensaje, 'ok');
            pedido.querySelector('#rec-email').value = '';
          } else {
            avisar(avisoPedido, (j && j.error) || 'No pudimos procesar el pedido.', 'error');
          }
        });
    });
  }

  // --- Poner la contraseña ---------------------------------------------------

  var clave = document.querySelector('[data-formulario-clave]');
  if (clave) {
    var botonClave = clave.querySelector('[data-guardar-clave]');
    var avisoClave = clave.querySelector('[data-aviso-clave]');

    conectar(clave, botonClave, avisoClave, function () {
      return fetch('/api/admin/auth/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: clave.getAttribute('data-token'),
          password: clave.querySelector('#clave-nueva').value,
        }),
      })
        .then(function (r) {
          return r.json().catch(function () {
            return null;
          });
        })
        .then(function (j) {
          if (j && j.ok) {
            avisar(avisoClave, 'Listo. Te llevamos al ingreso…', 'ok');
            // `replace` saca esta página del historial: el enlace ya se quemó y
            // volver con "atrás" sólo mostraría un formulario que no funciona.
            window.setTimeout(function () {
              window.location.replace('/admin/login');
            }, 1200);
          } else {
            avisar(avisoClave, (j && j.error) || 'No pudimos guardar la contraseña.', 'error');
          }
        });
    });
  }
})();
