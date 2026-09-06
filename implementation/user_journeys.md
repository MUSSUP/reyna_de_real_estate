# Tareas y Journeys — Reyna de Real Estate

Versión: 3.0 · 2026-08-21

> v3.0 tras la decisión D-11: se suman **galería de fotos** y **noticias e informes administrables**. Sigue **sin bilingüe**.
> Base: Documento de Cierre del 29/06/2026 + las correcciones de julio, salvo el segundo idioma.

**IT** = Infrastructure Task · **UJ** = User Journey (backend + frontend + verificación)

---

# Infraestructura

## IT-01 · Esqueleto del proyecto
Astro 5 + React 19 + TypeScript estricto + Tailwind 4 con los tokens de marca. Estructura de `architecture.md`. ESLint y Prettier. `.env.example` con todas las variables documentadas y **sin un solo valor real**.
**Listo cuando**: `npm run dev` levanta una página con tipografías y colores de marca aplicados.

## IT-02 · Base de datos y migraciones
Esquema Drizzle con las 10 entidades de `data_model.md`, incluidas zonas, desarrollistas, propietarios y amenidades. Migraciones versionadas. Índices y restricciones.
**Listo cuando**: las migraciones corren de cero contra una base limpia y el esquema coincide con el documento.

## IT-03 · Imágenes y almacenamiento
Cliente S3-compatible. Carga individual y múltiple, reemplazo, borrado. Sharp: WebP en 400, 800 y 1600px con extracción de dimensiones. **Validación por firma binaria del archivo.** Tope de 15 imágenes de galería por propiedad.
**Listo cuando**: se sube un JPEG y quedan las tres variantes con sus medidas; una carga múltiple respeta el tope; un archivo no permitido renombrado a `.jpg` es rechazado.

## IT-04 · Autenticación
JWT + bcrypt coste 12. Middleware único reutilizable. Cookie `HttpOnly`/`Secure`/`SameSite=Strict`. Límite por IP. Respuesta idéntica ante email inexistente y contraseña incorrecta.
**Listo cuando**: sin token todo endpoint admin da 401; con token pasa; al sexto intento fallido, 429.

## IT-05 · Sistema de diseño
Componentes base: botones en tres variantes, campos, badges, card de propiedad, separador de corona, contenedores. Tipografías autoalojadas. Aparición al hacer scroll respetando `prefers-reduced-motion`.
**Listo cuando**: hay una página de muestra con todos los componentes, verificada en 360px y 1280px.

## IT-06 · Envío de correo
Integración con Resend (plan gratuito) para el aviso de leads. Plantilla del mensaje. **Si el envío falla, el lead ya está guardado** y el fallo se registra.
**Listo cuando**: al enviar el formulario llega el mail, y al forzar un fallo del proveedor el lead igual queda en base.

## IT-07 · Datos de demostración
Semilla completa según `data_model.md`: 8 propiedades con imagen principal y enlace de Drive, catálogos, leads y configuración.
**Listo cuando**: `npm run seed` deja el sitio completo y presentable.

## IT-08 · Entorno Docker
`Dockerfile` y `docker-compose.yml` con aplicación, Postgres y MinIO. Configuración de Netlify con cabeceras de seguridad.
**Listo cuando**: `docker compose up` levanta el proyecto entero sin ningún servicio en la nube (RNF-07).

---

# Hito 1 · El visitante encuentra y consulta una propiedad

*Al terminarlo hay un sitio real para mostrarle a la clienta.*

## UJ-01 · Descubrir la marca y elegir camino
Entro a la home, entiendo de qué se trata, y elijo "Invertir" o "Rentar" para llegar al catálogo ya filtrado.
**Incluye**: barra superior, **hero con video de fondo** (con imagen de respaldo si el video no carga), segmentación, footer completo con las seis redes enlazadas, botón flotante de WhatsApp, página 404 con marca.
**Verificación**: ambos botones filtran bien. Todos los íconos del footer abren donde deben. El video no bloquea la carga ni dispara audio.

