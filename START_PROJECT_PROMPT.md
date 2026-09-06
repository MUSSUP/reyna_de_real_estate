# Start Project

> ⚠️ **Este brief fue superado por la planificación v2.0 (20/08/2026).**
> El alcance vigente está en `planning/requirements.md` y `planning/scope.md`, tras el hallazgo del Documento de Cierre de Alcance (ver `docs/decision_log.md`, decisión D-06).
> Este archivo se conserva como registro del punto de partida.

---

## Project Description

**Project Name**: Reyna de Real Estate — Laura Cabral

**Marca (definido)**: **Reyna de Real Estate** es la marca madre. **Laura Cabral** es la persona detrás. Los logos nuevos dicen "Laura Cabral" y se mantienen así — conviven sin conflicto: el logo es la firma personal, la marca es Reyna. Los datos de contacto son siempre los de Reyna (`reynaderealestate.com`, `reynaderealestate@gmail.com`, `@reynaderealestate`); la pieza del informe que hoy lleva `lauracabralrealestate.com` debe corregirse.

**Dominio**: `reynaderealestate.com` (ya comprado)

**Project Type**: Sitio web público de captación (landing + catálogo buscable) con panel de administración para propiedades y noticias.

**Description**:
Sitio de **Reyna de Real Estate**, la marca de **Laura Cabral**, broker inmobiliaria radicada en México (Riviera Maya — Tulum, Holbox) especializada en **propiedades de lujo para inversión y renta**.

El sitio cumple cuatro funciones:
1. **Segmentar al visitante desde el primer scroll**: ¿venís a *invertir* o a *rentar*?
2. **Dejar buscar propiedades** con filtros reales y mostrar una selección destacada.
3. **Sostener autoridad** con contenido propio: el informe de mercado "Reyna Insights" y noticias que ella publica.
4. **Convertir**: formulario de contacto y WhatsApp.

**Estado del negocio hoy**: la clienta maneja múltiples propiedades — propias y de otros brokers con los que comparte cartera. Todo el material (fotos, fichas) vive **desordenado en Google Drive**. No hay sistema de gestión.

**Punto de partida real**: existe una versión en Bubble (`reynaprop.bubbleapps.io/version-test`) **bastante avanzada** — hero, buscador, destacadas, informe, "Conóceme" y footer ya están diseñados y con copy definitivo. Este proyecto la reemplaza por un sitio propio. El documento de la clienta (`design/referencias/correcciones-clienta.pdf`) es una **lista de correcciones sobre esa versión**, no un brief desde cero.

**Claim de marca**: *"Tu sueño. Nuestro propósito."* / *"Your dream is reality."*

---

## Estructura del sitio

Definida por la clienta. Capturas de la versión actual en `design/referencias/`.

**Sección 1 — Hero**
- Título: "Tu sueño. Nuestro propósito"
- Segmentación: **"¿QUÉ ESTÁS BUSCANDO HOY?"** → 🩷 **Invertir** / 🤍 **Rentar**

**Sección 2 — Buscador + Destacadas** · `sec2-buscador-destacadas.png`, `sec2-card-corregida.png`
- **Buscador con filtros**, antes de las destacadas, en la misma sección:
  - 📍 Ubicación · **Tipo de propiedad** · 🛏 Habitaciones · 💰 Presupuesto
  - Botón "BUSCAR PROPIEDADES"
- **Agregar TERRENOS** como tipo de propiedad — en el rubro, un terreno es un inmueble sin construir (compra de tierra). El filtro sigue llamándose "tipo de propiedad".
- **Destacadas** — cards en grilla de 3, achicarlas respecto de la versión actual:
  - Badge de dormitorios → **reemplazar por PAÍS** (queda: `PAÍS` + `TULUM`), porque los dormitorios ya aparecen abajo
  - Quitar la bajada que hoy va debajo del título "DESTACADAS"
  - Card: foto, badges, nombre, precio USD, m² / dormitorios / baños, botón "VER DETALLE"
- Botón final: **"VER TODAS LAS PROPIEDADES →"**

**Sección 3 — Reyna Insights** · `sec3-reyna-insights.png`, `sec3-informe-completo.png`
- Portada del informe: kicker "REYNA INSIGHTS · ANÁLISIS DEL MERCADO INMOBILIARIO", título **"BIENES RAÍCES: UNA OPORTUNIDAD DE CRECIMIENTO"**, sobre foto aérea de playa
- **Cambiar "¿por qué invertir sigue siendo una decisión ESTRATÉGICA?" → "INTELIGENTE"**
- **Quitar el logo** de esa pieza
- Botón "LEER INFORME COMPLETO ↓" → abre el informe, **repitiendo el título arriba**
- **El informe completo ya está redactado** (bloques: por qué invertir, invertir con información, visión a largo plazo, y 4 pilares: crecimiento patrimonial / generación de ingresos / diversificación / visión de largo plazo, con cita de McKinsey Global Institute)
- Cierre del informe: logo, web, email e instagram — **con los datos correctos** (ver conflicto de marca abajo)
- **Noticias administrables por la clienta** — quiere publicar novedades ella misma (ej: "Nuevo desarrollo en Tulum", "Tendencias en Madrid"). Es un CMS, no contenido fijo.

