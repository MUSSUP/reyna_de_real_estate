/**
 * Los catálogos: alta, edición y borrado de las listas del formulario.
 *
 * **Esta pantalla necesita este archivo**, a diferencia de destacadas y
 * configuración. Allá el camino sin JavaScript existe por una razón concreta
 * —arrastrar no dispara nada en pantallas táctiles—; acá los botones comunes
 * funcionan en cualquier lado. La página lo dice con un `<noscript>` en vez de
 * dejar a alguien apretando un botón muerto.
 *
 * El formulario es uno solo y sirve para las dos cosas. Un campo oculto
 * guarda qué se está editando: vacío es un alta.
 */
(function () {
  'use strict';

  var seccion = document.querySelector('[data-catalogo]');
  var forma = document.querySelector('[data-forma]');
  if (!seccion || !forma || typeof window.fetch !== 'function') return;

  var catalogo = seccion.getAttribute('data-catalogo');
  // Los títulos vienen escritos del servidor: "Nueva zona" y "Nuevo
  // desarrollista" no se pueden armar con la misma concatenación.
  var tituloNuevo = seccion.getAttribute('data-nuevo') || 'Nuevo';
  var tituloEditar = seccion.getAttribute('data-editar') || 'Editar';
  var base = '/api/admin/catalogs/' + catalogo;

  var campoId = forma.querySelector('[data-id-editando]');
  var titulo = forma.querySelector('[data-titulo-forma]');
  var guardar = forma.querySelector('[data-guardar]');
  var cancelar = forma.querySelector('[data-cancelar]');
  var errorForma = forma.querySelector('[data-error-forma]');
  var errorLista = document.querySelector('[data-error-lista]');
  var trabajando = false;

  // --- Mensajes -------------------------------------------------------------

  function limpiar() {
    var huecos = forma.querySelectorAll('[data-error-de]');
    for (var i = 0; i < huecos.length; i++) {
      huecos[i].textContent = '';
      huecos[i].classList.add('hidden');
    }
    var campos = forma.querySelectorAll('[data-campo]');
    for (var j = 0; j < campos.length; j++) campos[j].removeAttribute('aria-invalid');
    if (errorForma) {
      errorForma.textContent = '';
      errorForma.classList.add('hidden');
    }
    if (errorLista) {
      errorLista.textContent = '';
      errorLista.classList.add('hidden');
    }
  }

  function fallar(caja, texto) {
    if (!caja) return;
    caja.textContent = texto;
    caja.classList.remove('hidden');
    if (caja.scrollIntoView) caja.scrollIntoView({ block: 'nearest' });
  }

  function pintarErrores(campos) {
    var primero = null;
    Object.keys(campos).forEach(function (nombre) {
      // El texto va con textContent: nunca se inserta HTML en la página.
      var hueco = forma.querySelector('[data-error-de="' + nombre + '"]');
      if (hueco) {
        hueco.textContent = campos[nombre];
        hueco.classList.remove('hidden');
      }
      var control = forma.querySelector('[data-campo="' + nombre + '"]');
      if (control) {
        control.setAttribute('aria-invalid', 'true');
        if (!primero) primero = control;
      }
    });
    if (primero && primero.focus) primero.focus();
  }

  async function pedir(url, opciones) {
    var r = await fetch(url, opciones);
    if (r.status === 401) {
      window.location.href = '/admin/login?volver=' + encodeURIComponent(window.location.pathname);
      return null;
    }
    var j = await r.json().catch(function () {
      return null;
    });
    return j || { ok: false, error: 'No pudimos leer la respuesta del servidor' };
  }

  // --- Alta y edición -------------------------------------------------------

  function modoAlta() {
    if (campoId) campoId.value = '';
    if (titulo) titulo.textContent = tituloNuevo;
    if (cancelar) cancelar.hidden = true;
    var campos = forma.querySelectorAll('[data-campo]');
    for (var i = 0; i < campos.length; i++) campos[i].value = '';
    limpiar();
  }

  function modoEdicion(id, valores) {
    if (campoId) campoId.value = String(id);
    if (titulo) titulo.textContent = tituloEditar;
    if (cancelar) cancelar.hidden = false;
    limpiar();

    var campos = forma.querySelectorAll('[data-campo]');
    for (var i = 0; i < campos.length; i++) {
      var v = valores[campos[i].getAttribute('data-campo')];
      campos[i].value = v === null || v === undefined ? '' : String(v);
    }

    var primero = forma.querySelector('[data-campo]');
    if (primero && primero.focus) primero.focus();
    if (forma.scrollIntoView) forma.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (cancelar) cancelar.addEventListener('click', modoAlta);

  forma.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (trabajando) return;

    limpiar();
    trabajando = true;
    guardar.disabled = true;
    var etiqueta = guardar.textContent;
    guardar.textContent = 'Guardando…';

    var datos = {};
    var campos = forma.querySelectorAll('[data-campo]');
    for (var i = 0; i < campos.length; i++) {
      datos[campos[i].getAttribute('data-campo')] = campos[i].value;
    }

    var editando = campoId && campoId.value;

    try {
      var r = await pedir(editando ? base + '/' + campoId.value : base, {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!r) return;

      if (!r.ok) {
        trabajando = false;
        guardar.disabled = false;
        guardar.textContent = etiqueta;
        if (r.campos) pintarErrores(r.campos);
        fallar(errorForma, r.error || 'No pudimos guardar');
        return;
      }

      // Recargar en vez de redibujar la lista a mano: el conteo de uso lo
      // calcula el servidor, y mantenerlo acá sería tener dos verdades.
      window.location.reload();
    } catch {
      trabajando = false;
      guardar.disabled = false;
      guardar.textContent = etiqueta;
      fallar(errorForma, 'No pudimos conectar. Revisá tu conexión y probá de nuevo.');
    }
  });

  // --- Botones de la lista --------------------------------------------------

  seccion.addEventListener('click', async function (evento) {
    var fila = evento.target.closest('[data-item]');
    if (!fila) return;

    var id = fila.getAttribute('data-id');

    if (evento.target.closest('[data-editar]')) {
      var valores = {};
      try {
        valores = JSON.parse(fila.getAttribute('data-valores') || '{}');
      } catch {
        valores = {};
      }
      modoEdicion(id, valores);
      return;
    }

    var botonBorrar = evento.target.closest('[data-borrar]');
    if (!botonBorrar || botonBorrar.disabled || trabajando) return;

    // Se nombra lo que se va a borrar: "¿estás seguro?" no dice de qué.
    var nombre = (fila.querySelector('.truncate') || {}).textContent || 'esto';
    if (!window.confirm('Se va a borrar "' + nombre.trim() + '". ¿Seguimos?')) return;

    limpiar();
    trabajando = true;
    botonBorrar.disabled = true;

    try {
      var r = await pedir(base + '/' + id, { method: 'DELETE' });
      if (!r) return;

      if (!r.ok) {
        trabajando = false;
        botonBorrar.disabled = false;
        // Lo más probable es que haya propiedades que lo usan, y el mensaje
        // del servidor dice cuántas. No se traduce a "no se pudo".
        fallar(errorLista, r.error || 'No pudimos borrar');
        return;
      }

      // Un borrado no enciende el aviso global de "cambios sin publicar": ese
      // aviso se calcula con la fecha más nueva de cada tabla, y una fila
      // borrada no deja fecha. Así que se avisa acá, al volver.
      window.location.href = window.location.pathname + '?lista=' + catalogo + '&borrado=1';
    } catch {
      trabajando = false;
      botonBorrar.disabled = false;
      fallar(errorLista, 'No pudimos conectar. Probá de nuevo.');
    }
  });
})();
