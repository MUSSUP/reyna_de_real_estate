# Preguntas de Planificación

Proyecto: Reyna de Real Estate — Laura Cabral
Fecha: 2026-08-20

---

## 🔴 Bloqueantes — ✅ TODOS RESPONDIDOS (2026-08-20)

### B1. ¿El sitio va en español solamente, o bilingüe español/inglés?

**Por qué bloquea**: cambia el modelo de datos (cada propiedad y noticia necesitaría campos por idioma), el ruteo (`/en/...`), el panel admin (doble carga de contenido) y el SEO (hreflang). Agregarlo después es caro; preverlo desde el diseño es barato.

**Contexto**: el claim de marca ya es bilingüe ("Your dream is reality") y el público objetivo es inversor internacional en Riviera Maya, mercado con fuerte demanda de compradores estadounidenses y canadienses.

**✅ RESPUESTA: Bilingüe español/inglés desde el inicio.**

Implicancias asumidas en el diseño:
- Solo se traducen los campos **narrativos** (título, descripción, textos de sección). Los campos **numéricos y de catálogo** (precio, m², dormitorios, baños, ubicación, tipo) son únicos y se muestran igual en ambos idiomas → reduce la carga de contenido a la mitad de lo que sería traducir todo.
- Ruteo: `/` (español, default) y `/en/` (inglés).
- El panel admin muestra los dos idiomas lado a lado en el mismo formulario.
- Si un campo en inglés queda vacío, se muestra el español como respaldo (nunca un hueco).
- SEO: etiquetas `hreflang` recíprocas.

---

### B2. ¿La pieza "Reyna Insights" se reconstruye en HTML o queda como imagen de Canva?

**Por qué bloquea**: define si el informe es una User Journey con página propia y contenido administrable, o simplemente un archivo estático enlazado.

**Contexto**: hoy es una imagen de Canva con datos de contacto desactualizados (`lauracabralrealestate.com`), así que hay que tocarla igual.

**✅ RESPUESTA: Reconstruir en HTML como página propia del sitio.**

Implicancias: el informe es una User Journey con página propia, indexable, responsive y con los datos de contacto correctos. El contenido ya está redactado (se toma de `design/referencias/sec3-informe-completo.png`). Se modela junto con las noticias en una única entidad `articles`, distinguidas por tipo, de modo que la clienta pueda publicar nuevos informes además de noticias.

---

### B3. ¿Qué pasa cuando llega un lead del formulario?

**Por qué bloquea**: define si hace falta un servicio de envío de mail (credencial nueva, Level 2) y si el panel admin necesita bandeja de entrada.

**Opciones**: guardar en base y verlo en el panel · notificar por mail a la clienta · ambas.

**✅ RESPUESTA: Guardar en base y verlo en la bandeja del panel admin.** Sin notificación por mail en esta entrega.

⚠️ **Riesgo asociado** (registrado en `risks.md` como R-06): si la clienta no entra al panel con regularidad, un lead puede quedar sin responder días. La mitigación de un mail automático es barata (Resend free, 3000/mes) y queda propuesta como mejora inmediata post-entrega.

---

### B4. ¿Cuál de los dos WhatsApp recibe los contactos del sitio?

**Por qué bloquea**: es dato de configuración, pero afecta el diseño del botón flotante y del footer.

**Opciones**: +52 984 311 5530 (México) · +54 9 351 819 4131 (Argentina) · según país del visitante.

**✅ RESPUESTA: +52 984 311 5530 (México)** para el botón flotante y el CTA principal. El número de Argentina se muestra igualmente en el footer como dato de contacto. Ambos configurables desde el panel, sin tocar código.

---

## 🟡 Supuestos tomados — se avanza sin bloquear, corregibles

| # | Supuesto | Fundamento | Costo de cambiarlo |
|---|----------|------------|--------------------|
| S1 | Base de datos: **Supabase** (Postgres puro, sin features propietarias) | Resuelve base + storage en un solo free tier. Postgres y S3 son estándares portables. | Bajo — es Postgres estándar |
| S2 | Autenticación del panel: **JWT + bcrypt propio**, no Supabase Auth | Default del template y coherente con el requisito de portabilidad: Supabase Auth ataría el proyecto al proveedor | Medio |
| S3 | Imágenes: **Supabase Storage** (S3-compatible) con optimización en el upload | Más portable que Cloudinary; evita depender de transformaciones del proveedor | Bajo |
| S4 | Un solo rol administrador (la clienta) | No hay indicio de equipo ni de permisos diferenciados | Medio si aparecen más usuarios |
| S5 | Las propiedades no requieren mapa interactivo | No aparece en el material de referencia | Bajo — se suma como mejora |
| S6 | Las noticias no requieren categorías ni tags | Volumen esperado bajo | Bajo |
| S7 | Sin analítica de terceros en la primera entrega | No fue pedida. Se puede sumar Plausible o GA4 después | Bajo |
| S8 | Precios en USD, sin conversión de moneda | Todo el material de referencia muestra USD | Bajo |
| S9 | El formulario no requiere CAPTCHA en la primera entrega | Tráfico bajo al inicio. Se mitiga con honeypot y rate limiting | Bajo |

---

## ⚪ Diferidas — no afectan esta entrega

