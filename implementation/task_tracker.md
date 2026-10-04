# Seguimiento — Reyna de Real Estate

Actualizado: 2026-08-22 · Estado: **en ejecución — Hito 1**
Alcance: **v3.0 — híbrido ampliado, español** (decisiones B5 y D-11)

Leyenda: ⬜ pendiente · 🟡 en curso · ✅ terminado · ⏸️ bloqueado

---

## Progreso

| Bloque                       | Tareas | Estado                                             |
| ---------------------------- | ------ | -------------------------------------------------- |
| Infraestructura              | 8      | 🟢 6/8 (+2 parciales)                              |
| Hito 1 · Visitante           | 6      | ✅ 6/6                                             |
| Hito 2 · Administración      | 7      | 🟢 3/7                                             |
| Hito 3 · Contenido y entrega | 7      | 🟢 3/7                                             |
| **Total**                    | **28** | **18/28** terminadas · 2 parciales · 9 sin empezar |

---

## Infraestructura

| ID    | Tarea                                         | Estado |
| ----- | --------------------------------------------- | ------ |
| IT-01 | Esqueleto del proyecto                        | ✅     |
| IT-02 | Base de datos y migraciones                   | ✅     |
| IT-03 | Imágenes y almacenamiento (portada + galería) | ✅     |
| IT-04 | Autenticación                                 | ✅     |
| IT-05 | Sistema de diseño                             | ✅     |
| IT-06 | Envío de correo                               | 🟡     |
| IT-07 | Datos de demostración                         | ✅     |
| IT-08 | Entorno Docker y despliegue                   | 🟡     |

**🔍 Revisión de hito** tras IT-08 — `/review`

---

## Hito 1 · El visitante encuentra y consulta una propiedad

| ID    | Journey                            | Estado | Notas                                                        |
| ----- | ---------------------------------- | ------ | ------------------------------------------------------------ |
| UJ-01 | Descubrir la marca y elegir camino | ✅     | Hero con imagen de respaldo hasta que llegue el video (D-10) |
| UJ-02 | Ver destacadas                     | ✅     | Carrusel, card corregida                                     |
| UJ-03 | Buscar y filtrar                   | ✅     | 4 filtros, en el navegador                                   |
| UJ-04 | Ver ficha de propiedad             | ✅     | **Galería** + enlace Drive                                   |
| UJ-05 | Contactar por WhatsApp             | ✅     | +52 984 311 5530. Un solo armador de enlaces                 |
| UJ-06 | Enviar consulta                    | ✅     | Único endpoint público. Funciona sin JavaScript. 21 pruebas  |

**🔍 Revisión de hito** tras UJ-06 — `/review`
**🎯 Punto de presentación**: acá ya se le puede mostrar a la clienta.

---

## Hito 2 · La administradora gestiona el catálogo

| ID    | Journey                      | Estado | Notas                                                        |
| ----- | ---------------------------- | ------ | ------------------------------------------------------------ |
| UJ-07 | Entrar al panel              | ✅     |                                                              |
| UJ-08 | Publicar una propiedad       | ✅     | Formulario, portada y galería. Faltan los catálogos (UJ-08b) |
| UJ-09 | Elegir y ordenar destacadas  | ⬜     |                                                              |
| UJ-10 | Publicar noticias e informes | ⬜     | **Nuevo (D-11)**                                             |
| UJ-11 | Revisar contactos            | ⬜     |                                                              |
| UJ-12 | Editar textos del sitio      | ⬜     |                                                              |
| UJ-13 | Publicar cambios             | ✅     | Webhook de rebuild                                           |

**🔍 Revisión de hito** tras UJ-13 — `/review`

---

## Hito 3 · Contenido, calidad y entrega

