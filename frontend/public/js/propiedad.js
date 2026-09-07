/**
 * El formulario de una propiedad.
 *
 * Hace dos cosas: mostrar de a una las pestañas, y guardar contra la API.
 *
 * Todos los campos existen siempre en el HTML aunque su pestaña esté oculta.
 * Es lo que permite que un error en "Datos" se pueda señalar y enfocar aunque
 * la clienta esté parada en "Textos" — y lo que hace que, sin este archivo,
 * se vean todas las secciones una debajo de la otra en vez de ninguna.
 */
(function () {
  'use strict';

  var formulario = document.querySelector('[data-formulario-propiedad]');
  if (!formulario || typeof window.fetch !== 'function') return;

  var id = formulario.getAttribute('data-id') || '';
  var aviso = formulario.querySelector('[data-aviso-propiedad]');
  var botones = formulario.querySelectorAll('[data-guardar]');

  // --- Pestañas -------------------------------------------------------------

  var listaPestanas = formulario.querySelector('[data-pestanas]');
  var pestanas = Array.prototype.slice.call(formulario.querySelectorAll('[data-pestana]'));
  var paneles = Array.prototype.slice.call(formulario.querySelectorAll('[data-panel]'));

  /**
   * La pestaña abierta vive en la dirección.
   *
   * Subir o borrar una foto recarga la página, y sin esto la operadora
   * volvía a "Datos" cada vez: cargaba una imagen desde "Material" y el
   * panel la mandaba al principio. Con la sección en la dirección, la
   * recarga la deja donde estaba.
   *
   * Se usa `replaceState` y no un salto: cambiar de pestaña no es navegar,
   * y no debería llenar el historial ni romper el botón "atrás".
   */
  function recordarEnLaDireccion(nombre) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('seccion', nombre);
      window.history.replaceState(null, '', url);
    } catch (e) {
      // Si el navegador no deja tocar el historial, la pestaña funciona
      // igual: solo se pierde al recargar.
    }
  }

  function mostrar(nombre, recordar) {
    pestanas.forEach(function (t) {
      t.setAttribute('aria-selected', t.getAttribute('data-pestana') === nombre ? 'true' : 'false');
    });
    paneles.forEach(function (s) {
      s.hidden = s.getAttribute('data-panel') !== nombre;
    });
    if (recordar !== false) recordarEnLaDireccion(nombre);
  }

  if (listaPestanas && pestanas.length) {
    listaPestanas.classList.remove('hidden');
    listaPestanas.classList.add('flex');

    // Los títulos de sección son para el camino sin script, donde no hay
    // pestañas y las secciones caen una debajo de otra. Con pestañas a la
    // vista repiten lo que ya dice la pestaña activa.
    formulario.querySelectorAll('[data-titulo-seccion]').forEach(function (h) {
      h.hidden = true;
    });

    pestanas.forEach(function (t) {
      t.addEventListener('click', function () {
        mostrar(t.getAttribute('data-pestana'));
      });
    });

    // Flechas para moverse entre pestañas, como espera un lector de pantalla.
    listaPestanas.addEventListener('keydown', function (e) {
      var i = pestanas.indexOf(document.activeElement);
      if (i === -1) return;
      var salto = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!salto) return;
      e.preventDefault();
      var siguiente = pestanas[(i + salto + pestanas.length) % pestanas.length];
      siguiente.focus();
      mostrar(siguiente.getAttribute('data-pestana'));
    });

    // Al cargar se respeta la sección de la dirección, si es una que existe.
    var pedida = null;
    try {
      pedida = new URL(window.location.href).searchParams.get('seccion');
    } catch (e) {
      pedida = null;
    }
    var existe = pestanas.some(function (t) {
      return t.getAttribute('data-pestana') === pedida;
    });
    mostrar(existe ? pedida : pestanas[0].getAttribute('data-pestana'), false);
  }

  /** Deja visible la pestaña que contiene un campo dado. */
  function irAlCampoConError(nombre) {
    var control = formulario.querySelector('[data-campo="' + nombre + '"]');
    if (!control) return;
    var panel = control.closest('[data-panel]');
    if (panel) mostrar(panel.getAttribute('data-panel'));
    control.focus();
  }

  // --- Errores --------------------------------------------------------------

  function limpiarErrores() {
    formulario.querySelectorAll('[data-error-de]').forEach(function (p) {
      p.textContent = '';
      p.classList.add('hidden');
    });
    formulario.querySelectorAll('[data-campo]').forEach(function (c) {
      c.removeAttribute('aria-invalid');
    });
    aviso.className = 'mt-6 hidden rounded-[var(--radius-campo)] px-4 py-3 text-sm';
    aviso.textContent = '';
  }

  function mostrarAviso(texto, tono) {
    aviso.textContent = texto;
    aviso.className =
      'mt-6 rounded-[var(--radius-campo)] px-4 py-3 text-sm ' +
      (tono === 'ok' ? 'bg-[#e4ede9] text-[#1e4f4c]' : 'bg-red-50 text-red-800');
    aviso.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function pintarErrores(campos) {
    var primero = null;
    Object.keys(campos).forEach(function (nombre) {
      if (!primero) primero = nombre;
      // El texto va con textContent: nunca se inserta HTML en la página.
      var hueco = formulario.querySelector('[data-error-de="' + nombre + '"]');
      if (hueco) {
        hueco.textContent = campos[nombre];
        hueco.classList.remove('hidden');
      }
      var control = formulario.querySelector('[data-campo="' + nombre + '"]');
      if (control) control.setAttribute('aria-invalid', 'true');
    });
    if (primero) irAlCampoConError(primero);
  }

  // --- Guardar --------------------------------------------------------------

  function reunirDatos() {
    var d = {};
    var elementos = formulario.elements;

    for (var i = 0; i < elementos.length; i++) {
      var el = elementos[i];
      if (!el.name || el.type === 'button' || el.type === 'submit') continue;

      if (el.name === 'amenityIds') {
        if (!d.amenityIds) d.amenityIds = [];
        if (el.checked) d.amenityIds.push(Number(el.value));
        continue;
      }

      d[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    }

    if (!d.amenityIds) d.amenityIds = [];
    return d;
  }

  function ocupado(si, boton) {
    botones.forEach(function (b) {
      b.disabled = si;
    });
    if (boton) boton.setAttribute('data-texto', boton.textContent);
    if (si && boton) boton.textContent = 'Guardando…';
    if (!si) {
      botones.forEach(function (b) {
        var t = b.getAttribute('data-texto');
        if (t) b.textContent = t;
      });
    }
  }

  botones.forEach(function (boton) {
    boton.addEventListener('click', function () {
      limpiarErrores();
      var estado = boton.getAttribute('data-guardar');
      var datos = reunirDatos();

      ocupado(true, boton);

      // Al crear, primero se da de alta y después se publica: el alta siempre
      // nace en borrador, así que publicar es un segundo paso deliberado.
      var alta = !id;
      var url = alta ? '/api/admin/properties' : '/api/admin/properties/' + id;
      var metodo = alta ? 'POST' : 'PATCH';
      if (!alta) datos.status = estado;

      fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { estado: r.status, datos: j };
          });
        })
        .then(function (res) {
          if (!res.datos.ok) {
            ocupado(false);
            if (res.datos.campos) pintarErrores(res.datos.campos);
            mostrarAviso(res.datos.error || 'No pudimos guardar', 'error');
            return null;
          }

          if (!alta) {
            ocupado(false);
            mostrarAviso(
              estado === 'publicado' ? 'Publicada. Ya se ve en el sitio.' : 'Borrador guardado.',
              'ok',
            );
            return null;
          }

          // Recién creada: si pidió publicar, se publica ahora.
          var nuevoId = res.datos.data.id;
          if (estado !== 'publicado') {
            window.location.replace('/admin/propiedades/' + nuevoId + '?guardada=1');
            return null;
          }

          return fetch('/api/admin/properties/' + nuevoId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'publicado' }),
          })
            .then(function (r) {
              return r.json();
            })
            .then(function (j) {
              ocupado(false);
              if (j.ok) {
                window.location.replace('/admin/propiedades/' + nuevoId + '?publicada=1');
                return;
              }
              // Se creó pero no se pudo publicar: lo más común es que falte
              // la imagen. Hay que decir las dos cosas, o parece que se perdió.
              window.location.replace(
                '/admin/propiedades/' +
                  nuevoId +
                  '?guardada=1&sinpublicar=' +
                  encodeURIComponent(j.error || ''),
              );
            });
        })
        .catch(function () {
          ocupado(false);
          mostrarAviso('No pudimos conectar. Revisá tu conexión y probá de nuevo.', 'error');
        });
    });
  });
})();