## UJ-02 · Ver las propiedades destacadas
Recorro el carrusel de destacadas con el formato aprobado: badge de país y de zona, **sin** badge de dormitorios, **sin** bajada bajo el título.
**Verificación**: coincide con `sec2-card-corregida.png`. Navegable con teclado y con gestos. Con 1, 3 y 8 propiedades se ve bien. Sin destacadas, la sección desaparece sin dejar hueco.

## UJ-03 · Buscar y filtrar
Uso los cuatro filtros — zona, tipología, dormitorios y presupuesto — solos o combinados. Resultados instantáneos. Puedo compartir el enlace de mi búsqueda.
**Verificación**: cada filtro y sus combinaciones funcionan; el estado vive en la URL; sin resultados hay mensaje útil con salida.

## UJ-04 · Ver la ficha de una propiedad
Abro una propiedad, **recorro su galería de fotos**, veo todos sus datos y amenidades, y encuentro un enlace a la carpeta de Drive con el video y el material extra.
**Incluye**: galería con imagen grande, miniaturas y vista a pantalla completa, navegable con teclado y con gestos.
**Verificación**: en un terreno no aparecen dormitorios, baños ni antigüedad. Con 1 imagen la galería no muestra controles inútiles. El enlace de Drive abre en pestaña nueva con `rel="noopener noreferrer"`. Los metadatos sociales usan la imagen principal. **Ningún dato de propietario aparece en el HTML.**

## UJ-05 · Contactar por WhatsApp
Toco el botón flotante y se abre WhatsApp con el mensaje escrito. Desde una ficha, el mensaje nombra la propiedad.
**Verificación**: abre `+52 984 311 5530` en móvil y escritorio, con el mensaje correcto.

## UJ-06 · Enviar una consulta
Completo el formulario y recibo confirmación. Si algo falta, el error dice exactamente qué.
**Verificación**: validación en cliente y servidor; el lead queda en base con su origen; **llega el aviso por mail**; si el mail falla el lead igual se guarda; el honeypot descarta bots; al sexto envío, 429; si la base falla se ofrece WhatsApp y no se pierde el contacto.

---

# Hito 2 · La administradora gestiona el catálogo

## UJ-07 · Entrar al panel
Ingreso con email y contraseña y llego al tablero. Si me equivoco, un mensaje que no revela nada. Al cerrar sesión no puedo volver con el botón atrás.
**Verificación**: rutas protegidas sin token; sesión expira a las 8 horas; el hash nunca viaja al cliente.

## UJ-08 · Publicar una propiedad
Cargo una propiedad completa — tipología, zona, desarrollista, operación, estado de obra, antigüedad, precio, m² cubiertos y totales, dormitorios, baños, amenidades, descripción, imagen principal, **galería de fotos** y enlace de Drive — y la publico. Aparece en el sitio.
**Incluye**: formulario en pestañas, carga de imagen principal, **carga múltiple de galería con arrastrar, soltar y reordenar**, texto alternativo por imagen, gestión de catálogos, validaciones de publicación.
**Verificación**: se crea, edita, publica y se ve en el sitio; publicar sin imagen principal se rechaza con mensaje claro; el tope de 15 imágenes se respeta con aviso claro; un archivo no permitido renombrado a `.jpg` es rechazado; el enlace de Drive se valida.

## UJ-09 · Elegir y ordenar las destacadas
Marco cuáles destacar y las ordeno arrastrando. El carrusel de la home refleja ese orden.
**Verificación**: el orden persiste y coincide con la home.

## UJ-10 · Publicar noticias e informes
Escribo una noticia o un informe con formato, portada y bajada, y la publico. Aparece en el sitio.
**Incluye**: editor Markdown con vista previa, portada, estados borrador y publicado, marcar como destacado en la home.
**Verificación**: el Markdown se renderiza **saneado** — un intento de inyectar un script no se ejecuta; marcar destacado desmarca el anterior del mismo tipo; publicar sin portada se rechaza con mensaje claro.