**Sección 4 — Conóceme** · `sec4-conoceme.png`
- Copy **ya redactado y aprobado**, se usa tal cual (está completo en el PDF)
- Retrato de Laura a la derecha, tarjeta crema sobre foto aérea de fondo
- Cierre: *"YOUR DREAM IS REALITY"*

**Sección 5 — Contacto**
- Formulario
- Botón de envío: **"COMENCEMOS"** (no "Enviar")

**Footer** · `footer.png`
- Banda crema con corona + **REYNA DE REAL ESTATE** (reemplaza "your dream")
- Teléfono y WhatsApp: **+54 9 351 819 4131** (Argentina) y **+52 984 311 5530** (México) — hoy están como `+52 XXX XXX XXXX`
- Email: reynaderealestate@gmail.com
- Íconos circulares verde petróleo: web, Instagram, WhatsApp, mail, YouTube — **falta agregar Facebook**
- Redes: IG @reynaderealestate · Facebook reynaderealestate · YouTube REYNAderealestate
- Todos los íconos deben redirigir

---

**Key Features**:

*Fase 1 — Sitio público + panel admin* (alcance de entrega)
- Hero con segmentación Invertir / Rentar
- **Buscador de propiedades** con filtros: ubicación, tipo de operación, habitaciones, presupuesto
- Resultados de búsqueda + **página de catálogo completo**
- Ficha individual de propiedad con galería
- Grilla de destacadas
- Reyna Insights: portada + informe completo
- Sección de noticias
- "Conóceme"
- Formulario de contacto con validación → captura de lead
- **Botón flotante de WhatsApp** con mensaje prellenado
- Footer con redes enlazadas
- Responsive, mobile-first, optimizado para velocidad
- SEO: metadatos, Open Graph, indexación, dominio propio

*Fase 1b — Panel de administración* (mismo alcance de entrega, se construye después del sitio público)
- Login para la administradora
- **ABM de propiedades**: alta, edición, baja, galería, marcar destacada, orden
- **ABM de noticias** — requisito explícito de la clienta
- Edición de textos de secciones sin tocar código
- **Bandeja de leads**: ver, filtrar y exportar
- Credenciales según los 3 niveles del template

*Fase 2 — Integración con sistema inmobiliario (post-presentación a la clienta)*
- Sincronizar el catálogo desde un CRM en vez de cargarlo a mano

**Users/Roles**:
- **Visitante (anónimo)** — inversionista o interesado en rentar. No se registra. Busca, filtra, mira fichas, lee contenido, contacta.
- **Administradora (Laura Cabral)** — carga propiedades, publica noticias, consulta leads. Fase 1b.
- **Desarrollo (Musapp)** — acceso técnico, despliegue, mantenimiento.

**Integrations**:
- **WhatsApp Business** — canal principal. Enlace `wa.me` con mensaje prellenado. Dos números (AR y MX).
- **Instagram, Facebook, YouTube** — enlaces desde el footer.
- **Google Drive** — origen actual de las fotos. Se migran y optimizan al proyecto; no se consume Drive en vivo.
- **Destino de los leads** — *a definir*.
- **CRM inmobiliario** — no existe hoy. Fase 2.

**Constraints**:
- **Hosting (definido)**: **Netlify plan free** (permite uso comercial, a diferencia de Vercel Hobby) + **base de datos y storage de imágenes externos**, con `reynaderealestate.com` apuntado.
  - Recomendación preliminar a validar en planificación: **Supabase** free resuelve base + storage + auth del panel en un solo servicio. Alternativa: Neon (base) + Cloudinary (imágenes).
  - ⚠️ **Riesgo conocido**: los free tiers se pausan por inactividad (Supabase suspende tras ~1 semana sin uso; Neon autosuspende). En un sitio de bajo tráfico esto degrada la primera carga. Definir mitigación durante la planificación.
  - **Plan B, no plan A**: el VPS Hetzner propio queda como red de emergencia si los free tiers resultan insuficientes. No se usa por defecto.
- **⚠️ Independencia de la infraestructura (requisito del proyecto)**: el desarrollo no debe quedar atado a cuentas ni servidores de Musapp. La clienta es una amiga y el favor no puede convertirse en una dependencia permanente.
  - **Todas las cuentas de servicio (Netlify, base de datos, storage) se crean con `reynaderealestate@gmail.com`** — Musapp tiene acceso a esa casilla (la creó), así que puede darlas de alta sin fricción. Salir del proyecto = quitarse como colaborador, no migrar cuentas.
  - **Dominio: ✅ resuelto.** `reynaderealestate.com` ya lo administra la clienta.
  - **⚠️ Dependencia externa**: el apuntado de DNS hacia Netlify depende de la clienta, que administra el dominio. **Resolver temprano, no el día del lanzamiento** — pedir acceso de colaborador al registrador o coordinar la ventana con anticipación. *Pendiente: identificar en qué registrador está (GoDaddy, Namecheap, etc.), porque el procedimiento de DNS cambia según cuál sea.*
  - **Portabilidad por diseño**: Postgres estándar sin funciones propietarias del proveedor, y proyecto Docker-ready aunque el deploy sea en Netlify. Mudar de hosting debe ser un deploy, nunca una reescritura.
