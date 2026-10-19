/**
 * El botón "Publicar cambios" y su estado.
 *
 * El sitio público es estático: lo que se guarda en el panel no se ve hasta
 * que se regenera. Este archivo es el único lugar donde eso se le explica a
 * la operadora, así que **el estado tiene que ser honesto**: si no se puede
 * publicar, decirlo; si está en camino, decir cuánto falta; y avisar recién
 * cuando el cambio está de verdad en vivo.
 */
(function () {
  'use strict';

  var caja = document.querySelector('[data-publicacion]');
  if (!caja || typeof window.fetch !== 'function') return;

  var boton = caja.querySelector('[data-publicar]');
  var texto = caja.querySelector('[data-estado-publicacion]');
  var cupo = caja.querySelector('[data-cupo-publicacion]');

  var vigilando = null;
  var marcaAlPublicar = null;

  function decir(mensaje, tono) {
    texto.textContent = mensaje;
    texto.className =
      'text-xs ' +
      (tono === 'pendiente'
        ? 'font-semibold text-[#8a6a28]'
        : tono === 'ok'
          ? 'text-[#1e4f4c]'
          : 'text-texto-suave');
  }

  function mostrarBoton(visible) {
    boton.hidden = !visible;
  }

  /** La fecha de generación del sitio en vivo. Cambia con cada publicación. */
  function marcaDelSitio() {
    return fetch('/build.json', { cache: 'no-store' })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        return j && j.generado ? j.generado : null;
      })
      .catch(function () {
        return null;
      });
  }

  function consultarEstado() {
    return fetch('/api/admin/publish', { cache: 'no-store' })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        return j && j.ok ? j.data : null;
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * Cuántas publicaciones se usaron del mes.
   *
   * El plan tiene un tope y hasta ahora no se veía: se agotó sin aviso y el
   * botón dejó de hacer efecto, sin que nada lo explicara. Mostrarlo no
   * impide nada — solo deja decidir con el dato a la vista.
   */
  function pintarCupo(estado) {
    if (!cupo) return;

    var usadas = estado.publicacionesUsadas;
    var tope = estado.publicacionesDelPlan;
    if (typeof usadas !== 'number' || typeof tope !== 'number' || tope <= 0) {
      cupo.classList.add('hidden');
      return;
    }

    var quedan = Math.max(tope - usadas, 0);
    cupo.classList.remove('hidden');

    if (quedan === 0) {
      cupo.textContent = 'Sin publicaciones disponibles este mes';
      cupo.className = 'text-xs font-semibold text-red-700';
      return;
    }

    cupo.textContent =
      quedan === 1
        ? 'Te queda 1 publicación este mes'
        : 'Te quedan ' + quedan + ' publicaciones este mes';

    // Se tiñe solo cuando conviene mirarlo: con el cupo holgado es un dato
    // más, y un color de alerta permanente deja de significar nada.
    cupo.className =
      'text-xs ' + (quedan <= 5 ? 'font-semibold text-[#8a6a28]' : 'text-texto-suave');
  }

  function pintar(estado) {
    if (!estado) return;
    caja.hidden = false;
    pintarCupo(estado);

    if (!estado.configurado) {
      // No se ofrece un botón que no puede funcionar.
      decir('Publicación automática sin configurar', 'aviso');
      mostrarBoton(false);
      return;
    }

    if (estado.publicando) {
      decir('Publicando…', 'aviso');
      mostrarBoton(false);
      return;
    }

    if (estado.hayCambiosSinPublicar) {
      decir('Hay cambios sin publicar', 'pendiente');
      mostrarBoton(true);
      boton.disabled = false;
      return;
    }

    decir('Todo publicado', 'ok');
    mostrarBoton(false);
  }

  /**
   * Espera a que el sitio en vivo cambie de fecha.
   *
   * Se mira el sitio y no la API de Netlify a propósito: que el build haya
   * terminado no es lo mismo que el visitante ya lo vea, y lo segundo es lo
   * que importa.
   */
  function vigilarHastaQueEsteEnVivo(marcaPrevia) {
    var intentos = 0;
    if (vigilando) window.clearInterval(vigilando);

    vigilando = window.setInterval(function () {
      intentos++;
      if (intentos > 60) {
        // Cinco minutos. Puede haber fallado el build; no se afirma que salió.
        window.clearInterval(vigilando);
        decir('Está tardando más de lo normal', 'aviso');
        mostrarBoton(true);
        boton.disabled = false;
        return;
      }

      marcaDelSitio().then(function (ahora) {
        if (!ahora || ahora === marcaPrevia) return;
        window.clearInterval(vigilando);
        decir('Publicado. Ya se ve en el sitio', 'ok');
        mostrarBoton(false);
      });
    }, 5000);
  }

  boton.addEventListener('click', function () {
    boton.disabled = true;
    decir('Pidiendo la actualización…', 'aviso');

    marcaDelSitio().then(function (previa) {
      marcaAlPublicar = previa;

      fetch('/api/admin/publish', { method: 'POST' })
        .then(function (r) {
          return r.json().then(function (j) {
            return { estado: r.status, datos: j };
          });
        })
        .then(function (res) {
          if (!res.datos.ok) {
            decir(res.datos.error || 'No pudimos publicar', 'pendiente');
            boton.disabled = false;
            return;
          }

          decir(
            res.datos.data.yaEstaba
              ? 'Ya había una publicación en camino'
              : 'Publicando… tarda un par de minutos',
            'aviso',
          );
          mostrarBoton(false);
          vigilarHastaQueEsteEnVivo(marcaAlPublicar);
        })
        .catch(function () {
          decir('No pudimos conectar. Probá de nuevo.', 'pendiente');
          boton.disabled = false;
        });
    });
  });

  consultarEstado().then(function (estado) {
    pintar(estado);
    // Si al entrar ya había una publicación corriendo, se sigue esperando.
    if (estado && estado.publicando) {
      marcaDelSitio().then(vigilarHastaQueEsteEnVivo);
    }
  });
})();
