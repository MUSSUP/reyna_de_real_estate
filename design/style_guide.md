# Guía de Estilo — Reyna de Real Estate

Versión: 2.0 · 2026-08-20 · **Prioridad: BAJA** (leer una vez)

> La identidad **ya existe y está aprobada**. Esta guía la formaliza, no la inventa.
> Referencia visual: `design/referencias/` — capturas de la versión aprobada por la clienta.
> **El glassmorphism con modo claro/oscuro del template NO aplica.** El registro es lujo editorial: crema, verde profundo y acentos rosa. Un solo tema, claro.

---

## Color

```css
--rosa:          #FB5696;   /* Acento de marca, CTAs primarios, corona */
--rosa-hover:    #E03D7E;
--verde:         #1E4F4C;   /* Fondo de secciones, botones secundarios, títulos */
--verde-claro:   #255F5B;
--verde-oscuro:  #0F1E1D;   /* Bandas de contraste */
--dorado:        #C9A96E;   /* Detalles y filetes. Uso escaso */
--dorado-claro:  #DFC089;
--crema:         #F2E9E4;   /* Fondo principal de superficies */
--blanco:        #FFFFFF;
--texto:         #3A3A3A;
--texto-suave:   #6B6B6B;
```

**Reglas de uso**
- Fondo del sitio: crema o blanco. Nunca oscuro por defecto.
- Títulos de sección: verde, en serif.
- Un solo CTA rosa por pantalla visible — si todo es acento, nada lo es.
- Botones dentro de las cards: verde sólido. El rosa se reserva para la conversión.
- Dorado solo en filetes y separadores. No en texto ni en fondos.

**Contraste** (RNF-04): texto sobre crema y blanco cumple AA. **El rosa sobre blanco no alcanza AA para texto pequeño** — se usa en botones con texto blanco, en títulos grandes o en elementos no textuales, nunca en párrafos.

---

## Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| Títulos | **Playfair Display** (serif) | Títulos de sección, nombres de propiedad, "CONÓCEME" |
| Subtítulos | **Cinzel** (serif) | Kickers, claims, "REYNA DE REAL ESTATE", "YOUR DREAM IS REALITY" — siempre en mayúsculas con espaciado amplio |
| Cuerpo | **Montserrat** (sans) | Párrafos, formularios, interfaz, datos de propiedades |

**Autoalojadas** en `public/fonts/` con `font-display: swap`. No se cargan desde Google Fonts en tiempo de ejecución (RNF-01).

**Escala** (móvil → escritorio): Display 32→56px · H1 28→44px · H2 24→36px · H3 20→24px · Cuerpo 16→17px · Pequeño 14px.
El cuerpo nunca baja de 16px. Interlineado 1.6 en párrafos, 1.2 en títulos.

---

## Elementos de marca

**La corona rosa** es el isotipo recurrente: aparece en el logo, como separador entre secciones (con filetes a los lados), y como viñeta de listas destacadas. Es el sello visual de la marca — se usa, pero no se abusa.

**Logos** en `public/logos/`: isotipo LC en negro y blanco sin fondo, y logo completo en cinco combinaciones. Sobre fondo claro se usa la versión negro+rosa; sobre verde, la blanco+rosa.

---

## Componentes

**Card de propiedad** (RF-04 — replicar de `sec2-card-corregida.png`, usada dentro del carrusel y en el listado)
Foto de portada en 4:3, esquinas redondeadas arriba. Debajo, sobre fondo blanco: dos badges en píldora — **país** (gris claro, texto oscuro) y **ubicación** (verde sólido, texto blanco) — nombre en Playfair, precio en verde, fila de atributos con íconos (m², dormitorios, baños) y botón "VER DETALLE" verde sólido a todo el ancho.

> Corrección aplicada: el badge de dormitorios se reemplaza por el de país.
> En terrenos, la fila de atributos omite dormitorios y baños.

**Botones**
- Primario: fondo rosa, texto blanco, píldora
- Secundario: fondo verde, texto blanco
- Terciario: borde rosa, texto rosa, fondo transparente ("VER TODAS LAS PROPIEDADES")
- Altura mínima 44px en móvil (área táctil)

**Buscador**: barra blanca elevada sobre fondo crema, cuatro campos con ícono y etiqueta en mayúsculas pequeñas, botón rosa "BUSCAR PROPIEDADES" a la derecha. En móvil los campos se apilan.

**Formulario**: campos de fondo blanco con borde suave, etiqueta arriba. Errores en rojo bajo el campo, con texto explicativo, nunca solo el borde en rojo. Botón de envío rotulado **"COMENCEMOS"**.

**Íconos sociales**: círculos verde petróleo con glifo blanco, en fila. Instagram, Facebook, YouTube, WhatsApp, web y mail.

---

## Espaciado y forma

Escala base de 4px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
Secciones: 64px de aire vertical en móvil, 96px en escritorio.
Ancho máximo de contenido: 1200px. Texto de lectura: 65 caracteres.
Radios: 8px en campos y botones pequeños, 12px en cards, píldora completa en badges y CTAs.
Sombras suaves y bajas — el registro es editorial, no material.

---

## Puntos de quiebre

360px (mínimo) · 640px · 768px (tablet) · 1024px · 1280px (escritorio) · 1536px

La grilla de destacadas: 1 columna en móvil, 2 en tablet, 3 en escritorio.

---

## Movimiento

Transiciones de 400ms con `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
Aparición al hacer scroll: desplazamiento de 40px hacia arriba con desvanecido.
**Se respeta `prefers-reduced-motion`**: si está activo, no hay animación (RNF-04).

---

## Preparado para un segundo idioma

El sitio sale en español, pero los componentes se diseñan **flexibles**: nada de anchos fijos calculados sobre la longitud del texto en español. El inglés ocupa alrededor de un 15% menos, y los títulos deben tolerar ambas longitudes sin romper el diseño el día que se active.