| ID    | Tarea                                    | Estado | Notas                                                            |
| ----- | ---------------------------------------- | ------ | ---------------------------------------------------------------- |
| UJ-14 | Leer el informe Reyna Insights           | ✅     | "estratégica" → "inteligente"                                    |
| UJ-15 | Leer las noticias                        | ✅     | **Adelantado del Hito 3**: el menú ya lo enlazaba (revisión I-1) |
| UJ-16 | Conocer a Laura                          | ✅     | Texto aprobado. **Diseñar para que funcione sin foto** (D-10)    |
| IT-09 | Auditoría de rendimiento y accesibilidad | ⬜     |                                                                  |
| IT-10 | Auditoría de seguridad final             | ⬜     | Obligatoria. Verificar que `owners` no se filtre                 |
| IT-11 | Verificación con y sin datos             | ⬜     | Obligatoria                                                      |
| IT-12 | Despliegue y entrega                     | ⬜     | DNS en Don Web, con acceso ✅                                    |

**🔍 Revisión final** antes de entregar — `/review`

---

## Acciones fuera del desarrollo

Bloquean la entrega pero no son código.

| #        | Acción                                                                                                                                                                                                                 | Responsable      | Cuándo                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------ |
| ~~A-01~~ | ~~Registrador del dominio~~ ✅ **Resuelto**: Don Web, cuenta de Musapp, acceso total al DNS                                                                                                                            | —                | —                        |
| A-08     | **Transferir el dominio a la clienta** una vez entregado el sitio                                                                                                                                                      | Musapp           | Post-entrega             |
| A-10     | **Que Laura ponga su propia contraseña del panel.** Hoy la usuaria del panel (`reynaderealestate@gmail.com`) tiene una contraseña que conoce Musapp. Volver a correr `npm run db:crear-admin` con ella presente        | Musapp + clienta | En la entrega            |
| A-11     | **Quitar el bloqueo de indexación.** Borrar `frontend/public/robots.txt` y la cabecera `X-Robots-Tag` de `netlify.toml`. Son las dos cosas. Se puso para que el sitio de ensayo con datos falsos no aparezca en Google | Musapp           | Antes de la entrega      |
| A-09     | **Definir el nombre de marca**: el logo dice "Laura Cabral" y el pie dice "Reyna de Real Estate". Conviven en la misma página                                                                                          | Clienta          | Antes de la entrega      |
| A-02     | Crear cuentas de Netlify, Supabase y Resend con `reynaderealestate@gmail.com`                                                                                                                                          | Musapp           | Antes de IT-02           |
| A-03     | **Video del hero**: el `.mp4` local no sirve (vertical 9:16, tema ajeno). Se arranca con stock gratuito de Pexels o Coverr; el definitivo se carga después desde el panel (D-10)                                       | Musapp           | Antes de UJ-01           |
| A-03b    | **Retrato de Laura**: no se usa genérico. La sección se diseña sin foto y se suma cuando llegue (D-10)                                                                                                                 | Clienta          | Cuando lo tenga          |
| A-04     | Reunir fotos reales y armar una carpeta de Drive por propiedad                                                                                                                                                         | Clienta          | Antes de la entrega      |
| ~~A-05~~ | ~~Confirmar a qué mail llegan las consultas~~ ✅ **Resuelto** (2026-08-23): `reynaderealestate@gmail.com`, confirmado por la clienta                                                                                   | —                | —                        |
| A-06     | Confirmar derechos de uso de fotos de cartera compartida                                                                                                                                                               | Clienta          | Antes de publicar (R-07) |
| A-07     | **Confirmar el alcance final por escrito con la clienta.** El borrador vive fuera del repositorio                                                                                                            | Musapp           | **Antes de construir**   |

---

## Bitácora

