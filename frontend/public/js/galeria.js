/**
 * Vista a pantalla completa de la galería.
 *
 * Es una mejora: sin este archivo la galería se recorre igual con el dedo, con
 * las miniaturas y con el teclado. Solo agrega la posibilidad de ampliar.
 *
 * Se usa <dialog>, que el navegador ya sabe manejar: atrapa el foco adentro,
 * cierra con Escape y devuelve el foco al salir. Reimplementar eso a mano sale
 * casi siempre peor.
 */
(function () {
  'use strict';

  var visor = document.querySelector('.galeria-visor');
  if (!visor) return;

  var imagenes = Array.prototype.slice.call(visor.querySelectorAll('img'));
  if (imagenes.length === 0) return;

  var dialogo = document.createElement('dialog');
  dialogo.className = 'galeria-dialogo';
  dialogo.setAttribute('aria-label', 'Foto ampliada');

  var imagenGrande = document.createElement('img');
  imagenGrande.className = 'galeria-dialogo-img';
  imagenGrande.alt = '';

  var contador = document.createElement('p');
  contador.className = 'galeria-dialogo-contador';

  var cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.setAttribute('aria-label', 'Cerrar');
  cerrar.className = 'galeria-dialogo-cerrar';
  cerrar.textContent = '✕';

  dialogo.appendChild(cerrar);
  dialogo.appendChild(imagenGrande);
  dialogo.appendChild(contador);
  document.body.appendChild(dialogo);

  var actual = 0;

  function mostrar(indice) {
    actual = (indice + imagenes.length) % imagenes.length;
    var origen = imagenes[actual];
    imagenGrande.src = origen.currentSrc || origen.src;
    imagenGrande.alt = origen.alt || '';
    contador.textContent = actual + 1 + ' de ' + imagenes.length;
  }

  function abrir(i) {
    mostrar(i);
    dialogo.showModal();
  }

  // Las fotos son <img>, no botones: sin esto solo se abren con el mouse.
  // El script las convierte en algo operable con teclado, porque el script es
  // también quien agrega la única razón para activarlas.
  imagenes.forEach(function (img, i) {
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-label', 'Ampliar foto ' + (i + 1) + ' de ' + imagenes.length);
    img.classList.add('galeria-ampliable');

    img.addEventListener('click', function () {
      abrir(i);
    });

    img.addEventListener('keydown', function (evento) {
      if (evento.key !== 'Enter' && evento.key !== ' ' && evento.key !== 'Spacebar') return;
      // La barra espaciadora, sin esto, además desplaza la página.
      evento.preventDefault();
      abrir(i);
    });
  });

  cerrar.addEventListener('click', function () {
    dialogo.close();
  });

  // Clic fuera de la imagen cierra
  dialogo.addEventListener('click', function (evento) {
    if (evento.target === dialogo) dialogo.close();
  });

  // Flechas del teclado para pasar de foto
  dialogo.addEventListener('keydown', function (evento) {
    if (imagenes.length < 2) return;
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      mostrar(actual + 1);
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      mostrar(actual - 1);
    }
  });
})();
