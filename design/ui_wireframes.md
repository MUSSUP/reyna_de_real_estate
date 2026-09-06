# Pantallas — Reyna de Real Estate

Versión: 3.0 · 2026-08-21 · **Prioridad: MEDIA**

> v2.0 tras la decisión B5. Las capturas de `design/referencias/` son la especificación visual. Este documento define estructura y navegación.

---

## Mapa de navegación

```
SITIO PÚBLICO (español)
├── /                                   Home
│   ├── Hero con video + segmentación
│   ├── Buscador
│   ├── Carrusel de Destacadas
│   ├── Reyna Insights (portada)
│   ├── Nosotros
│   └── Contacto
├── /propiedades                        Catálogo con 4 filtros
├── /propiedades/[slug]                 Ficha
├── /insights/[slug]                    Informe completo
├── /noticias                           Listado
├── /noticias/[slug]                    Detalle
└── 404 con marca

PANEL  /admin
├── /admin/login
├── /admin                              Tablero
├── /admin/propiedades                  Listado
├── /admin/propiedades/nueva
├── /admin/propiedades/[id]             Edición
├── /admin/destacadas                   Reordenamiento
├── /admin/articulos                    Noticias e informes
├── /admin/articulos/[id]
├── /admin/catalogos                    Zonas, tipologías, desarrollistas, amenidades, propietarios
├── /admin/leads                        Bandeja
└── /admin/configuracion                Textos y contacto
```

---

## Home

**Barra superior** — fija, transparente sobre el hero, verde al hacer scroll. Logo a la izquierda, botón "CONTACTO" rosa a la derecha. En móvil, menú hamburguesa.

**1 · Hero**
Video de fondo a pantalla completa, en silencio, en bucle, con **imagen de respaldo** si no carga, si el visitante pidió menos movimiento, o si `hero.video_url` está vacío. Arranca con material de stock de uso comercial libre (D-10). Velo oscuro para asegurar contraste. Título "Tu sueño. Nuestro propósito" en Playfair. Debajo, "¿QUÉ ESTÁS BUSCANDO HOY?" y dos botones: **Invertir** y **Rentar**, que llevan a `/propiedades?operacion=venta` y `?operacion=renta`.

> El video no debe bloquear la carga ni reproducir audio. Si pesa demasiado, se sirve la imagen en móvil.

**2 · Buscador**
Barra blanca elevada sobre fondo crema, con cuatro campos —Zona, Tipología, Dormitorios, Presupuesto— y botón rosa "BUSCAR PROPIEDADES". En móvil los campos se apilan.

**3 · Carrusel de Destacadas**
Título "DESTACADAS" con separador de corona. *Sin bajada debajo del título.*
Carrusel con navegación por flechas, teclado y gestos. Muestra 3 cards en escritorio, 2 en tablet, 1 en móvil. Botón "VER TODAS LAS PROPIEDADES →".

*Vacío*: si no hay destacadas, la sección no se muestra.

**4 · Reyna Insights**
Fondo de foto aérea con velo oscuro. Kicker "REYNA INSIGHTS · ANÁLISIS DEL MERCADO INMOBILIARIO", título "BIENES RAÍCES: UNA OPORTUNIDAD DE CRECIMIENTO", bajada corta y botón "LEER INFORME COMPLETO ↓".
*Sin logo en esta pieza.*

**4b · Noticias**
Últimas 3, en cards con imagen, título y fecha. Enlace "Ver todas".
*Vacío*: la sección no se muestra.

**5 · Nosotros**
Tarjeta crema sobre foto de fondo. Texto biográfico a la izquierda, retrato a la derecha. Cierre con corona y "YOUR DREAM IS REALITY" en Cinzel. En móvil el retrato va arriba.

> **Debe funcionar sin retrato** (D-10). Si `nosotros.photo` está vacío, el texto se centra en la tarjeta a un ancho de lectura cómodo, con la corona arriba. Tiene que verse **intencional, no incompleto** — nada de recuadro vacío ni marcador de posición.

**6 · Contacto**
Formulario: nombre, email, teléfono, interés (Invertir / Rentar / Consulta general) y mensaje. Botón **"COMENCEMOS"**.

**Footer**
Banda verde superior. Debajo, sobre crema: corona y "REYNA DE REAL ESTATE" al centro. A la izquierda teléfono, WhatsApp y email; a la derecha íconos circulares: web, Instagram, WhatsApp, mail, YouTube y **Facebook**. Copyright abajo.

**Botón flotante de WhatsApp**: fijo abajo a la derecha, sobre todo el contenido.

---

## Catálogo `/propiedades`

Encabezado compacto con título y cantidad de resultados. Los cuatro filtros persistentes en la URL (`?zona=tulum&tipo=casa`), para poder compartir una búsqueda.
Grilla de cards: 3 columnas en escritorio, 2 en tablet, 1 en móvil. Orden: destacadas primero, luego por fecha de publicación.

**El filtrado ocurre en el navegador** sobre un índice JSON embebido: respuesta instantánea, sin recargar.

*Vacío*: "No encontramos propiedades con esos criterios" + botón "Ver todas".

---

## Ficha `/propiedades/[slug]`

