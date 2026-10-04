/**
 * La bandeja de consultas: cambiar estado y anotar.
 *
 * Guarda solo, sin botón. Cambiar el estado de una consulta es una acción
 * completa en sí misma; pedirle además que apriete "guardar" es una forma de
 * perder el cambio.
 *
 * Las notas se agrupan con una espera corta: se escriben de a una tecla.
 */
(function () {
  'use strict';

  if (typeof window.fetch !== 'function') return;

  var aviso = document.querySelector('[data-aviso-consulta]');
  var pendientes = {};

  function decir(mensaje, tono) {
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.className =
      'mt-5 rounded-[var(--radius-campo)] px-4 py-3 text-sm ' +
      (tono === 'ok' ? 'bg-[#e4ede9] text-[#1e4f4c]' : 'bg-red-50 text-red-800');
  }

  function guardar(id, cambios, fila) {
    fetch('/api/admin/leads/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (!j.ok) {
          decir(j.error || 'No pudimos guardar el cambio', 'error');
          return;
        }
        decir('Guardado.', 'ok');
        if (cambios.estado) pintarSello(fila, cambios.estado);
      })
      .catch(function () {
        decir('No pudimos conectar. El cambio no se guardó.', 'error');
      });
  }

  var ETIQUETAS = {
    nuevo: 'Nueva',
    contactado: 'Contactada',
    cerrado: 'Cerrada',
    descartado: 'Descartada',
  };

  var COLORES = {
    nuevo: 'bg-[#fdeaf1] text-[#9e2a5c] border-[#f5c3d8]',
    contactado: 'bg-[#e4ede9] text-[#1e4f4c] border-[#b6cec6]',
    cerrado: 'bg-[#f2ece9] text-[#6b6b6b] border-[#ddd0c9]',
    descartado: 'bg-[#f2ece9] text-[#948a85] border-[#ddd0c9]',
  };

  /** El sello de estado se actualiza sin recargar, para que se vea el efecto. */
  function pintarSello(fila, estado) {
    var sello = fila.querySelector('[data-sello]');
    if (!sello) return;
    // textContent y no innerHTML: acá no se inserta HTML, nunca.
    sello.textContent = ETIQUETAS[estado] || estado;
    sello.className =
      'rounded-full border px-2.5 py-1 text-xs font-semibold ' + (COLORES[estado] || '');
    sello.setAttribute('data-sello', '');
  }

  document.addEventListener('change', function (e) {
    var campo = e.target;
    if (!campo.hasAttribute || !campo.hasAttribute('data-estado')) return;
    var fila = campo.closest('[data-consulta]');
    if (!fila) return;
    guardar(fila.getAttribute('data-consulta'), { estado: campo.value }, fila);
  });

  document.addEventListener('input', function (e) {
    var campo = e.target;
    if (!campo.hasAttribute || !campo.hasAttribute('data-notas')) return;
    var fila = campo.closest('[data-consulta]');
    if (!fila) return;

    var id = fila.getAttribute('data-consulta');
    if (pendientes[id]) window.clearTimeout(pendientes[id]);
    pendientes[id] = window.setTimeout(function () {
      guardar(id, { notas: campo.value }, fila);
    }, 800);
  });
})();