- **Catálogo curado**: arrancamos con pocas propiedades (orden de 5 a 10). Es una decisión de producto — menos carga de trabajo para la clienta y un catálogo elegido a mano — **no una restricción técnica**: el costo de hosting lo determinan las imágenes y el tráfico, no la cantidad de registros.
- **Marca y copy ya definidos** — se respetan, no se reinventan. El glassmorphism por defecto del template **no aplica**: el registro es lujo, no tech.
- **Proyecto para un tercero**, plazo dilatado: prioridad a publicar el sitio antes que el panel.
- Sin secretos hardcodeados — 3 niveles del template.
- Español principal. *A confirmar*: versión en inglés.

---

## Identidad visual (ya definida)

| Rol | Valor |
|-----|-------|
| Rosa primario | `#FB5696` (hover `#e03d7e`) |
| Verde petróleo secundario | `#1E4F4C` (claro `#255f5b`, oscuro `#0f1e1d`) |
| Dorado | `#C9A96E` (claro `#dfc089`) |
| Superficie crema | `#F2E9E4` |
| Texto | `#3a3a3a` / `#6b6b6b` |
| Tipografía títulos | Playfair Display (serif) |
| Tipografía subtítulos | Cinzel (serif) |
| Tipografía cuerpo | Montserrat (sans-serif) |

**Uso observado**: fondos crema y verde petróleo, títulos serif en verde oscuro, acentos y CTAs en rosa, botones secundarios en verde petróleo. **Corona rosa** como isotipo recurrente (separadores, logo, viñetas).

**Logos**: isotipo LC en negro y blanco sin fondo; logo completo en cinco combinaciones (blanco+rosa, negro+rosa, negro+verde, rosa+verde, verde+rosa). En `~/Desktop/Musapp/REINA DEL REALESTATE/`.

**Otros insumos**: `Index.html` — landing previa funcional, referencia de tono, no base de código. Video y piezas de Instagram. `Propuesta Desarrollo Reyna Real State.pdf`.

---

## Decisiones ya tomadas

| Tema | Definición |
|------|-----------|
| Marca | Reyna de Real Estate = marca madre · Laura Cabral = persona. Logos actuales se mantienen. Datos de contacto siempre los de Reyna. |
| Alcance de entrega | Sitio público **+ panel admin**, ambos en la primera entrega. |
| Catálogo | Curado, ~5 a 10 propiedades al inicio. Decisión de producto, no técnica. |
| Filtro | Se mantiene **"tipo de propiedad"**, con **terreno** como uno de los tipos. |
| Hosting | Netlify free + base/storage externos. VPS Hetzner solo como red de emergencia. |
| Independencia | Cuentas creadas con el mail de la marca, dominio ya administrado por la clienta, arquitectura portable. Musapp no queda como infraestructura permanente. |

---

## Decisiones pendientes (para resolver en planificación)

1. **Proveedor de base de datos y storage** — Supabase (base + storage + auth en uno) vs. Neon + Cloudinary. Incluye definir cómo mitigar la pausa por inactividad del free tier.

2. **WhatsApp principal** — hay dos números, +54 9 351 819 4131 (AR) y +52 984 311 5530 (MX). ¿Cuál recibe los contactos del sitio? ¿Se elige por país del visitante?

3. **Dónde caen los leads** del formulario: mail, Google Sheets, base propia del panel, o combinación.

4. **Sistema de gestión inmobiliaria (Fase 2)** — recomendación preliminar para México: **EasyBroker** (API REST pública, muy extendido en México, sindica a Inmuebles24 y Lamudi, permite compartir cartera entre brokers) por sobre Tokko Broker o Wasi. Se evalúa recién después de presentarle el sitio a la clienta.

5. **Idioma** — solo español, o español + inglés (el claim de marca es bilingüe y el público es inversor internacional).

6. **Qué pasa con la app de Bubble** al publicar este sitio.

7. **Registrador del dominio** — identificar dónde está registrado `reynaderealestate.com` y coordinar con la clienta el acceso para el apuntado de DNS. Dependencia externa: resolver temprano.

8. **Corrección de la pieza del informe** — hoy lleva `lauracabralrealestate.com`. ¿La rehacés vos en Canva o se reconstruye como HTML dentro del sitio? (Reconstruirla en HTML la haría editable y indexable por buscadores.)

---

## What Happens Next

1. The system enters Planning Mode
2. Requirements are analyzed, questions are asked
3. Architecture, stack, and user journeys are proposed
4. A plan is presented for your approval
5. Only after your approval does implementation begin
