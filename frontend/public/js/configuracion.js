/**
 * Configuración: guardar sin recargar y marcar los campos con problema.
 *
 * La pantalla **ya funciona sin este archivo**: es un formulario de verdad que
 * manda todo y el servidor devuelve la página. Lo único que se pierde sin
 * JavaScript es que, cuando un campo está mal, la recarga se lleva lo que se
 * acababa de escribir. Acá eso no pasa: los errores se marcan en su lugar y el
 * texto queda donde estaba.
 */
(function () {
  var forma = document.querySelector('[data-forma-config]');
  if (!forma) return;

  var boton = forma.querySelector('[data-guardar]');
  var aviso = forma.querySelector('[data-aviso]');
  var general = forma.querySelector('[data-error-general]');
  if (!boton) return;

  var guardando = false;

  function limpiarErrores() {
    var marcas = forma.querySelectorAll('[data-error-campo]');
    for (var i = 0; i < marcas.length; i++) {
      marcas[i].textContent = '';
      marcas[i].classList.add('hidden');
      var campo = forma.querySelector(
        '[name="' + marcas[i].getAttribute('data-error-campo') + '"]',
      );
      if (campo) {
        campo.classList.remove('border-red-400');
        campo.removeAttribute('aria-invalid');
      }
    }
    if (general) {
      general.textContent = '';
      general.classList.add('hidden');
    }
  }

  function mostrarErrores(campos) {
    var primero = null;
    for (var clave in campos) {
      if (!Object.prototype.hasOwnProperty.call(campos, clave)) continue;

      var marca = forma.querySelector('[data-error-campo="' + clave + '"]');
      if (marca) {
        marca.textContent = campos[clave];
        marca.classList.remove('hidden');
      }
      var campo = forma.querySelector('[name="' + clave + '"]');
      if (campo) {
        campo.classList.add('border-red-400');
        campo.setAttribute('aria-invalid', 'true');
        if (!primero) primero = campo;
      }
    }
    // Llevar la vista al primero: con cuatro secciones, un error puede quedar
    // fuera de la pantalla y el guardado parecería no haber hecho nada.
    if (primero && primero.focus) {
      primero.focus();
      if (primero.scrollIntoView) primero.scrollIntoView({ block: 'center' });
    }
  }

  function fallar(texto) {
    if (!general) return;
    general.textContent = texto;
    general.classList.remove('hidden');
  }

  forma.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (guardando) return;

    limpiarErrores();
    if (aviso) {
      aviso.textContent = '';
      aviso.classList.add('hidden');
    }

    guardando = true;
    boton.disabled = true;
    var etiqueta = boton.textContent;
    boton.textContent = 'Guardando…';

    var valores = {};
    var campos = forma.querySelectorAll('input[name], textarea[name]');
    for (var i = 0; i < campos.length; i++) valores[campos[i].name] = campos[i].value;

    try {
      var respuesta = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      });

      if (respuesta.status === 401) {
        window.location.href = '/admin/login?volver=/admin/configuracion';
        return;
      }

      var datos = await respuesta.json().catch(function () {
        return null;
      });

      if (!respuesta.ok || !datos || !datos.ok) {
        if (datos && datos.campos) mostrarErrores(datos.campos);
        fallar((datos && datos.error) || 'No pudimos guardar. Probá de nuevo.');
        return;
      }

      if (aviso) {
        aviso.textContent = datos.data && datos.data.cambios === 0 ? 'Sin cambios' : 'Guardado';
        aviso.classList.remove('hidden');
      }
    } catch {
      fallar('No pudimos guardar. Revisá la conexión y probá de nuevo.');
    } finally {
      guardando = false;
      boton.disabled = false;
      boton.textContent = etiqueta;
    }
  });
})();
