/**
 * Cómo se parte el cuerpo de una noticia.
 *
 * El texto lo escribe la clienta desde el panel. Estas pruebas fijan dos cosas:
 * que el marcado mínimo se entienda, y que **nada de lo que escriba pueda
 * convertirse en HTML** — la página interpola texto, nunca lo inserta.
 */
import { describe, expect, it } from 'vitest';
import { bloquesDeTexto, fechaLegible, minutosDeLectura } from '../../frontend/src/lib/articulos';
import { generarSlug, slugUnico } from '../../backend/lib/slug';

describe('bloquesDeTexto', () => {
  it('separa párrafos por línea en blanco', () => {
    expect(bloquesDeTexto('Uno.\n\nDos.')).toEqual([
      { tipo: 'parrafo', texto: 'Uno.' },
      { tipo: 'parrafo', texto: 'Dos.' },
    ]);
  });

  it('reconoce los títulos con ##', () => {
    const b = bloquesDeTexto('Intro.\n\n## Un título\n\nCuerpo.');
    expect(b.map((x) => x.tipo)).toEqual(['parrafo', 'titulo', 'parrafo']);
    expect(b[1]).toEqual({ tipo: 'titulo', texto: 'Un título' });
  });

  it('un salto simple no corta el párrafo', () => {
    // Quien escribe en un textarea corta líneas sin querer separar ideas.
    expect(bloquesDeTexto('Una idea\nque sigue acá.')).toEqual([
      { tipo: 'parrafo', texto: 'Una idea que sigue acá.' },
    ]);
  });

  it('un cuerpo vacío no rompe nada', () => {
    expect(bloquesDeTexto('')).toEqual([]);
    expect(bloquesDeTexto(null)).toEqual([]);
    expect(bloquesDeTexto('   \n\n  ')).toEqual([]);
  });

  it('el HTML que escriba la clienta queda como texto, no como marcado', () => {
    // Esto es lo que hace que la página sea segura: los bloques salen con el
    // texto crudo y quien lo renderiza lo interpola, así que se escapa solo.
    // Si algún día alguien usa `set:html` con esto, esta prueba no lo va a
    // atrapar — pero deja escrito que el contenido NO es HTML de confianza.
    const b = bloquesDeTexto("<script>alert('x')</script>\n\n## <img src=x onerror=alert(1)>");
    expect(b[0]).toEqual({ tipo: 'parrafo', texto: "<script>alert('x')</script>" });
    expect(b[1]).toEqual({ tipo: 'titulo', texto: '<img src=x onerror=alert(1)>' });
  });
});

describe('fechaLegible', () => {
  it('escribe la fecha en castellano', () => {
    expect(fechaLegible('2026-08-14T12:00:00Z')).toBe('14 de agosto de 2026');
  });

  it('sin fecha devuelve vacío en vez de "Invalid Date"', () => {
    expect(fechaLegible(null)).toBe('');
    expect(fechaLegible('cualquier cosa')).toBe('');
  });
});

describe('minutosDeLectura', () => {
  it('nunca dice cero minutos', () => {
    expect(minutosDeLectura('Hola.')).toBe(1);
    expect(minutosDeLectura('')).toBe(1);
  });

  it('crece con el texto', () => {
    expect(minutosDeLectura('palabra '.repeat(600))).toBe(3);
  });
});

describe('títulos pegados a su párrafo', () => {
  // Así está escrito el informe Reyna Insights: el encabezado y su texto en
  // líneas seguidas, sin línea en blanco. Antes el párrafo entero terminaba
  // adentro del <h3> y los cuatro pilares salían como encabezados enormes.
  it('separa el encabezado del texto que lo sigue sin línea en blanco', () => {
    expect(bloquesDeTexto('### Crecimiento patrimonial\nLas propiedades suben.')).toEqual([
      { tipo: 'pilar', texto: 'Crecimiento patrimonial' },
      { tipo: 'parrafo', texto: 'Las propiedades suben.' },
    ]);
  });

  it('hace lo mismo con ## y con varios párrafos debajo', () => {
    expect(bloquesDeTexto('## Sección\nUno.\n\nDos.')).toEqual([
      { tipo: 'titulo', texto: 'Sección' },
      { tipo: 'parrafo', texto: 'Uno.' },
      { tipo: 'parrafo', texto: 'Dos.' },
    ]);
  });

  it('distingue ### de ##', () => {
    const b = bloquesDeTexto('## Dos\n\n### Tres');
    expect(b.map((x) => x.tipo)).toEqual(['titulo', 'pilar']);
  });
});

describe('citas', () => {
  it('reconoce el > y no lo deja impreso', () => {
    expect(bloquesDeTexto('> Una cita.')).toEqual([{ tipo: 'cita', texto: 'Una cita.' }]);
  });

  it('une una cita de varias líneas', () => {
    expect(bloquesDeTexto('> Primera\n> segunda')).toEqual([
      { tipo: 'cita', texto: 'Primera segunda' },
    ]);
  });

  it('un > en el medio del párrafo no lo convierte en cita', () => {
    const b = bloquesDeTexto('Cuesta 3 > 2 pesos.');
    expect(b).toEqual([{ tipo: 'parrafo', texto: 'Cuesta 3 > 2 pesos.' }]);
  });
});

describe('el informe completo se parte como corresponde', () => {
  // Recorta el informe real: dos citas, cuatro pilares pegados a su texto.
  const INFORME = [
    '## ¿Por qué invertir sigue siendo una decisión inteligente?',
    '',
    'Los bienes raíces siguen siendo un activo valorado.',
    '',
    '> Según el McKinsey Global Institute, representan dos tercios de la riqueza real.',
    '',
    '### Crecimiento patrimonial',
    'Las propiedades en mercados con demanda suben de valor.',
    '',
    '### Generación de ingresos',
    'Una propiedad puede rentarse.',
  ].join('\n');

  it('ningún pilar se lleva su párrafo adentro', () => {
    const pilares = bloquesDeTexto(INFORME).filter((b) => b.tipo === 'pilar');
    expect(pilares).toHaveLength(2);
    for (const p of pilares) {
      expect(p.texto).not.toContain('\n');
      // Un encabezado de más de 60 caracteres es señal de que se comió el texto.
      expect(p.texto.length).toBeLessThan(60);
    }
  });

  it('la cita sale como cita y sin el signo', () => {
    const citas = bloquesDeTexto(INFORME).filter((b) => b.tipo === 'cita');
    expect(citas).toHaveLength(1);
    expect(citas[0]!.texto.startsWith('>')).toBe(false);
    expect(citas[0]!.texto).toContain('McKinsey');
  });
});

describe('slugs de propiedades', () => {
  it('saca acentos, mayúsculas y signos', () => {
    expect(generarSlug('Casa Abatón · Tulum!')).toBe('casa-abaton-tulum');
  });

  it('no deja guiones sueltos en las puntas', () => {
    expect(generarSlug('  ¿Villa Sián?  ')).toBe('villa-sian');
  });

  it('un título sin letras no produce una dirección vacía', () => {
    expect(generarSlug('¡!¿?')).toBe('propiedad');
  });

  it('agrega sufijo solo si la dirección ya está tomada', () => {
    expect(slugUnico('casa-abaton', [])).toBe('casa-abaton');
    expect(slugUnico('casa-abaton', ['casa-abaton'])).toBe('casa-abaton-2');
    expect(slugUnico('casa-abaton', ['casa-abaton', 'casa-abaton-2'])).toBe('casa-abaton-3');
  });
});
