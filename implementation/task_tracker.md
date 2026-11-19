# Seguimiento — Reyna de Real Estate

Actualizado: 2026-11-10 · Estado: **en ejecución — Hito 3, antes de entregar**
Alcance: **v3.0 — híbrido ampliado, español** (decisiones B5 y D-11)

Leyenda: ⬜ pendiente · 🟡 en curso · ✅ terminado · ⏸️ bloqueado

---

## Progreso

> Los números salen de contar los estados de las tablas de abajo, uno por uno.
> Estuvieron inflados dos veces: conviene recontar antes de tocarlos.

| Bloque                  | Tareas | Estado                                                       |
| ----------------------- | ------ | ------------------------------------------------------------ |
| Infraestructura         | 12     | 🟢 9/12 · 3 parciales (IT-08, IT-09, IT-12)                  |
| Hito 1 · Visitante      | 6      | ✅ 6/6                                                       |
| Hito 2 · Administración | 8      | ✅ 8/8 · **cerrado** (incluye UJ-08b)                        |
| Hito 3 · Contenido      | 3      | ✅ 3/3 (UJ-14, UJ-15, UJ-16)                                 |
| Hito 4 · Autonomía      | 4      | ✅ 4/4 · **probado en vivo** (UJ-17 a UJ-19) + UJ-20         |
| **Total**               | **33** | **30 terminadas · 3 parciales**                              |

> Las IT-09 a IT-12 figuran en la tabla del Hito 3 por orden de trabajo, pero se cuentan
> como infraestructura. Antes se contaban en los dos lados: de ahí los números inflados.

**Lo que falta, y de quién depende**:

| Qué                                                         | Quién         | Traba                       |
| ----------------------------------------------------------- | ------------- | --------------------------- |
| IT-12 · abrir el sitio a Google (A-11) y transferir (A-08)  | Musapp        | la entrega                  |
| IT-09 · medir el peso de la portada con las fotos reales    | espera a A-04 | la auditoría de rendimiento |
| IT-08 · `docker compose up` no levanta el almacenamiento    | decisión      | nada: Netlify ya sirve      |

---

## Infraestructura

| ID    | Tarea                                         | Estado |
| ----- | --------------------------------------------- | ------ |
| IT-01 | Esqueleto del proyecto                        | ✅     |
| IT-02 | Base de datos y migraciones                   | ✅     |
| IT-03 | Imágenes y almacenamiento (portada + galería) | ✅     |
| IT-04 | Autenticación                                 | ✅     |
| IT-05 | Sistema de diseño                             | ✅     |
| IT-06 | Envío de correo                               | ✅     |
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

| ID    | Journey                      | Estado | Notas                                                         |
| ----- | ---------------------------- | ------ | ------------------------------------------------------------- |
| UJ-07 | Entrar al panel              | ✅     |                                                               |
| UJ-08 | Publicar una propiedad       | ✅     | Formulario, portada y galería. Faltan los catálogos (UJ-08b)  |
| UJ-09 | Elegir y ordenar destacadas  | ✅     | Se arrastra, y sin JavaScript también anda                    |
| UJ-10 | Publicar noticias e informes | ✅     | **Nuevo (D-11)**. Listado, alta, edición e imagen             |
| UJ-11 | Revisar contactos            | ✅     |                                                               |
| UJ-12 | Editar textos del sitio      | ✅     | 19 claves. Las direcciones se validan al guardar y al dibujar |
| UJ-13 | Publicar cambios             | ✅     | Webhook de rebuild                                            |

| UJ-08b | Catálogos | ✅ | Las cinco listas. Nada se borra si está en uso |

**🔍 Revisión de hito** tras UJ-13 — `/review`

---

## Hito 3 · Contenido, calidad y entrega

| ID    | Tarea                                    | Estado | Notas                                                                                                                                                          |
| ----- | ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UJ-14 | Leer el informe Reyna Insights           | ✅     | "estratégica" → "inteligente"                                                                                                                                  |
| UJ-15 | Leer las noticias                        | ✅     | **Adelantado del Hito 3**: el menú ya lo enlazaba (revisión I-1). El paginado que pedía el criterio se agregó el 10/11, nueve por página                       |
| UJ-16 | Conocer a Laura                          | ✅     | Texto aprobado. **Diseñar para que funcione sin foto** (D-10)                                                                                                  |
| IT-09 | Auditoría de rendimiento y accesibilidad | 🟡     | Menú móvil resuelto. Falta contraste, foco y pesos                                                                                                             |
| IT-10 | Auditoría de seguridad final             | ✅     | Obligatoria. `owners` verificado en vivo. 1 riesgo aceptado                                                                                                    |
| IT-11 | Verificación con y sin datos             | ✅     | Obligatoria. Las dos mitades hechas: con datos y con la base vacía (parche a PGlite, revertido)                                                                                                     |
| IT-12 | Despliegue y entrega                     | 🟡     | Guía de la clienta en `/admin/ayuda` ✅ · documento de entrega ✅ · `sitemap.xml` ✅ · dominio `reynaderealestate.com` apuntado y sirviendo por HTTPS ✅. **Falta abrir a Google (A-11) y transferir (A-08)** |

