/**
 * Portada y galería en el panel.
 *
 * Todo lo de esta pantalla guarda **solo**, sin botón: subir, reordenar,
 * describir y borrar son acciones completas en sí mismas. Un "guardar" aparte
 * para el orden de las fotos es una trampa — se reordena, se sale, y se
 * perdió.
 */
(function () {
  'use strict';

  var raiz = document.querySelector('[data-galeria]');
  if (!raiz || typeof window.fetch !== 'function') return;

  var id = raiz.getAttribute('data-propiedad');
  var lista = raiz.querySelector('[data-lista-galeria]');
  var aviso = raiz.querySelector('[data-aviso-galeria]');
  var zona = raiz.querySelector('[data-soltar]');

  function mostrar(texto, tono) {
    aviso.textContent = texto;
    aviso.className =
      'mt-3 rounded-[var(--radius-campo)] px-4 py-3 text-sm ' +
      (tono === 'ok' ? 'bg-[#e4ede9] text-[#1e4f4c]' : 'bg-red-50 text-red-800');
  }

  function limpiarAviso() {
    aviso.className = 'mt-3 hidden rounded-[var(--radius-campo)] px-4 py-3 text-sm';
    aviso.textContent = '';
  }

  /** Tras cualquier cambio en el almacenamiento, la página se vuelve a pedir:
   *  reconstruir las miniaturas a mano acá sería duplicar lo que ya hace el
   *  servidor, y quedaría desincronizado a la primera. */
  function recargar() {
    window.location.reload();
  }

  // --- Imagen principal -----------------------------------------------------

  var entradaPortada = raiz.querySelector('[data-subir-portada]');
  if (entradaPortada) {
    entradaPortada.addEventListener('change', function () {
      if (!entradaPortada.files || !entradaPortada.files[0]) return;
      limpiarAviso();
      mostrar('Subiendo la imagen principal…', 'ok');

      var datos = new FormData();
      datos.append('archivo', entradaPortada.files[0]);

      fetch('/api/admin/properties/' + id + '/cover', { method: 'POST', body: datos })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (j.ok) return recargar();
          mostrar(j.error || 'No pudimos subir la imagen', 'error');
        })
        .catch(function () {
          mostrar('No pudimos conectar. Probá de nuevo.', 'error');
        });
    });
  }

  var botonBorrarPortada = raiz.querySelector('[data-borrar-portada]');
  if (botonBorrarPortada) {
    botonBorrarPortada.addEventListener('click', function () {
      limpiarAviso();
      fetch('/api/admin/properties/' + id + '/cover', { method: 'DELETE' })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (j.ok) return recargar();
          mostrar(j.error || 'No pudimos quitar la imagen', 'error');
        })
        .catch(function () {
          mostrar('No pudimos conectar. Probá de nuevo.', 'error');
        });
    });
  }

  // --- Subir a la galería ---------------------------------------------------

  function subirGaleria(archivos) {
    if (!archivos || !archivos.length) return;
    limpiarAviso();
    mostrar('Subiendo ' + archivos.length + (archivos.length === 1 ? ' foto…' : ' fotos…'), 'ok');

    var datos = new FormData();
    for (var i = 0; i < archivos.length; i++) datos.append('archivos', archivos[i]);

    fetch('/api/admin/properties/' + id + '/images', { method: 'POST', body: datos })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (!j.ok) {
          mostrar(j.error || 'No pudimos subir las fotos', 'error');
          return;
        }
        // Si entraron menos de las pedidas, hay que decirlo: si no, la
        // clienta cuenta las miniaturas y no entiende qué pasó.
        if (j.data && j.data.agregadas < j.data.pedidas) {
          var perdidas = j.data.pedidas - j.data.agregadas;
          window.sessionStorage.setItem(
            'aviso-galeria',
            'Se subieron ' +
              j.data.agregadas +
              ' de ' +
              j.data.pedidas +
              '. ' +
              (perdidas === 1
                ? 'Una no era una imagen válida.'
                : perdidas + ' no eran imágenes válidas.'),
          );
        }
        recargar();
      })
      .catch(function () {
        mostrar('No pudimos conectar. Probá de nuevo.', 'error');
      });
  }

  var entradaGaleria = raiz.querySelector('[data-subir-galeria]');
  if (entradaGaleria) {
    entradaGaleria.addEventListener('change', function () {
      subirGaleria(entradaGaleria.files);
    });
  }

  if (zona) {
    ['dragenter', 'dragover'].forEach(function (evento) {
      zona.addEventListener(evento, function (e) {
        e.preventDefault();
        zona.classList.add('border-rosa');
      });
    });
    ['dragleave', 'drop'].forEach(function (evento) {
      zona.addEventListener(evento, function (e) {
        e.preventDefault();
        zona.classList.remove('border-rosa');
      });
    });
    zona.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) subirGaleria(e.dataTransfer.files);
    });
  }

  // Un aviso que sobrevivió a la recarga.
  var pendiente = window.sessionStorage.getItem('aviso-galeria');
  if (pendiente) {
    window.sessionStorage.removeItem('aviso-galeria');
    mostrar(pendiente, 'error');
  }

  // --- Orden y descripciones ------------------------------------------------

  function filas() {
    return Array.prototype.slice.call(lista.querySelectorAll('[data-imagen]'));
  }

  function renumerar() {
    filas().forEach(function (fila, i) {
      var n = fila.querySelector('[data-posicion]');
      if (n) n.textContent = String(i + 1);
    });
  }

  var guardadoPendiente = null;
  function guardarOrden() {
    // Se agrupa: arrastrar y soltar dispara varios cambios seguidos, y no
    // tiene sentido mandar uno por cada micro-movimiento.
    if (guardadoPendiente) window.clearTimeout(guardadoPendiente);
    guardadoPendiente = window.setTimeout(function () {
      var imagenes = filas().map(function (f) {
        var campo = f.querySelector('[data-alt]');
        return { id: f.getAttribute('data-imagen'), alt: campo ? campo.value : '' };
      });

      fetch('/api/admin/properties/' + id + '/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenes: imagenes }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (j.ok) mostrar('Guardado.', 'ok');
          else mostrar('No pudimos guardar el orden', 'error');
        })
        .catch(function () {
          mostrar('No pudimos guardar el orden. Revisá tu conexión.', 'error');
        });
    }, 600);
  }

  if (lista) {
    lista.addEventListener('input', function (e) {
      if (e.target && e.target.hasAttribute('data-alt')) guardarOrden();
    });

    lista.addEventListener('click', function (e) {
      var fila = e.target.closest ? e.target.closest('[data-imagen]') : null;
      if (!fila) return;

      if (e.target.hasAttribute('data-subir-uno')) {
        var anterior = fila.previousElementSibling;
        if (anterior) {
          lista.insertBefore(fila, anterior);
          fila.querySelector('[data-subir-uno]').focus();
          renumerar();
          guardarOrden();
        }
        return;
      }

      if (e.target.hasAttribute('data-bajar-uno')) {
        var siguiente = fila.nextElementSibling;
        if (siguiente) {
          lista.insertBefore(siguiente, fila);
          fila.querySelector('[data-bajar-uno]').focus();
          renumerar();
          guardarOrden();
        }
        return;
      }

      if (e.target.hasAttribute('data-borrar-imagen')) {
        var idImagen = fila.getAttribute('data-imagen');
        limpiarAviso();
        fetch('/api/admin/properties/' + id + '/images?imagen=' + encodeURIComponent(idImagen), {
          method: 'DELETE',
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (j) {
            if (j.ok) return recargar();
            mostrar(j.error || 'No pudimos borrar la imagen', 'error');
          })
          .catch(function () {
            mostrar('No pudimos conectar. Probá de nuevo.', 'error');
          });
      }
    });

    // Arrastrar para reordenar. Los botones hacen lo mismo con teclado.
    var arrastrada = null;

    lista.addEventListener('dragstart', function (e) {
      arrastrada = e.target.closest('[data-imagen]');
      if (arrastrada) arrastrada.classList.add('opacity-50');
    });

    lista.addEventListener('dragend', function () {
      if (arrastrada) arrastrada.classList.remove('opacity-50');
      arrastrada = null;
    });

    lista.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!arrastrada) return;
      var sobre = e.target.closest ? e.target.closest('[data-imagen]') : null;
      if (!sobre || sobre === arrastrada) return;

      var caja = sobre.getBoundingClientRect();
      var despues = e.clientY > caja.top + caja.height / 2;
      lista.insertBefore(arrastrada, despues ? sobre.nextSibling : sobre);
    });

    lista.addEventListener('drop', function (e) {
      e.preventDefault();
      renumerar();
      guardarOrden();
    });
  }
})();
