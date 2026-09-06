/**
 * Filtrado del catálogo, en el navegador.
 *
 * Todas las propiedades ya están en el HTML: este archivo solo muestra y
 * oculta. Si no carga, se ven todas — nunca una página vacía.
 *
 * El estado vive en la dirección (`?zona=tulum&tipo=casa`), así que una
 * búsqueda se puede compartir, guardar en favoritos, y el botón "atrás"
 * funciona como se espera.
 */
(function () {
  'use strict';

  var form = document.querySelector('.buscador');
  var grilla = document.getElementById('grilla');
  var vacio = document.getElementById('sin-resultados');
  var contador = document.getElementById('contador-resultados');
  var palabra = document.getElementById('contador-palabra');
  var sufijo = document.getElementById('contador-sufijo');
  var aviso = document.getElementById('aviso-operacion');
  if (!form || !grilla) return;

  var resultados = Array.prototype.slice.call(grilla.querySelectorAll('.resultado'));

  var CAMPOS = ['zona', 'tipo', 'dormitorios', 'precio', 'operacion'];

  var NOMBRE_OPERACION = { venta: 'en venta', renta: 'en renta' };

  function leerParametros() {
    var params = new URLSearchParams(window.location.search);
    var estado = {};
    CAMPOS.forEach(function (campo) {
      estado[campo] = params.get(campo) || '';
    });
    return estado;
  }

  /** Vuelca el estado en los campos del formulario. */
  function aplicarAFormulario(estado) {
    CAMPOS.forEach(function (campo) {
      var control = form.elements[campo];
      if (control) control.value = estado[campo];
    });
  }

  function pasaFiltros(el, estado) {
    if (estado.zona && el.dataset.zona !== estado.zona) return false;
    if (estado.tipo && el.dataset.tipo !== estado.tipo) return false;
    if (estado.operacion && el.dataset.operacion !== estado.operacion) return false;

    if (estado.dormitorios) {
      var minimo = parseInt(estado.dormitorios, 10);
      if (parseInt(el.dataset.dormitorios || '0', 10) < minimo) return false;
    }

    if (estado.precio) {
      // Las propiedades "a consultar" no tienen precio: quedan fuera de
      // cualquier tramo, porque no se puede afirmar que entren en él.
      if (el.dataset.aConsultar === '1') return false;
      var precio = parseFloat(el.dataset.precio || '');
      if (isNaN(precio)) return false;

      var partes = estado.precio.split('-');
      var desde = partes[0] ? parseFloat(partes[0]) : 0;
      var hasta = partes[1] ? parseFloat(partes[1]) : Infinity;
      if (precio < desde || precio > hasta) return false;
    }

    return true;
  }

  function filtrar(estado, actualizarUrl) {
    var visibles = 0;

    resultados.forEach(function (el) {
      var pasa = pasaFiltros(el, estado);
      el.hidden = !pasa;
      if (pasa) visibles++;
    });

    // Contador
    if (contador) contador.textContent = String(visibles);
    if (palabra) palabra.textContent = visibles === 1 ? 'propiedad' : 'propiedades';
    if (sufijo) {
      var hayFiltro = CAMPOS.some(function (c) {
        return estado[c];
      });
      sufijo.textContent = hayFiltro
        ? visibles === 1
          ? 'coincide con tu búsqueda'
          : 'coinciden con tu búsqueda'
        : 'disponibles';
    }

    // Estado vacío
    if (vacio) vacio.hidden = visibles > 0;
    grilla.hidden = visibles === 0;

    // Aviso de operación, cuando se llega desde el hero
    if (aviso) {
      if (estado.operacion && NOMBRE_OPERACION[estado.operacion]) {
        aviso.hidden = false;
        aviso.textContent = 'Mostrando propiedades ' + NOMBRE_OPERACION[estado.operacion] + '.';
        var quitar = document.createElement('a');
        quitar.href = '/propiedades';
        quitar.textContent = ' Ver todas';
        quitar.className = 'text-rosa underline underline-offset-2';
        aviso.appendChild(quitar);
      } else {
        aviso.hidden = true;
      }
    }

    if (actualizarUrl) {
      var params = new URLSearchParams();
      CAMPOS.forEach(function (campo) {
        if (estado[campo]) params.set(campo, estado[campo]);
      });
      var url = params.toString() ? '?' + params.toString() : window.location.pathname;
      window.history.replaceState(null, '', url);
    }
  }

  function estadoDelFormulario() {
    var estado = {};
    CAMPOS.forEach(function (campo) {
      var control = form.elements[campo];
      estado[campo] = control ? control.value : '';
    });
    return estado;
  }

  // --- Arranque -------------------------------------------------------------

  var inicial = leerParametros();
  aplicarAFormulario(inicial);
  filtrar(inicial, false);

  // Filtrado instantáneo: no hace falta apretar "Buscar"
  form.addEventListener('change', function () {
    filtrar(estadoDelFormulario(), true);
  });

  // Con JavaScript no recarga; sin él, el formulario navega igual
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    filtrar(estadoDelFormulario(), true);
  });

  // El botón "atrás" del navegador vuelve a la búsqueda anterior
  window.addEventListener('popstate', function () {
    var estado = leerParametros();
    aplicarAFormulario(estado);
    filtrar(estado, false);
  });
})();
