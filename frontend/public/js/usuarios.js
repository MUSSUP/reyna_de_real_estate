/**
 * La pantalla de usuarios: invitar, cambiar el permiso, reenviar, quitar.
 *
 * Necesita JavaScript y lo dice con un `<noscript>`, igual que catálogos y
 * artículos: acá no hay técnica sin script que valga la pena sostener, porque
 * quien administra el panel lo hace desde una computadora con un navegador
 * normal.
 *
 * **Quitar a alguien pregunta antes.** Es la única acción de esta pantalla que
 * no se deshace con otro clic.
 */
(function () {
  'use strict';

  if (typeof window.fetch !== 'function') return;

  var aviso = document.querySelector('[data-aviso-usuarios]');

  function avisar(mensaje, tono) {
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.className =
      'rounded-[var(--radius-campo)] px-4 py-3 text-sm sm:col-span-2 ' +
      (tono === 'ok' ? 'bg-[#eef5f4] text-[#1e4f4c]' : 'bg-red-50 text-red-800');
    aviso.classList.remove('hidden');
    aviso.scrollIntoView({ block: 'nearest' });
  }

  function pedir(url, opciones) {
    return fetch(url, opciones)
      .then(function (r) {
        return r.json().catch(function () {
          return null;
        });
      })
      .catch(function () {
        return null;
      });
  }

  // --- Invitar ---------------------------------------------------------------

  var formulario = document.querySelector('[data-invitar]');
  if (formulario) {
    var boton = formulario.querySelector('[data-enviar-invitacion]');
    boton.disabled = false;
    var etiqueta = boton.textContent;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      boton.disabled = true;
      boton.textContent = 'Mandando…';

      pedir('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formulario.querySelector('#inv-nombre').value,
          email: formulario.querySelector('#inv-email').value,
          rol: formulario.querySelector('#inv-rol').value,
        }),
      }).then(function (j) {
        boton.disabled = false;
        boton.textContent = etiqueta;

        if (!j || !j.ok) {
          avisar((j && j.error) || 'No pudimos mandar la invitación.', 'error');
          return;
        }
        if (j.data && j.data.aviso) {
          // El acceso quedó creado aunque el correo no saliera: decirlo evita
          // que se invite tres veces a la misma persona.
          avisar(j.data.aviso, 'error');
          return;
        }
        avisar('Listo. Le llegó un correo para poner su contraseña.', 'ok');
        window.location.reload();
      });
    });
  }

  // --- Cambiar el permiso ----------------------------------------------------

  Array.prototype.forEach.call(document.querySelectorAll('[data-rol]'), function (select) {
    var anterior = select.value;

    select.addEventListener('change', function () {
      select.disabled = true;

      pedir('/api/admin/users/' + select.getAttribute('data-rol'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: select.value }),
      }).then(function (j) {
        select.disabled = false;

        if (!j || !j.ok) {
          // Vuelve a lo que estaba: si no, la pantalla muestra algo que no se guardó.
          select.value = anterior;
          avisar((j && j.error) || 'No pudimos cambiar el permiso.', 'error');
          return;
        }
        anterior = select.value;
        avisar('Permiso cambiado. Se aplica cuando esa persona vuelva a entrar.', 'ok');
      });
    });
  });

  // --- Reenviar el enlace ----------------------------------------------------

  Array.prototype.forEach.call(document.querySelectorAll('[data-reenviar]'), function (boton) {
    boton.addEventListener('click', function () {
      boton.disabled = true;
      var original = boton.textContent;
      boton.textContent = 'Mandando…';

      pedir('/api/admin/users/' + boton.getAttribute('data-reenviar'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reenviar: true }),
      }).then(function (j) {
        boton.disabled = false;
        boton.textContent = original;
        if (j && j.ok) avisar('Enlace reenviado.', 'ok');
        else avisar((j && j.error) || 'No pudimos reenviar el enlace.', 'error');
      });
    });
  });

  // --- Quitar ----------------------------------------------------------------

  Array.prototype.forEach.call(document.querySelectorAll('[data-quitar]'), function (boton) {
    boton.addEventListener('click', function () {
      var fila = boton.closest('[data-usuario]');
      var nombre = fila ? fila.querySelector('p').textContent.trim() : 'esta persona';

      if (!window.confirm('¿Quitar el acceso de ' + nombre + '? No se puede deshacer.')) return;

      boton.disabled = true;

      pedir('/api/admin/users/' + boton.getAttribute('data-quitar'), { method: 'DELETE' }).then(
        function (j) {
          if (j && j.ok) {
            window.location.reload();
            return;
          }
          boton.disabled = false;
          avisar((j && j.error) || 'No pudimos quitar el acceso.', 'error');
        },
      );
    });
  });
})();
