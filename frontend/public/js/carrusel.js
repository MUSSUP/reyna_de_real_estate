/**
 * Flechas para el carrusel de destacadas.
 *
 * Vive como archivo propio y no incrustado en la página a propósito: la
 * política de seguridad del sitio prohíbe los scripts inline, y no vale la pena
 * debilitarla para unas flechas.
 *
 * Es una mejora opcional. Sin este archivo el carrusel se recorre igual con el
 * dedo, con la rueda del ratón y con el teclado.
 */
(function () {
  'use strict';

  function crearFlecha(carrusel, direccion) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.setAttribute('aria-label', direccion === 'izq' ? 'Ver anteriores' : 'Ver siguientes');
    boton.className =
      'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center ' +
      'rounded-full bg-white text-verde shadow-[0_2px_12px_rgba(15,30,29,0.18)] ' +
      'transition-all duration-300 hover:bg-verde hover:text-white lg:flex ' +
      (direccion === 'izq' ? 'left-2' : 'right-2');

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', direccion === 'izq' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    boton.appendChild(svg);

    boton.addEventListener('click', function () {
      var paso = carrusel.clientWidth * 0.8;
      carrusel.scrollBy({ left: direccion === 'izq' ? -paso : paso, behavior: 'smooth' });
    });

    return boton;
  }

  var carruseles = document.querySelectorAll('.carrusel');

  for (var i = 0; i < carruseles.length; i++) {
    (function (carrusel) {
      var contenedor = carrusel.parentElement;
      if (!contenedor) return;
      if (carrusel.scrollWidth <= carrusel.clientWidth + 8) return;

      var izq = crearFlecha(carrusel, 'izq');
      var der = crearFlecha(carrusel, 'der');
      contenedor.appendChild(izq);
      contenedor.appendChild(der);

      function actualizar() {
        var alInicio = carrusel.scrollLeft <= 4;
        var alFinal = carrusel.scrollLeft + carrusel.clientWidth >= carrusel.scrollWidth - 4;
        izq.style.opacity = alInicio ? '0' : '1';
        izq.style.pointerEvents = alInicio ? 'none' : 'auto';
        der.style.opacity = alFinal ? '0' : '1';
        der.style.pointerEvents = alFinal ? 'none' : 'auto';
      }

      actualizar();
      carrusel.addEventListener('scroll', actualizar, { passive: true });
      window.addEventListener('resize', actualizar, { passive: true });
    })(carruseles[i]);
  }
})();