## UJ-11 · Revisar los contactos recibidos
Veo los leads por fecha, los filtro, cambio su estado, anoto y exporto a CSV.
**Verificación**: el mensaje se muestra **escapado**; el CSV abre bien en Excel con acentos; las notas nunca se exponen públicamente.

## UJ-12 · Editar los textos del sitio
Cambio el título del hero, el texto de Nosotros, un número de WhatsApp o el mail al que llegan las consultas, sin tocar código.
**Verificación**: el cambio se refleja tras publicar.

## UJ-13 · Publicar los cambios
Presiono "Publicar cambios" y en un par de minutos el sitio está actualizado. Veo el estado del proceso.
**Verificación**: se dispara el build; varios guardados seguidos producen uno solo; el panel avisa al terminar.

---

# Hito 3 · Contenido, calidad y entrega

## UJ-14 · Leer el informe Reyna Insights
Abro el informe desde la home y lo leo completo, cómodo en el celular.
**Incluye**: el contenido ya redactado cargado como artículo destacado, **"estratégica" corregido a "inteligente"**, sin logo en la portada, y con los datos de contacto de Reyna. Cumple el punto 5.1 del acuerdo.
**Verificación**: legible sin zoom en 360px; indexable; los cuatro pilares se ven bien en móvil.

## UJ-15 · Leer las noticias
Recorro el listado de noticias y abro una.
**Verificación**: paginado correcto; sin noticias publicadas, mensaje adecuado en lugar de una página vacía.

## UJ-16 · Conocer a Laura
Leo su historia con su retrato y el claim de cierre.
**Verificación**: el texto es el aprobado, sin cambios; en móvil el retrato va arriba.

## IT-09 · Auditoría de rendimiento y accesibilidad
Lighthouse ≥ 90 en móvil, axe sin errores críticos, recorrido completo por teclado, presupuesto de imágenes cumplido.

## IT-10 · Auditoría de seguridad final
Checklist completo de CLAUDE.md sobre el sistema entero. **Verificación específica de que ningún dato de `owners` llega al sitio público.** Hallazgos y riesgos residuales en `work_log.md`.

## IT-11 · Verificación con y sin datos
Todas las páginas con datos de demostración, y todas con la base vacía. Ningún layout roto, ningún hueco.

## IT-12 · Despliegue y entrega
Cuentas con el mail de la marca. Variables en Netlify. Dominio apuntado. HTTPS. **Entrega del código fuente y todas las credenciales**, según el punto 6 del acuerdo. Guía de uso del panel para la clienta.

---

## Trazabilidad

| Requisito | Journey |
|-----------|---------|
| Hero con video + segmentación | UJ-01 |
| Carrusel de destacadas | UJ-02, UJ-09 |
| Listado con filtros | UJ-03 |
| Detalle con galería + Drive | UJ-04 |
| WhatsApp | UJ-05 |
| Formulario + aviso por mail | UJ-06, IT-06 |
| Panel de acceso único | UJ-07 |
| ABM de propiedades | UJ-08 |
| Destacadas | UJ-09 |
| Noticias e informes | UJ-10, UJ-15 |
| Bandeja de leads | UJ-11 |
| Textos editables | UJ-12 |
| Publicación | UJ-13 |
| Sección informativa (punto 5.1) | UJ-14 |
| Nosotros | UJ-16 |

Cada journey tiene página en la navegación · cada endpoint pertenece a un journey · cada entidad tiene journey que la crea y la consume.

---

## Fuera de alcance — fase posterior

**Sitio bilingüe** · integración con CRM · mapa interactivo · analítica y píxeles publicitarios · panel multiusuario · pagos o reservas · cuentas para visitantes.

> El bilingüe es el único de los cuatro puntos originalmente diferidos que sigue afuera. Los otros tres —galería, noticias e informes administrables— entraron por la decisión D-11.
