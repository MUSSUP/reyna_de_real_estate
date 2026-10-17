/**
 * El formulario de una noticia o un informe.
 *
 * Tres cosas: guardar contra la API, subir y quitar la imagen, y borrar el
 * artículo.
 *
 * **La imagen se guarda sola, en el momento, y por su propio endpoint.** Si
 * viajara con el resto del formulario, un error de validación en el título
 * haría perder una subida de varios megas — y eso no se puede repetir en
 * silencio.
 */
(function () {
  'use strict';

  var forma = document.querySelector('[data-forma-articulo]');
  if (!forma || typeof window.fetch !== 'function') return;

  var id = forma.getAttribute('data-id') || '';
  var esAlta = !id;

  var aviso = forma.querySelector('[data-aviso]');
  var general = forma.querySelector('[data-error-general]');
  var botones = forma.querySelectorAll('[data-guardar], [data-publicar], [data-despublicar]');
  var ocupadoAhora = false;

  // --- Mensajes -------------------------------------------------------------

  function limpiar() {
    if (aviso) aviso.textContent = '';
    if (general) {
      general.textContent = '';
      general.classList.add('hidden');
    }
    var huecos = forma.querySelectorAll('[data-error-de]');
    for (var i = 0; i < huecos.length; i++) {
      huecos[i].textContent = '';
      huecos[i].classList.add('hidden');
    }
    var campos = forma.querySelectorAll('[data-campo]');
    for (var j = 0; j < campos.length; j++) campos[j].removeAttribute('aria-invalid');
  }

  function fallar(texto) {
    if (!general) return;
    general.textContent = texto;
    general.classList.remove('hidden');
    general.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function decir(texto) {
    if (aviso) aviso.textContent = texto;
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
    // Llevar la vista al primero con problema: con un texto largo, un error en
    // el título queda fuera de la pantalla y parecería que no pasó nada.
    if (primero && primero.focus) {
      primero.focus();
      if (primero.scrollIntoView) primero.scrollIntoView({ block: 'center' });
    }
  }

  function ocupado(si, boton) {
    ocupadoAhora = si;
    for (var i = 0; i < botones.length; i++) botones[i].disabled = si;
    if (si && boton) {
      boton.setAttribute('data-texto', boton.textContent);
      boton.textContent = 'Guardando…';
    }
    if (!si) {
      for (var j = 0; j < botones.length; j++) {
        var t = botones[j].getAttribute('data-texto');
        if (t) botones[j].textContent = t;
      }
    }
  }

  // --- Guardar --------------------------------------------------------------

  function reunirDatos() {
    var d = {};
    var elementos = forma.elements;
    for (var i = 0; i < elementos.length; i++) {
      var el = elementos[i];
      if (!el.name || el.type === 'button' || el.type === 'submit' || el.type === 'file') continue;
      d[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    }
    return d;
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

  async function guardar(estado, boton) {
    if (ocupadoAhora) return;
    limpiar();
    ocupado(true, boton);

    var datos = reunirDatos();

    try {
      if (esAlta) {
        // Nace en borrador. Publicar es un segundo paso deliberado, y acá
        // todavía no tiene imagen ni sentido publicarlo.
        var creado = await pedir('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        });
        if (!creado) return;
        if (!creado.ok) {
          ocupado(false);
          if (creado.campos) pintarErrores(creado.campos);
          fallar(creado.error || 'No pudimos guardar');
          return;
        }
        window.location.replace('/admin/articulos/' + creado.data.id + '?creado=1');
        return;
      }

      if (estado) datos.status = estado;

      var r = await pedir('/api/admin/articles/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!r) return;

      ocupado(false);

      if (!r.ok) {
        if (r.campos) pintarErrores(r.campos);
        fallar(r.error || 'No pudimos guardar');
        return;
      }

      if (estado === 'publicado') {
        // Recargar: cambian el botón, el enlace "Ver en el sitio" y el estado.
        window.location.replace('/admin/articulos/' + id);
        return;
      }
      if (estado === 'borrador') {
        window.location.replace('/admin/articulos/' + id);
        return;
      }
      decir('Guardado.');
    } catch {
      ocupado(false);
      fallar('No pudimos conectar. Revisá tu conexión y probá de nuevo.');
    }
  }

  forma.addEventListener('submit', function (evento) {
    evento.preventDefault();
    guardar(null, forma.querySelector('[data-guardar]'));
  });

  var publicar = forma.querySelector('[data-publicar]');
  if (publicar) {
    publicar.addEventListener('click', function () {
      guardar('publicado', publicar);
    });
  }

  var despublicar = forma.querySelector('[data-despublicar]');
  if (despublicar) {
    despublicar.addEventListener('click', function () {
      guardar('borrador', despublicar);
    });
  }

  // --- La imagen ------------------------------------------------------------

  var entradaArchivo = forma.querySelector('[data-archivo-portada]');
  var avisoPortada = forma.querySelector('[data-aviso-portada]');

  function decirPortada(texto, mal) {
    if (!avisoPortada) return;
    avisoPortada.textContent = texto;
    avisoPortada.className = 'text-xs ' + (mal ? 'text-red-700' : 'text-verde');
    avisoPortada.classList.toggle('hidden', !texto);
  }

  if (entradaArchivo) {
    entradaArchivo.addEventListener('change', async function () {
      var archivo = entradaArchivo.files && entradaArchivo.files[0];
      if (!archivo) return;

      decirPortada('Subiendo…', false);

      var cuerpo = new FormData();
      cuerpo.append('archivo', archivo);

      try {
        var r = await pedir('/api/admin/articles/' + id + '/cover', {
          method: 'POST',
          body: cuerpo,
        });
        if (!r) return;
        if (!r.ok) {
          // El motivo viene del servidor y dice qué pasó con el archivo:
          // "no es una imagen", "pesa demasiado". No se traduce a "error".
          decirPortada(r.error || 'No pudimos subir la imagen', true);
          entradaArchivo.value = '';
          return;
        }
        // Recargar en vez de dibujar la vista a mano: así lo que se ve es lo
        // que quedó guardado, con las dimensiones que calculó el servidor.
        window.location.replace('/admin/articulos/' + id);
      } catch {
        decirPortada('No pudimos subir la imagen. Revisá tu conexión.', true);
        entradaArchivo.value = '';
      }
    });
  }

  var quitarPortada = forma.querySelector('[data-quitar-portada]');
  if (quitarPortada) {
    quitarPortada.addEventListener('click', async function () {
      if (!window.confirm('¿Quitamos la imagen de este artículo?')) return;
      decirPortada('Quitando…', false);
      try {
        var r = await pedir('/api/admin/articles/' + id + '/cover', { method: 'DELETE' });
        if (!r) return;
        if (!r.ok) {
          decirPortada(r.error || 'No pudimos quitar la imagen', true);
          return;
        }
        window.location.replace('/admin/articulos/' + id);
      } catch {
        decirPortada('No pudimos conectar. Probá de nuevo.', true);
      }
    });
  }

  // --- Vista previa ---------------------------------------------------------
  //
  // El texto lo parte el servidor con el mismo lector que usan las páginas
  // públicas (`/api/admin/preview`). Acá solo se dibuja un elemento por
  // bloque, **con `textContent`**: lo que se escribe en el panel nunca se
  // inserta como HTML, ni siquiera en una vista previa.

  var botonPrevia = forma.querySelector('[data-ver-previa]');
  var cajaPrevia = forma.querySelector('[data-previa]');
  var cuerpoPrevia = forma.querySelector('[data-previa-cuerpo]');
  var avisoPrevia = forma.querySelector('[data-aviso-previa]');

  /** Qué elemento y qué clases le toca a cada tipo de bloque. */
  var ESTILOS = {
    titulo: ['h2', 'font-titulo text-2xl text-verde'],
    pilar: ['h3', 'font-titulo text-xl text-verde'],
    cita: [
      'blockquote',
      'border-l-2 border-dorado py-1 pl-5 font-titulo text-lg italic text-verde',
    ],
    parrafo: ['p', 'text-[17px] leading-relaxed text-texto'],
  };

  function dibujarPrevia(bloques) {
    cuerpoPrevia.textContent = '';

    if (!bloques.length) {
      var vacio = document.createElement('p');
      vacio.className = 'text-sm text-texto-suave';
      vacio.textContent = 'Todavía no hay texto para mostrar.';
      cuerpoPrevia.appendChild(vacio);
      return;
    }

    for (var i = 0; i < bloques.length; i++) {
      var estilo = ESTILOS[bloques[i].tipo] || ESTILOS.parrafo;
      var el = document.createElement(estilo[0]);
      el.className = estilo[1];
      el.textContent = bloques[i].texto;
      cuerpoPrevia.appendChild(el);
    }
  }

  if (botonPrevia && cajaPrevia && cuerpoPrevia) {
    botonPrevia.hidden = false;

    botonPrevia.addEventListener('click', async function () {
      var campo = forma.querySelector('[data-campo="bodyEs"]');
      if (!campo) return;

      if (avisoPrevia) avisoPrevia.textContent = '';
      botonPrevia.disabled = true;

      try {
        var r = await pedir('/api/admin/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: campo.value }),
        });
        if (!r) return;
        if (!r.ok) {
          if (avisoPrevia) avisoPrevia.textContent = r.error || 'No pudimos armar la vista previa';
          return;
        }
        dibujarPrevia(r.data.bloques || []);
        cajaPrevia.hidden = false;
        if (cajaPrevia.scrollIntoView) {
          cajaPrevia.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } catch {
        if (avisoPrevia) avisoPrevia.textContent = 'No pudimos conectar. Probá de nuevo.';
      } finally {
        botonPrevia.disabled = false;
      }
    });
  }

  // --- Borrar ---------------------------------------------------------------

  var borrar = forma.querySelector('[data-borrar]');
  if (borrar) {
    borrar.addEventListener('click', async function () {
      // Se nombra lo que se va a borrar: "¿estás seguro?" no dice de qué.
      var titulo = (forma.querySelector('[data-campo="titleEs"]') || {}).value || 'este artículo';
      if (!window.confirm('Se va a borrar "' + titulo + '" y no se puede deshacer. ¿Seguimos?')) {
        return;
      }

      limpiar();
      borrar.disabled = true;
      try {
        var r = await pedir('/api/admin/articles/' + id, { method: 'DELETE' });
        if (!r) return;
        if (!r.ok) {
          borrar.disabled = false;
          fallar(r.error || 'No pudimos borrar el artículo');
          return;
        }
        window.location.replace('/admin/articulos?borrado=1');
      } catch {
        borrar.disabled = false;
        fallar('No pudimos conectar. Probá de nuevo.');
      }
    });
  }
})();