1. **Galería**: imagen principal grande, miniaturas debajo, ampliable a pantalla completa con teclado y gestos. Con una sola imagen no se muestran controles de navegación
2. Encabezado: badges de país y zona, nombre en Playfair, precio en verde (o "Precio a consultar")
3. Atributos con íconos: m² cubiertos, m² totales, dormitorios, baños, tipología, operación, estado de obra, antigüedad, desarrollista. *En terrenos se omiten dormitorios, baños y antigüedad*
4. Amenidades en grilla con íconos
5. Descripción libre
6. **Bloque de Drive**: tarjeta destacada con "Ver el video y más material" que abre la carpeta en pestaña nueva, con `rel="noopener noreferrer"`
7. Bloque de contacto: formulario con la propiedad ya referenciada + botón de WhatsApp que la nombra
8. "Propiedades similares": hasta 3 de la misma zona u operación

**Metadatos**: título, descripción, Open Graph con la imagen principal y datos estructurados de inmueble.
**Nunca** se muestra dato alguno del propietario.

---

## Noticias

**Listado `/noticias`**: grilla de cards con imagen, título, bajada y fecha. Paginado de a 9.
**Detalle `/noticias/[slug]`**: portada, título, fecha, cuerpo renderizado desde Markdown **saneado**, y enlaces a las siguientes.
*Vacío*: "Pronto vas a encontrar acá las novedades del mercado".

---

## Informe `/insights/[slug]`

Encabezado con el título repetido sobre la foto aérea (pedido explícito de la clienta).
Contenido en columna legible de 65 caracteres, con los bloques del informe original: por qué invertir, invertir con información, visión a largo plazo, y los cuatro pilares en grilla. Cita destacada de McKinsey en recuadro rosa claro.
Cierre: logo, web, email e instagram — **con los datos de Reyna**.
CTA final hacia el catálogo.

---

# Panel de administración

**Estructura**: barra lateral (Tablero, Propiedades, Destacadas, Artículos, Catálogos, Leads, Configuración) y contenido a la derecha. En móvil se colapsa.
**Barra superior persistente**: indicador de cambios sin publicar + botón **"PUBLICAR CAMBIOS"** con estado del build.

## Login `/admin/login`
Tarjeta centrada sobre fondo verde, logo arriba, email y contraseña, botón "INGRESAR".
Error único e idéntico ante cualquier falla: "Email o contraseña incorrectos".

## Tablero `/admin`
Cuatro contadores: propiedades publicadas, leads nuevos, artículos publicados, propiedades en borrador. Últimos 5 leads y accesos rápidos.

## Propiedades `/admin/propiedades`
Tabla: imagen, título, zona, tipología, operación, precio, estado, destacada. Filtros por estado y búsqueda por texto. Botón "NUEVA PROPIEDAD".

## Edición `/admin/propiedades/[id]`
Formulario en pestañas:
- **Datos**: tipología, zona, desarrollista, operación, estado de obra, antigüedad, precio (o "a consultar"), m² cubiertos y totales, dormitorios, baños, cartera propia o compartida, propietario *(interno)*
- **Amenidades**: selección múltiple con íconos
- **Textos**: título y descripción libre
- **Material**: carga de la **imagen principal** con vista previa y texto alternativo · **galería** con arrastrar, soltar y reordenar, hasta 15 fotos, con texto alternativo por imagen y contador visible · campo para el **enlace de Drive** con validación de formato
- **Publicación**: estado y destacada

Botones "Guardar borrador" y "Publicar". Al publicar sin imagen, el error indica exactamente qué falta.

> El campo de propietario lleva un aviso visible: *"Dato interno. No se muestra en el sitio."*

## Destacadas `/admin/destacadas`
Lista arrastrable de las propiedades marcadas, con vista previa del orden del carrusel.

## Artículos `/admin/articulos`
Tabla con filtro por tipo (noticia / informe): portada, título, tipo, estado, destacado, fecha. Botón "NUEVO ARTÍCULO".
Editor: título, bajada, portada, cuerpo en Markdown **con vista previa**, estado, y casilla "destacado en la home". Al publicar sin portada, el error indica qué falta.

## Catálogos `/admin/catalogos`
Pestañas para zonas, tipologías, desarrollistas, amenidades y propietarios. ABM simple en tabla. Al intentar borrar algo en uso, se explica cuántas propiedades lo usan.

## Leads `/admin/leads`
Tabla por fecha descendente: fecha, nombre, contacto, interés, propiedad de origen, estado. Filtros por estado y rango de fechas. Al abrir: datos completos, mensaje **escapado**, cambio de estado y notas internas. Botón "EXPORTAR CSV".

*Vacío*: "Todavía no llegaron consultas".

## Configuración `/admin/configuracion`
Campos agrupados: Hero (incluido el video), Nosotros, Contacto (incluido **el mail al que llegan las consultas**), Redes.

---

## Estados transversales

| Estado | Tratamiento |
|--------|-------------|
| Cargando | Esqueletos de contenido, nunca pantalla en blanco |
| Vacío | Mensaje con la marca + acción sugerida |
| Error | Texto claro + qué hacer. Nunca detalles técnicos |
| Éxito | Confirmación visible, no un cambio silencioso |
| Sin conexión (panel) | Aviso de que los cambios no se guardaron |

---

## Accesibilidad (RNF-04)

Navegación completa por teclado con foco visible · alt en todas las imágenes, editable desde el panel · formularios con etiquetas asociadas y errores anunciados · área táctil mínima de 44px · `prefers-reduced-motion` respetado, **incluido el video del hero** · jerarquía de encabezados sin saltos · carrusel operable con teclado y con pausa.