**🔍 Revisión final** antes de entregar — `/review`

---

## Acciones fuera del desarrollo

Bloquean la entrega pero no son código.

| #        | Acción                                                                                                                                                                                                                 | Responsable      | Cuándo                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------ |
| ~~A-01~~ | ~~Registrador del dominio~~ ✅ **Resuelto**: Don Web, cuenta de Musapp, acceso total al DNS                                                                                                                            | —                | —                        |
| A-08     | **Transferir el dominio a la clienta** una vez entregado el sitio                                                                                                                                                      | Musapp           | Post-entrega             |
| A-10     | ~~Que Laura ponga su propia contraseña del panel~~ **El Hito 4 lo resolvió**: lo hace ella sola desde "¿Olvidaste tu contraseña?", sin script y sin que nadie vea la clave. Queda cerrado si la que puso en la prueba del 19/11 es la que se queda                                                              | Clienta          | Hecho el 19/11           |
| A-11     | **Quitar el bloqueo de indexación.** Borrar `frontend/public/robots.txt` y la cabecera `X-Robots-Tag` de `netlify.toml`. Son las dos cosas. Se puso para que el sitio de ensayo con datos falsos no aparezca en Google | Musapp           | Antes de la entrega      |
| A-09     | **Definir el nombre de marca**: el logo dice "Laura Cabral" y el pie dice "Reyna de Real Estate". Conviven en la misma página                                                                                          | Clienta          | Antes de la entrega      |
| A-02     | Crear cuentas de Netlify, Supabase y Resend con `reynaderealestate@gmail.com`                                                                                                                                          | Musapp           | Antes de IT-02           |
| A-03     | **Video del hero**: el `.mp4` local no sirve (vertical 9:16, tema ajeno). Se arranca con stock gratuito de Pexels o Coverr; el definitivo se carga después desde el panel (D-10)                                       | Musapp           | Antes de UJ-01           |
| A-03b    | **Retrato de Laura**: no se usa genérico. La sección se diseña sin foto y se suma cuando llegue (D-10)                                                                                                                 | Clienta          | Cuando lo tenga          |
| A-04     | Reunir fotos reales y armar una carpeta de Drive por propiedad                                                                                                                                                         | Clienta          | Antes de la entrega      |
| ~~A-05~~ | ~~Confirmar a qué mail llegan las consultas~~ ✅ **Resuelto** (2026-08-23): `reynaderealestate@gmail.com`, confirmado por la clienta                                                                                   | —                | —                        |
| A-06     | Confirmar derechos de uso de fotos de cartera compartida                                                                                                                                                               | Clienta          | Antes de publicar (R-07) |
| A-07     | **Confirmar el alcance final por escrito con la clienta.** El borrador vive fuera del repositorio                                                                                                                      | Musapp           | **Antes de construir**   |
| ~~A-12~~ | ~~Marcar `RESEND_API_KEY` como "Contains secret values"~~ ✅ **Resuelto el 19/11**: marcada como secreta y limitada a Builds, Functions y Runtime                                                                      | —                | —                        |

---

## Hito 4 · Autonomía de la clienta

Fuera del alcance original. Se abrió el 11/11 por pedido explícito, con el motivo de que la
clienta no dependa de nadie después de la transferencia.

| #     | Journey                             | Estado | Notas                                                                                                                   |
| ----- | ----------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| UJ-17 | Recuperar la contraseña             | ✅     | Token cifrado en la base, vence en 1 h, un solo uso. El enlace se arma con el dominio configurado, no con `Host`        |
| UJ-18 | Dar acceso a alguien desde el panel | ✅     | Invitar manda un enlace, nunca una contraseña. Barandas: nadie se quita a sí misma ni deja el panel sin acceso completo |
| UJ-19 | Permisos por rol                    | ✅     | `completo` y `contenido`. Lo reservado: propietarios, configuración y usuarios                                          |
| UJ-20 | Recordar que el sitio no está en Google | ✅     | Recuadro en el tablero, sólo para acceso completo. El botón dice "Ya le avisé", no "Entendido"                          |