- Integración con CRM inmobiliario (EasyBroker / Tokko / Wasi) — Fase 2
- Qué pasa con la app de Bubble al publicar
- Registrador del dominio y ventana para el apuntado de DNS — operativo, no de diseño

---

# 🔴 BLOQUEANTE CRÍTICO — aparecido durante la planificación

## B5. ¿Cuál documento define el alcance?

Durante el paso de exploración de herramientas apareció en Google Drive el documento **"Reyna de Real Estate — Documento de Cierre de Alcance V1"**, del 29 de junio de 2026, escrito por Musapp para Laura Cabral. Es un acuerdo formal de alcance que dice de sí mismo:

> "Reemplaza cualquier conversación anterior sobre el proyecto: lo que está escrito acá es lo que se va a hacer."

**Contradice el plan construido hoy en nueve puntos.**

| # | Tema | Documento de Cierre (29 jun) | Correcciones de la clienta (22 jul) / definido hoy |
|---|------|------------------------------|---------------------------------------------------|
| 1 | **Idioma** | ❌ "Sitio en más de un idioma" está **explícitamente fuera de alcance** | ✅ Bilingüe ES/EN decidido hoy |
| 2 | **Filtros** | 3: ciudad/zona, tipología, dormitorios. Más filtros = fuera de alcance | 4: agrega **presupuesto** |
| 3 | **Imágenes** | Solo imagen principal en el panel + **enlace a carpeta de Drive** para el resto | Galería completa con carga múltiple |
| 4 | **Noticias** | No figura | Requisito explícito de la clienta |
| 5 | **Leads** | "¿A qué mail tienen que llegar las consultas?" → notificación por mail prevista | Solo bandeja en el panel |
| 6 | **Hero** | Con **video de fondo** | No contemplado en el plan de hoy |
| 7 | **Destacadas** | **Carrusel** | Grilla de 3 columnas |
| 8 | **Campos de propiedad** | Incluye antigüedad, desarrollista, estado, m² cubiertos y totales, **amenidades** | Modelo más chico |
| 9 | **Entidades** | Menciona **desarrollistas** y **propietarios** | No modeladas |

### Dos hechos que importan para decidir

1. **Laura nunca completó el documento.** Todos los campos de la sección 5 están en blanco: no eligió la sección nueva del home, no confirmó los filtros, no indicó a qué mail van las consultas.
2. **La carpeta de Drive del proyecto está vacía.** No subió el video del hero, ni las fotos, ni el material que se le pidió.

El acuerdo dice: *"Una vez que tenga este documento completo, empieza la construcción de la versión final."* Formalmente, esa condición **nunca se cumplió**.

### Cronología

- **29 jun 2026** — Documento de Cierre enviado a Laura. Nunca respondido.
- **22 jul 2026** — Laura envía correcciones sobre el sitio en Bubble (`Web site.pdf`), pidiendo cosas que el documento de cierre había dejado fuera.
- **20 ago 2026** — Planificación de este proyecto.

### Lectura

Las correcciones de julio son **posteriores** y reflejan lo que Laura quiere hoy, pero **piden cosas que el acuerdo excluía**. El documento de cierre existía justamente para evitar eso: *"para que quede claro y no se repita lo que pasó la primera vez"*.

**Respuesta**: _pendiente — requiere decisión de negocio, no técnica_

### ✅ RESPUESTA B5 (2026-08-20): Híbrido acotado, solo español

**Base**: el Documento de Cierre de Alcance del 29 de junio.
**Se suman** únicamente las correcciones de julio de costo bajo.
**Se difiere** todo lo que la clienta agregó después y encarece la entrega.

| Corrección de julio | ¿Entra? | Motivo |
|---------------------|---------|--------|
| Badge de país en lugar de dormitorios | ✅ | Trivial |
| Quitar bajada bajo "Destacadas" | ✅ | Trivial |
| Botón "Ver todas las propiedades" | ✅ | Trivial |
| Terrenos como tipología | ✅ | Es un dato de catálogo |
| Cuarto filtro: presupuesto | ✅ | Un filtro más sobre el mismo índice |
| "estratégica" → "inteligente" | ✅ | Trivial |
| Sin logo en la pieza del informe | ✅ | Trivial |
| Botón "COMENCEMOS" | ✅ | Trivial |
| Footer con teléfonos reales, Facebook y YouTube | ✅ | Trivial |
| Hero con segmentación Invertir/Rentar | ✅ | Barato y mejora la conversión |
| Página del informe Reyna Insights en HTML | ✅ | Cumple el punto 5.1 del acuerdo, contenido ya redactado, página estática |
| **Sitio bilingüe** | ❌ | Excluido por el acuerdo. Base preparada, sin activar |
| **Noticias administrables (CMS)** | ❌ | No figura en el acuerdo. Fase aparte |
| **Galería con carga múltiple** | ❌ | El acuerdo define imagen principal + enlace a Drive |
| **Publicar nuevos informes desde el panel** | ❌ | Es el mismo CMS. Fase aparte |

**Sobre el idioma**: el sitio sale **solo en español**. El modelo de datos y el ruteo quedan preparados para sumar inglés sin migración, pero no se construye ni se carga contenido en inglés.

**Consecuencia sobre el modelo de datos**: se incorporan las entidades y campos que el acuerdo ya daba por modelados y que el plan de hoy había omitido — desarrollistas, zonas, propietarios, amenidades, antigüedad, estado de obra, m² cubiertos y totales.
