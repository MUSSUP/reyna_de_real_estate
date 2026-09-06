# Requisitos — Reyna de Real Estate

Versión: 3.0 · 2026-08-21

> v3.0 tras la decisión D-11: se suman **galería** y **noticias e informes administrables**. Sitio **en español**.
> Base: **Documento de Cierre de Alcance del 29/06/2026** más las correcciones de julio, salvo el segundo idioma.

---

## 1. Contexto

**Reyna de Real Estate** es la marca de **Laura Cabral**, broker inmobiliaria en Riviera Maya (Tulum, Playa del Carmen, Cancún, Holbox), especializada en propiedades de lujo para inversión y renta.

El sitio reemplaza una versión a medio construir en Bubble, cuyo diseño y copy están aprobados y sirven de especificación visual (`design/referencias/`).

**Objetivo**: captar consultas calificadas y sostener la autoridad de la marca.
**Métrica de éxito**: leads del formulario y conversaciones por WhatsApp.

---

## 2. Requisitos Funcionales

### RF-01 · Hero con video y segmentación
Video de fondo con imagen de respaldo. Título "Tu sueño. Nuestro propósito". Pregunta "¿Qué estás buscando hoy?" con dos caminos, **Invertir** y **Rentar**, que llevan al catálogo filtrado por operación.

### RF-02 · Búsqueda de propiedades
Cuatro filtros combinables: **zona**, **tipología** (incluye terreno), **dormitorios** y **presupuesto**. Resultados sin recargar.

> Los tres primeros vienen del acuerdo; el de presupuesto se suma por pedido de julio, por ser de costo bajo.

### RF-03 · Catálogo
Página con todas las propiedades publicadas y los mismos filtros, con el estado en la URL para poder compartir una búsqueda.

### RF-04 · Carrusel de destacadas
Carrusel en la home con las propiedades marcadas, en el orden definido por la administradora. Cada card: imagen principal, badge de **país**, badge de **zona**, nombre, precio en USD, m², dormitorios y baños, y botón "Ver detalle".

> Correcciones de julio aplicadas: el badge de dormitorios se reemplaza por el de país; se elimina la bajada bajo el título "Destacadas"; se agrega el botón "Ver todas las propiedades".

### RF-05 · Ficha de propiedad
**Galería de fotos** navegable con imagen grande, miniaturas y vista a pantalla completa. Datos completos de la unidad (tipología, antigüedad, dormitorios, baños, ciudad, zona, desarrollista, estado de obra, m² cubiertos y totales, precio), amenidades, descripción libre, **enlace a la carpeta de Drive con el video y el material extra**, y llamados a la acción.

### RF-06 · Sección informativa — Reyna Insights
Bloque en la home entre el carrusel y Nosotros, con la portada del informe y botón "Leer informe completo", que lleva a una página con el informe en HTML. El título se repite como encabezado. **"Decisión estratégica" se corrige a "decisión inteligente".** La portada no lleva logo.

> Cumple el punto 5.1 del acuerdo, que quedó sin responder. El contenido ya está redactado.

### RF-07 · Noticias
Sección donde la administradora publica novedades del mercado (ej. "Nuevo desarrollo en Tulum", "Tendencias en Madrid"). Listado paginado y página de detalle. Pedido explícito de la clienta.

### RF-07b · Nosotros
Texto biográfico de Laura, ya redactado y aprobado, con su retrato y el claim "Your dream is reality".

### RF-08 · Formulario de contacto
Campos: nombre, email, teléfono, interés (invertir / rentar / consulta) y mensaje. Cuando se envía desde una ficha, **queda registrada la propiedad de interés**. Validación en cliente y servidor. Botón **"COMENCEMOS"**. Confirmación visible.

### RF-09 · Aviso de consultas por mail
Cada consulta genera un aviso al mail que defina la clienta. Si el envío falla, **la consulta igual queda guardada**.

### RF-10 · Contacto por WhatsApp
Botón flotante con mensaje prellenado hacia **+52 984 311 5530**. En las fichas, el mensaje nombra la propiedad.

### RF-11 · Footer
Marca **REYNA DE REAL ESTATE** con corona, teléfonos de México y Argentina, email, y accesos a Instagram, Facebook, YouTube, WhatsApp, web y mail. Todos enlazan.

### RF-12 · Acceso al panel
Login con email y contraseña para la administradora. **Usuario único** (acuerdo, punto 4). Sesión con expiración. Rutas protegidas.

### RF-13 · Gestión de propiedades
Alta, edición, baja y despublicación. Carga de la **imagen principal** y de una **galería de hasta 15 fotos** con reordenamiento, más un campo para el **enlace de Drive**. Marcar como destacada y definir su orden. Todos los campos del punto 5.5 del acuerdo.

### RF-13b · Gestión de contenido editorial
Alta, edición y baja de noticias e informes, con estados borrador y publicado, portada y editor con formato. Permite publicar informes nuevos además del existente.

### RF-14 · Gestión de catálogos
ABM de zonas, tipologías, desarrollistas, amenidades y propietarios.

### RF-15 · Gestión de textos del sitio
Edición de los textos de secciones fijas, datos de contacto, números de WhatsApp y mail de consultas, sin tocar código.

### RF-16 · Bandeja de leads
Listado con fecha, datos, interés y propiedad de origen. Filtros por estado y rango de fechas. Exportación a CSV.

---

## 3. Requisitos No Funcionales

| ID | Requisito | Criterio verificable |
|----|-----------|----------------------|
| RNF-01 | Rendimiento | Lighthouse ≥ 90 en móvil, en home y ficha |
| RNF-02 | Responsive | Correcto en 360, 768, 1280 y 1920px |
| RNF-03 | SEO | Metadatos y Open Graph por página, sitemap, datos estructurados de inmueble |
| RNF-04 | Accesibilidad | Contraste AA, teclado, alt, etiquetas en formularios |
| RNF-05 | Imágenes | Formato moderno, dimensionadas, carga diferida |
| RNF-06 | Seguridad | Checklist de CLAUDE.md por tarea + auditoría final |
| RNF-07 | Portabilidad | Postgres estándar y almacenamiento S3-compatible. Ejecutable con Docker |
| RNF-08 | Costo | Operable en los planes gratuitos de Netlify, Supabase y Resend |
| RNF-09 | Independencia | Cuentas a nombre de la marca, no de Musapp |
| RNF-10 | **Privacidad de terceros** | Los datos de `owners` **nunca** llegan al sitio público |
| RNF-11 | Preparado para inglés | El modelo y el ruteo admiten un segundo idioma sin migración, aunque no se active |

---

## 4. Restricciones

- **Diseño y copy definidos**: se replican de las referencias. El glassmorphism del template no aplica.
- **Hosting**: Netlify gratuito, base y almacenamiento en Supabase gratuito, correo con Resend gratuito.
- **Catálogo curado**: del orden de 5 a 10 propiedades al inicio.
- **Una sola administradora.**
- **Sin presupuesto** para servicios pagos.
- **La entrega cierra el proyecto** (acuerdo, punto 6): incluye sitio funcionando, código fuente y credenciales; no incluye soporte posterior.

---

## 5. Fuera de alcance

**Sitio bilingüe** · integración con CRM · API de WhatsApp Business · pagos o reservas · cuentas para visitantes · mapa interactivo · analítica y píxeles publicitarios · panel multiusuario.

> El bilingüe salió por la decisión D-11: el costo no está en el código sino en obligar a la clienta a cargar todo dos veces, para siempre. El resto ya estaba excluido en el punto 4 del acuerdo.
