/**
 * Destacadas: elegir y ordenar lo que se ve en la portada.
 *
 * La pantalla **ya funciona sin este archivo**: cada botón es un `submit` que
 * manda la lista y el movimiento, y el servidor guarda y devuelve la página.
 * Acá se agregan tres cosas encima: mover sin recargar, arrastrar, y juntar
 * varios movimientos en un solo guardado.
 *
 * Nada de esto reconstruye filas. Mover una propiedad de una lista a la otra
 * es mover el mismo nodo: los botones que corresponden los decide el CSS
 * según la lista que la contiene.
 */
(function () {
  var forma = document.querySelector('[data-forma]');
  if (!forma) return;

  var portada = document.querySelector('[data-lista="portada"]');
  var disponibles = document.querySelector('[data-lista="disponibles"]');
  var campoOrden = forma.querySelector('[data-orden]');
  var botonGuardar = document.querySelector('[data-guardar]');
  var aviso = document.querySelector('[data-aviso]');
  var cajaError = document.querySelector('[data-error]');
  var resumen = document.querySelector('[data-resumen]');
  var avisoLargo = document.querySelector('[data-aviso-largo]');
  if (!portada || !disponibles || !campoOrden || !botonGuardar) return;

  var sugeridas = Number((avisoLargo && avisoLargo.getAttribute('data-sugeridas')) || 8);
  var guardado = idsDe(portada).join(',');
  var guardando = false;

  // Desde acá los botones no recargan: el guardado lo hace este archivo.
  forma.setAttribute('data-con-js', '');
  botonGuardar.hidden = false;
  botonGuardar.disabled = true;
  mostrarAgarres();

  function idsDe(lista) {
    var ids = [];
    var filas = lista.querySelectorAll('[data-fila]');
    for (var i = 0; i < filas.length; i++) {
      var id = filas[i].getAttribute('data-id');
      if (id) ids.push(id);
    }
    return ids;
  }

  function mostrarAgarres() {
    var agarres = portada.querySelectorAll('[data-agarre]');
    for (var i = 0; i < agarres.length; i++) agarres[i].classList.remove('hidden');
  }

  /** Numera, habilita o deshabilita las flechas y acomoda los textos. */
  function redibujar() {
    var filas = portada.querySelectorAll('[data-fila]');

    for (var i = 0; i < filas.length; i++) {
      var pos = filas[i].querySelector('[data-posicion]');
      if (pos) pos.textContent = String(i + 1);

      var subir = filas[i].querySelector('[data-subir]');
      var bajar = filas[i].querySelector('[data-bajar]');
      if (subir) subir.disabled = i === 0;
      if (bajar) bajar.disabled = i === filas.length - 1;

      var agarre = filas[i].querySelector('[data-agarre]');
      if (agarre) agarre.classList.remove('hidden');
    }

    // Las de la otra columna no tienen posición ni flechas visibles, pero sí
    // pueden quedar con `disabled` de cuando estaban en la portada.
    var fuera = disponibles.querySelectorAll('[data-fila]');
    for (var j = 0; j < fuera.length; j++) {
      var s = fuera[j].querySelector('[data-subir]');
      var b = fuera[j].querySelector('[data-bajar]');
      if (s) s.disabled = false;
      if (b) b.disabled = false;
    }

    var n = filas.length;
    if (resumen) {
      resumen.textContent =
        n === 0
          ? 'La portada no tiene ninguna propiedad destacada'
          : n + (n === 1 ? ' propiedad' : ' propiedades') + ' en la portada';
    }

    alternar('[data-vacio="portada"]', n === 0);
    alternar('[data-vacio="disponibles"]', fuera.length === 0);

    if (avisoLargo) {
      var cuantas = avisoLargo.querySelector('[data-cuantas]');
      if (cuantas) cuantas.textContent = String(n);
      avisoLargo.classList.toggle('hidden', n <= sugeridas);
    }

    var ahora = idsDe(portada).join(',');
    campoOrden.value = ahora;
    botonGuardar.disabled = guardando || ahora === guardado;
  }

  function alternar(selector, mostrar) {
    var el = document.querySelector(selector);
    if (el) el.classList.toggle('hidden', !mostrar);
  }

  function limpiarMensajes() {
    if (cajaError) {
      cajaError.classList.add('hidden');
      cajaError.textContent = '';
    }
    if (aviso) {
      aviso.classList.add('hidden');
      aviso.textContent = '';
    }
  }

  function fallar(texto) {
    if (!cajaError) return;
    cajaError.textContent = texto;
    cajaError.classList.remove('hidden');
  }

  // --- Los cuatro movimientos ----------------------------------------------

  forma.addEventListener('click', function (evento) {
    var boton = evento.target.closest('[data-subir], [data-bajar], [data-quitar], [data-agregar]');
    if (!boton || boton.disabled) return;

    evento.preventDefault();
    limpiarMensajes();

    var fila = boton.closest('[data-fila]');
    if (!fila) return;

    if (boton.hasAttribute('data-subir')) {
      var anterior = fila.previousElementSibling;
      if (anterior) portada.insertBefore(fila, anterior);
    } else if (boton.hasAttribute('data-bajar')) {
      var siguiente = fila.nextElementSibling;
      if (siguiente) portada.insertBefore(siguiente, fila);
    } else if (boton.hasAttribute('data-quitar')) {
      disponibles.insertBefore(fila, disponibles.firstChild);
    } else {
      portada.appendChild(fila);
    }

    redibujar();
  });

  // --- Arrastrar ------------------------------------------------------------
  //
  // Es una comodidad, no el mecanismo: en pantallas táctiles esta API no
  // dispara nada, y ahí las flechas son todo lo que hay. Por eso las flechas
  // no se esconden cuando el arrastre está disponible.

  var arrastrada = null;

  forma.addEventListener('dragstart', function (evento) {
    var fila = evento.target.closest('[data-fila]');
    if (!fila) return;
    arrastrada = fila;
    fila.setAttribute('data-arrastrando', '');
    if (evento.dataTransfer) {
      evento.dataTransfer.effectAllowed = 'move';
      // Firefox no arranca el arrastre si no se escribe algo.
      evento.dataTransfer.setData('text/plain', fila.getAttribute('data-id') || '');
    }
  });

  forma.addEventListener('dragend', function () {
    if (arrastrada) arrastrada.removeAttribute('data-arrastrando');
    arrastrada = null;
    portada.removeAttribute('data-encima');
    disponibles.removeAttribute('data-encima');
  });

  forma.addEventListener('dragover', function (evento) {
    if (!arrastrada) return;
    var lista = evento.target.closest('[data-lista]');
    if (!lista) return;

    evento.preventDefault();
    if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'move';

    portada.toggleAttribute('data-encima', lista === portada);
    disponibles.toggleAttribute('data-encima', lista === disponibles);

    var sobre = evento.target.closest('[data-fila]');
    if (!sobre || sobre === arrastrada) {
      if (!sobre) lista.appendChild(arrastrada);
      return;
    }

    // La mitad de arriba inserta antes; la de abajo, después. Sin esto la
    // fila salta de lugar con el mínimo movimiento del puntero.
    var caja = sobre.getBoundingClientRect();
    var arriba = evento.clientY < caja.top + caja.height / 2;
    lista.insertBefore(arrastrada, arriba ? sobre : sobre.nextElementSibling);
  });

  forma.addEventListener('drop', function (evento) {
    if (!arrastrada) return;
    evento.preventDefault();
    portada.removeAttribute('data-encima');
    disponibles.removeAttribute('data-encima');
    limpiarMensajes();
    redibujar();
  });

  // --- Guardar --------------------------------------------------------------

  forma.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (guardando) return;

    limpiarMensajes();
    guardando = true;
    botonGuardar.disabled = true;
    var texto = botonGuardar.textContent;
    botonGuardar.textContent = 'Guardando…';

    var ids = idsDe(portada);

    try {
      var respuesta = await fetch('/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids }),
      });

      if (respuesta.status === 401) {
        // La sesión se venció mientras la pantalla estaba abierta. Se manda al
        // ingreso con la vuelta puesta, para no perder de vista dónde estaba.
        window.location.href = '/admin/login?volver=/admin/destacadas';
        return;
      }

      var datos = await respuesta.json().catch(function () {
        return null;
      });

      if (!respuesta.ok || !datos || !datos.ok) {
        fallar((datos && datos.error) || 'No pudimos guardar el orden. Probá de nuevo.');
        return;
      }

      guardado = ids.join(',');
      if (aviso) {
        aviso.textContent =
          datos.data && datos.data.cambios === 0 ? 'Sin cambios' : 'Orden guardado';
        aviso.classList.remove('hidden');
      }
    } catch {
      fallar('No pudimos guardar el orden. Revisá la conexión y probá de nuevo.');
    } finally {
      guardando = false;
      botonGuardar.textContent = texto;
      redibujar();
    }
  });

  /**
   * Avisar antes de perder un orden sin guardar.
   *
   * Sin esto, arrastrar seis propiedades y cerrar la pestaña no deja ningún
   * rastro de que había algo pendiente.
   */
  window.addEventListener('beforeunload', function (evento) {
    if (guardando || idsDe(portada).join(',') === guardado) return;
    evento.preventDefault();
    evento.returnValue = '';
  });

  redibujar();
})();