**Cerrado el 19/11.** La migración `0006` se aplicó en la base de la clienta, se desplegó y se probó
en vivo: recuperar la contraseña, invitar con permiso de contenido y comprobar que los propietarios
no aparecen con ese acceso.

---

## Bitácora

| Fecha      | Evento                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-19 | **IT-06 cerrada**: llegó el aviso de consulta nueva, así que las dos plantillas de correo están vistas en una bandeja real. Arreglado el filtro de consultas —filtraba bien, mentía la lista: una fila que cambiaba de estado se quedaba contradiciendo al filtro—. Borradas las cinco consultas de prueba de agosto, con la lista confirmada antes. Encabezado ajustado: verde entero al 70% |
| 2026-11-19 | **IT-08 probado con Docker ya instalado.** Postgres levanta sano y acepta el esquema entero; MinIO no, porque retiró sus imágenes públicas de los dos registros. Queda como decisión, no como arreglo. Mismo día: UJ-20 y la corrección de A-11, que mandaba quitar tres cabeceras cuando sólo una era del bloqueo temporal — las otras dos esconden el panel |
| 2026-11-19 | **Hito 4 en vivo y probado de punta a punta con la clienta.** Migración `0006` aplicada, despliegue encendido, y verificado con ella: recuperó la contraseña sola, invitó un acceso de contenido y comprobó que los propietarios no aparecen. Correo de recuperación recibido de verdad: primer envío real de Resend confirmado |
| 2026-08-20 | Brief completado a partir del documento de la clienta y las referencias visuales                                                                                                                                                                                                                                                                                                                              |
| 2026-08-20 | Planificación v1: alcance amplio, bilingüe, con CMS de noticias                                                                                                                                                                                                                                                                                                                                               |
| 2026-08-20 | **Hallazgo**: apareció el Documento de Cierre de Alcance del 29/06 en Drive, que contradecía el plan en 9 puntos                                                                                                                                                                                                                                                                                              |
| 2026-08-20 | Decisión B5: alcance híbrido acotado, español. Plan reescrito a v2.0                                                                                                                                                                                                                                                                                                                                          |
| 2026-08-20 | Planificación completa v2.0                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-08-21 | Dominio resuelto: Don Web, con acceso de Musapp. Riesgo R-04 cerrado                                                                                                                                                                                                                                                                                                                                          |
| 2026-08-21 | Decisión D-11: se suman galería y noticias/informes. Bilingüe sigue afuera. Plan a v3.0 — 28 tareas                                                                                                                                                                                                                                                                                                           |
| 2026-10-17 | **IT-11 completada.** La mitad sin datos se hizo parcheando la capa de datos y revirtiendo: sin tocar la base ni sumar dependencias. El catálogo vacío hablaba de "esos criterios" sin que nadie hubiera filtrado nada                                                                                                                                                                                        |
| 2026-10-18 | **IT-10 completada.** Secretos limpios en toda la historia, los 17 endpoints del panel exigen sesión, la cookie sale con `Secure` en producción —cierra el hallazgo del Hito 2— y `owners` no se filtra. Un riesgo aceptado: vulnerabilidades de `undici` en tiempo de construcción, porque arreglarlas rompe el build                                                                                        |
| 2026-10-19 | **Portón de despliegues y cupo visible.** El plan gratuito son **20 despliegues por mes** y el 18/10 se agotaron: quince los gastó el desarrollo. Desde ahora sólo despliega el botón del panel o un commit con `[desplegar]`, y el panel muestra cuántas publicaciones quedan                                                                                                                                |
| 2026-10-30 | **La función que cuida las fotos no podía avisar que estaba rota.** Sus tres finales devolvían 200. Ahora devuelve 500 y corre todos los días en vez de cada tres. Cierra también I-4 del Hito 1 y acota la suite a dos procesos                                                                                                                                                                              |
| 2026-11-07 | **Revisión final** (la obligatoria antes de entregar): 3 críticos, 9 importantes, 6 menores                                                                                                                                                                                                                                                                                                                   |
| 2026-11-10 | **Cerrada la revisión final** salvo lo que depende de afuera: los dos críticos de código, los nueve importantes y los seis menores. Se agregó el paginado que a UJ-15 le faltaba por escrito y los enlaces que a UJ-10 le faltaban. Verificado construyendo contra PGlite, sin Supabase. **Quedan C-1** —probar una publicación real, necesita Netlify— **e I-9** —avisos por correo, necesita Resend—        |
| 2026-11-10 | **Desplegado.** Los nueve commits que esperaban desde el 18/10, en un solo despliegue. El portón dejó pasar su propio despliegue. Verificado en vivo: fotos, las tres páginas de consulta no enviada, la página de error y el aviso de contraseña. **Queda C-1**: apretar "Publicar cambios" desde el panel                                                                                                   |
| 2026-11-10 | **C-1 cerrado.** Se apretó "Publicar cambios" en el panel y el sitio cambió: `build.json` avanzó de 15:06 a 15:12. El portón queda probado por los tres caminos — push con marca, webhook del panel, y cancelar lo que no la lleva. **No queda código sin verificar**                                                                                                                                         |
| 2026-11-10 | **IT-12 arrancada.** La guía de la clienta vive en el panel (`/admin/ayuda`), sin consultar la base para que funcione con Supabase pausada. Más `docs/entrega.md` para quien herede el código, y el `sitemap.xml`. **Hallazgo**: `PUBLIC_SITE_URL` en Netlify apunta a la dirección de Netlify, así que al apuntar el dominio hay que cambiarla o las canónicas quedan mandando a Google a la dirección vieja |
| 2026-11-11 | **Hito 4, fuera del alcance original.** Recuperación de contraseña, usuarios desde el panel y permisos por rol. **Una prueba encontró que `crearToken` no guardaba el rol en el token**: los permisos no habrían funcionado nunca y todos habrían quedado con acceso completo, en silencio                                                                                                                    |
| 2026-11-11 | **Dominio propio en vivo.** `reynaderealestate.com` con certificado de Let's Encrypt; `www` y `http` redirigen a la raíz. Se borró `PUBLIC_SITE_URL` y el despliegue trajo tres cosas juntas: la guía de la clienta, las canónicas con el dominio propio y el mapa del sitio corregido. **Falta de IT-12**: Resend y la transferencia                                                                         |
| 2026-10-17 | **IT-11, primera mitad.** El mensaje "no encontramos propiedades" **no podía aparecer nunca**: el script ocultaba por atributo y el marcado por clase, y la clase gana. Con una búsqueda sin resultados la página quedaba en blanco                                                                                                                                                                           |
| 2026-10-17 | **Menú del celular** (IT-09). Los enlaces del encabezado estaban ocultos por debajo de 640 px: desde la ficha de una propiedad en un teléfono no se llegaba al catálogo. Es un `<details>`, así que anda sin JavaScript                                                                                                                                                                                       |
| 2026-10-17 | **Revisión del Hito 2**: 1 crítico, 9 importantes, 13 menores. Todos los importantes cerrados. El crítico: un informe publicado no tenía página y el panel mandaba al 404. Y había declarado UJ-10 completa sin cumplir 4 de sus criterios escritos — los leí después                                                                                                                                         |
| 2026-10-17 | **Migración 0005**: `updated_at` en las cinco tablas de catálogo. Sin esto, renombrar una zona no encendía el aviso de cambios sin publicar. ⚠️ Hay que correrla contra la base antes del próximo despliegue                                                                                                                                                                                                  |
| 2026-10-17 | **UJ-08b completada. Hito 2 cerrado.** Las cinco listas del formulario se administran desde el panel: hasta hoy había que entrar a la base para sumar una zona. Nada se borra si está en uso — para tres de los cinco, la base lo habría borrado en silencio                                                                                                                                                  |
| 2026-10-17 | **UJ-10 completada.** La clienta ya puede escribir noticias e informes: era el último hueco de autonomía. La página pública existía desde agosto y las que estaban las había cargado yo con la siembra                                                                                                                                                                                                        |
| 2026-10-17 | **UJ-12 completada.** Los textos del sitio se editan desde el panel. Lo importante es de seguridad: tres de esas claves van dentro de un atributo, y un `javascript:` en un `href` se ejecuta aunque se escape. Se valida en positivo y dos veces                                                                                                                                                             |
| 2026-10-17 | **UJ-09 completada.** Dos listas que se arrastran, y botones de verdad para que ande desde el celular. El orden del carrusel no existía: `featured_order` quedaba nulo y la portada se armaba distinta en cada construcción                                                                                                                                                                                   |
| 2026-10-17 | **Supabase se mantiene despierta sola.** Función programada en Netlify que consulta la base cada tres días. El plan gratuito pausaba el proyecto tras una semana sin actividad y las fotos del sitio desaparecían solas: pasó dos veces durante el desarrollo                                                                                                                                                 |
| 2026-10-17 | Corregidos errores de revisión de código que había introducido en `propiedad.js` y no vi, porque solo miré la última línea de la salida                                                                                                                                                                                                                                                                       |
| 2026-08-22 | **UJ-06 completada. Hito 1 cerrado.** Formulario de consulta que funciona sin JavaScript (D-16). El límite por IP se separó por ámbito (D-18). Se sumó vitest: 21 pruebas contra un Postgres real                                                                                                                                                                                                             |
| 2026-08-23 | **Revisión del Hito 1**: 0 críticos, 8 importantes, 13 menores. Se cerraron 4 — el error silencioso sin JS, la galería con teclado, el ancho/alto de portada y el enlace roto a `/noticias`                                                                                                                                                                                                                   |
| 2026-08-23 | **UJ-15 completada** (adelantada del Hito 3). `/noticias` existía en el menú desde UJ-01 y la página no. El cuerpo editable nunca se inserta como HTML                                                                                                                                                                                                                                                        |
| 2026-08-22 | **Logo real reemplazado** (D-15). Llegaron los originales de la clienta: corona rosa en todo, paleta intacta. La corona se vectorizó para conservar `currentColor`. De paso apareció que `og-default.png` se referenciaba sin existir                                                                                                                                                                         |
| 2026-08-22 | **UJ-05 completada.** El enlace de WhatsApp se arma en un solo lugar. Tres correcciones: la ficha usaba dos mensajes distintos, el 404 no tenía el botón y el número de Argentina abría sin mensaje                                                                                                                                                                                                           |
| 2026-08-22 | Corregido el seguimiento: UJ-02 figuraba pendiente aunque estaba terminada desde el 21                                                                                                                                                                                                                                                                                                                        |
| 2026-08-21 | **UJ-04 completada.** Ficha con galería, datos, amenidades, Drive y similares. 12 páginas generadas                                                                                                                                                                                                                                                                                                           |
| 2026-08-21 | **UJ-03 completada.** Buscador de 4 filtros y catálogo. 13 casos verificados. El estado vive en la URL y se puede compartir                                                                                                                                                                                                                                                                                   |
| 2026-08-21 | **UJ-02 completada.** Carrusel de destacadas con el formato aprobado. Dos correcciones: arrancaba desplazado, y el script violaba la política de seguridad                                                                                                                                                                                                                                                    |
| 2026-08-21 | **UJ-01 completada.** Home con hero, barra, pie con las seis redes, WhatsApp flotante y 404 con marca. Cero JavaScript                                                                                                                                                                                                                                                                                        |
| 2026-08-21 | **IT-08 implementada.** Cabeceras de seguridad verificadas contra el sitio real. Falta probar Docker (no está instalado en el equipo)                                                                                                                                                                                                                                                                         |
| 2026-08-21 | **IT-07 completada.** 8 propiedades, 39 imágenes, informe y noticias cargados en Supabase real. Ocupa 1,3 MB de 1 GB                                                                                                                                                                                                                                                                                          |
| 2026-08-21 | **IT-06 implementada.** Correo con Resend; verificado que un fallo del proveedor no pierde la consulta. Falta probar un envío real (necesita cuenta de Resend)                                                                                                                                                                                                                                                |
| 2026-08-21 | **Supabase conectado.** Migraciones aplicadas sobre Postgres 17.6 real; subida de imágenes verificada contra el bucket. Cierra las verificaciones pendientes de IT-02, IT-03 e IT-04                                                                                                                                                                                                                          |
| 2026-08-21 | **IT-05 completada.** Componentes base y muestrario. La animación pasó a CSS puro (D-14): la página no carga JavaScript                                                                                                                                                                                                                                                                                       |
| 2026-08-21 | **IT-04 completada.** JWT + bcrypt 12, límite por IP persistido (D-13: tabla nueva `login_attempts`)                                                                                                                                                                                                                                                                                                          |
| 2026-08-21 | **IT-03 completada.** Validación por firma binaria y variantes WebP. Dos defectos corregidos: variantes duplicadas y dimensiones EXIF invertidas                                                                                                                                                                                                                                                              |
| 2026-08-21 | **IT-02 completada.** 12 tablas, migración verificada con PGlite: cascadas, restricciones y valores por defecto correctos                                                                                                                                                                                                                                                                                     |
| 2026-08-21 | **IT-01 completada.** Astro 7 + React 19 + Tailwind 4 funcionando. Decisión D-12: se subió de Astro 5 a 7 por XSS en el framework; vulnerabilidades de 12 a 7                                                                                                                                                                                                                                                 |