| Fecha      | Evento                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-20 | Brief completado a partir del documento de la clienta y las referencias visuales                                                                                                                                                      |
| 2026-08-20 | Planificación v1: alcance amplio, bilingüe, con CMS de noticias                                                                                                                                                                       |
| 2026-08-20 | **Hallazgo**: apareció el Documento de Cierre de Alcance del 29/06 en Drive, que contradecía el plan en 9 puntos                                                                                                                      |
| 2026-08-20 | Decisión B5: alcance híbrido acotado, español. Plan reescrito a v2.0                                                                                                                                                                  |
| 2026-08-20 | Planificación completa v2.0                                                                                                                                                                                                           |
| 2026-08-21 | Dominio resuelto: Don Web, con acceso de Musapp. Riesgo R-04 cerrado                                                                                                                                                                  |
| 2026-08-21 | Decisión D-11: se suman galería y noticias/informes. Bilingüe sigue afuera. Plan a v3.0 — 28 tareas                                                                                                                                   |
| 2026-08-22 | **UJ-06 completada. Hito 1 cerrado.** Formulario de consulta que funciona sin JavaScript (D-16). El límite por IP se separó por ámbito (D-18). Se sumó vitest: 21 pruebas contra un Postgres real                                     |
| 2026-08-23 | **Revisión del Hito 1**: 0 críticos, 8 importantes, 13 menores. Se cerraron 4 — el error silencioso sin JS, la galería con teclado, el ancho/alto de portada y el enlace roto a `/noticias`                                           |
| 2026-08-23 | **UJ-15 completada** (adelantada del Hito 3). `/noticias` existía en el menú desde UJ-01 y la página no. El cuerpo editable nunca se inserta como HTML                                                                                |
| 2026-08-22 | **Logo real reemplazado** (D-15). Llegaron los originales de la clienta: corona rosa en todo, paleta intacta. La corona se vectorizó para conservar `currentColor`. De paso apareció que `og-default.png` se referenciaba sin existir |
| 2026-08-22 | **UJ-05 completada.** El enlace de WhatsApp se arma en un solo lugar. Tres correcciones: la ficha usaba dos mensajes distintos, el 404 no tenía el botón y el número de Argentina abría sin mensaje                                   |
| 2026-08-22 | Corregido el seguimiento: UJ-02 figuraba pendiente aunque estaba terminada desde el 21                                                                                                                                                |
| 2026-08-21 | **UJ-04 completada.** Ficha con galería, datos, amenidades, Drive y similares. 12 páginas generadas                                                                                                                                   |
| 2026-08-21 | **UJ-03 completada.** Buscador de 4 filtros y catálogo. 13 casos verificados. El estado vive en la URL y se puede compartir                                                                                                           |
| 2026-08-21 | **UJ-02 completada.** Carrusel de destacadas con el formato aprobado. Dos correcciones: arrancaba desplazado, y el script violaba la política de seguridad                                                                            |
| 2026-08-21 | **UJ-01 completada.** Home con hero, barra, pie con las seis redes, WhatsApp flotante y 404 con marca. Cero JavaScript                                                                                                                |
| 2026-08-21 | **IT-08 implementada.** Cabeceras de seguridad verificadas contra el sitio real. Falta probar Docker (no está instalado en el equipo)                                                                                                 |
| 2026-08-21 | **IT-07 completada.** 8 propiedades, 39 imágenes, informe y noticias cargados en Supabase real. Ocupa 1,3 MB de 1 GB                                                                                                                  |
| 2026-08-21 | **IT-06 implementada.** Correo con Resend; verificado que un fallo del proveedor no pierde la consulta. Falta probar un envío real (necesita cuenta de Resend)                                                                        |
| 2026-08-21 | **Supabase conectado.** Migraciones aplicadas sobre Postgres 17.6 real; subida de imágenes verificada contra el bucket. Cierra las verificaciones pendientes de IT-02, IT-03 e IT-04                                                  |
| 2026-08-21 | **IT-05 completada.** Componentes base y muestrario. La animación pasó a CSS puro (D-14): la página no carga JavaScript                                                                                                               |
| 2026-08-21 | **IT-04 completada.** JWT + bcrypt 12, límite por IP persistido (D-13: tabla nueva `login_attempts`)                                                                                                                                  |
| 2026-08-21 | **IT-03 completada.** Validación por firma binaria y variantes WebP. Dos defectos corregidos: variantes duplicadas y dimensiones EXIF invertidas                                                                                      |
| 2026-08-21 | **IT-02 completada.** 12 tablas, migración verificada con PGlite: cascadas, restricciones y valores por defecto correctos                                                                                                             |
| 2026-08-21 | **IT-01 completada.** Astro 7 + React 19 + Tailwind 4 funcionando. Decisión D-12: se subió de Astro 5 a 7 por XSS en el framework; vulnerabilidades de 12 a 7                                                                         |
