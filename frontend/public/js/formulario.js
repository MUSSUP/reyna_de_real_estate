/**
 * Mejora del formulario de consulta.
 *
 * El formulario ya funciona sin esto: tiene `action` y `method`, y el servidor
 * responde con una redirección. Lo que suma acá es no recargar la página y
 * mostrar los errores al lado de cada campo.
 *
 * Por eso todo está envuelto de forma que, si algo falla, el envío normal del
 * navegador sigue disponible. **Nunca se debe perder una consulta por culpa
 * de este archivo.**
 */
(function () {
  'use strict';

  var formulario = document.querySelector('[data-formulario-consulta]');
  if (!formulario) return;

  // Sin este archivo, la validación del navegador es la única que avisa antes
  // de enviar, así que el HTML no lleva `novalidate`. Se lo ponemos acá: desde
  // ahora los errores los mostramos nosotros, al lado de cada campo.
  formulario.noValidate = true;

  var aviso = document.querySelector('[data-aviso-consulta]');
  var gracias = document.querySelector('[data-gracias-consulta]');
  var boton = formulario.querySelector('[data-enviar-consulta]');
  var textoBoton = boton ? boton.textContent : '';

  /** Cada campo del esquema, con el id del control que lo muestra. */
  var CAMPOS = {
    name: 'consulta-nombre',
    email: 'consulta-email',
    phone: 'consulta-telefono',
    interest: 'consulta-interes',
    message: 'consulta-mensaje',
  };

  function idError(idCampo) {
    return idCampo + '-error';
  }

  /** Borra los errores de la pasada anterior. */
  function limpiarErrores() {
    Object.keys(CAMPOS).forEach(function (campo) {
      var control = document.getElementById(CAMPOS[campo]);
      var error = document.getElementById(idError(CAMPOS[campo]));
      if (control) control.removeAttribute('aria-invalid');
      if (error) error.remove();
    });
    if (aviso) {
      aviso.classList.add('hidden');
      aviso.classList.remove('flex');
      aviso.textContent = '';
    }
  }

  /**
   * Pinta el error debajo de su campo.
   *
   * El texto se escribe con `textContent`, nunca con `innerHTML`: aunque estos
   * mensajes los produce nuestro servidor, meter texto como HTML en la página
   * es exactamente el hábito que abre un XSS el día que la fuente cambie.
   */
  function mostrarError(campo, mensaje) {
    var idCampo = CAMPOS[campo];
    if (!idCampo) return;

    var control = document.getElementById(idCampo);
    if (!control) return;

    control.setAttribute('aria-invalid', 'true');
    control.classList.add('border-red-600');

    var parrafo = document.createElement('p');
    parrafo.id = idError(idCampo);
    parrafo.className = 'flex items-start gap-1.5 text-sm text-red-700';

    var icono = document.createElement('span');
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = '⚠';

    var texto = document.createElement('span');
    texto.textContent = mensaje;

    parrafo.appendChild(icono);
    parrafo.appendChild(texto);
    control.parentNode.appendChild(parrafo);

    // El campo queda enlazado con su error para los lectores de pantalla.
    control.setAttribute('aria-describedby', parrafo.id);
  }

  function mostrarAviso(mensaje) {
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.classList.remove('hidden');
    aviso.classList.add('flex');
    aviso.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function ocupado(si) {
    if (!boton) return;
    boton.disabled = si;
    boton.textContent = si ? 'Enviando…' : textoBoton;
  }

  formulario.addEventListener('submit', function (evento) {
    // Sin `fetch` no se intercepta nada: que lo envíe el navegador.
    if (typeof window.fetch !== 'function') return;

    evento.preventDefault();
    limpiarErrores();

    // Primero la validación del propio navegador: es instantánea y no
    // consume un envío contra el límite del servidor.
    if (!formulario.checkValidity()) {
      var invalido = formulario.querySelector(':invalid');
      if (invalido) {
        invalido.focus();
        var campo = Object.keys(CAMPOS).find(function (c) {
          return CAMPOS[c] === invalido.id;
        });
        if (campo) mostrarError(campo, invalido.validationMessage);
      }
      return;
    }

    ocupado(true);

    var cuerpo = {};
    new FormData(formulario).forEach(function (valor, clave) {
      cuerpo[clave] = valor;
    });

    fetch(formulario.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
      .then(function (respuesta) {
        return respuesta
          .json()
          .catch(function () {
            return { ok: respuesta.ok };
          })
          .then(function (datos) {
            return { estado: respuesta.status, datos: datos };
          });
      })
      .then(function (resultado) {
        ocupado(false);

        if (resultado.datos && resultado.datos.ok) {
          formulario.hidden = true;
          if (gracias) {
            gracias.hidden = false;
            gracias.setAttribute('tabindex', '-1');
            gracias.focus();
            gracias.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          return;
        }

        var campos = (resultado.datos && resultado.datos.campos) || null;
        if (campos) {
          Object.keys(campos).forEach(function (campo) {
            mostrarError(campo, campos[campo]);
          });
          var primero = document.getElementById(CAMPOS[Object.keys(campos)[0]]);
          if (primero) primero.focus();
        }

        mostrarAviso(
          (resultado.datos && resultado.datos.error) ||
            'No pudimos enviar tu consulta. Escribinos por WhatsApp y te respondemos enseguida.',
        );
      })
      .catch(function () {
        // Sin conexión, o el servidor no respondió. La consulta no llegó, así
        // que hay que decirlo claro y ofrecer la otra puerta.
        ocupado(false);
        mostrarAviso(
          'No pudimos enviar tu consulta. Revisá tu conexión, o escribinos por WhatsApp y te respondemos enseguida.',
        );
      });
  });
})();
