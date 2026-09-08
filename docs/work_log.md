# Bitácora de Trabajo — Reyna de Real Estate

---

## 2026-08-20 · Sesión 1 — Brief y planificación

### Brief

Se completó `START_PROJECT_PROMPT.md` a partir de la conversación con la usuaria, del documento de correcciones de la clienta (`Web site.pdf`, 22/07/2026) y del material de marca en `~/Desktop/Musapp/REINA DEL REALESTATE/`.

Se extrajeron las 6 capturas incrustadas en el PDF y se guardaron en `design/referencias/` con nombres descriptivos, junto con una copia del PDF. Son la especificación visual del proyecto.

De la landing previa (`Index.html`) se extrajo la identidad visual ya definida: paleta y tipografías.

### Planificación

Se ejecutó `/init-project`. Se produjeron requisitos, alcance, riesgos, modelo de datos, contratos de API, arquitectura, pantallas, guía de estilo, selección de stack, requisitos no funcionales, journeys y seguimiento.

### 🔴 Hallazgo que cambió el plan

Durante el paso de exploración de MCPs se consultó el Drive de la usuaria y apareció el **"Reyna de Real Estate — Documento de Cierre de Alcance V1"** (29/06/2026), un acuerdo formal entre Musapp y la clienta que declara reemplazar toda conversación anterior sobre el proyecto.

**Contradecía el plan en nueve puntos**, entre ellos que el sitio bilingüe estaba explícitamente fuera de alcance — cuando la usuaria había pedido bilingüe ese mismo día.

Además se verificó que:

- La clienta **nunca completó el documento**: toda la sección de definiciones está en blanco.
- La **carpeta de Drive del proyecto está vacía**: no subió el video del hero ni las fotos.
- El acuerdo condicionaba el inicio de la construcción a recibirlo completo.

Se detuvo la planificación y se presentó el conflicto a la usuaria.

**Resolución (D-06)**: alcance híbrido acotado. Base en el Documento de Cierre, más las correcciones de julio de costo bajo. Sitio en español.

### Reescritura a v2.0

Se reescribieron `requirements.md`, `scope.md`, `data_model.md`, `api_contracts.md`, `ui_wireframes.md`, `user_journeys.md` y `task_tracker.md`. Se actualizaron `architecture.md`, `style_guide.md` y `nfr.md`.

**Cambios de fondo**:

- Cayeron los journeys de noticias; se simplificó la gestión de imágenes
- Se incorporaron entidades que el acuerdo daba por modeladas y v1 había omitido: desarrollistas, zonas, propietarios, amenidades
- Se sumaron campos del punto 5.5 del acuerdo: antigüedad, estado de obra, m² cubiertos y totales
- Se recuperó el aviso de leads por mail, que el acuerdo preveía (D-08)
- Se elevó a requisito no funcional que los datos de propietarios nunca lleguen al sitio público (D-09, RNF-10)

De 28 tareas se pasó a 26, pero con un alcance real bastante menor: sin bilingüe, sin CMS, sin galería.

### Herramientas

Los registros remotos de MCPs y skills no devolvieron resultados para este stack. Se seleccionaron del entorno local: **Google Drive** (verificado; fue el que encontró el documento de cierre) y **Navegador** para la verificación visual de journeys. Skills: `security-review`, `code-review`, `run`.

### Seguridad

No aplica todavía: no hay código. El checklist se aplicará a partir de IT-01.

### Estado al cerrar

Planificación completa, esperando aprobación. **Sin código escrito.**

---

## 2026-08-21 · Sesión 2 — Inicio de ejecución

### Pre-flight

Los 7 documentos requeridos verificados y completos. Node 24 y npm 11 disponibles.

### IT-01 · Esqueleto del proyecto — ✅ Completada

**Construido**

- Proyecto Astro con `srcDir` en `frontend/src`, según la estructura de `architecture.md`
- React 19 como islas, Tailwind 4 con los tokens de marca en `@theme`
- TypeScript en modo estricto, con `noUncheckedIndexedAccess` y alias de rutas
- `global.css` con la paleta, las tres tipografías, el foco visible y `prefers-reduced-motion`
- `i18n/es.json` con los textos de interfaz, más `t()` y `pickLocale()` — la infraestructura para un segundo idioma queda lista aunque el sitio salga en español
- `Base.astro` con metadatos, Open Graph y canónica
- Página temporal de verificación de marca, que reemplaza UJ-01
- ESLint 9, Prettier, `.env.example` documentado, `.gitignore`, README

**Verificado**

- El sitio levanta y renderiza con las tres tipografías correctas: Playfair Display en títulos, Cinzel en claims con su espaciado, Montserrat en cuerpo
- Tokens de color correctos (`#fb5696`, `#1e4f4c`)
- Sin desbordamiento horizontal en 375px
- `astro check`: 0 errores · ESLint: 0 · Prettier: limpio
- El build genera **HTML estático prerenderizado** — se confirmó que el contenido está en `dist/index.html`, que es la premisa de la decisión D-04
- **La página no carga JavaScript**: cero scripts en el HTML

**Optimización aplicada**
`@fontsource` importaba todos los subsets tipográficos (cirílico, griego, vietnamita). Se cambió a subsets latinos: de **47 a 12 archivos de fuente** y el CSS de **28 KB a 12 KB**. El navegador descarga solo las 4 fuentes que la página usa.

### 🔴 Hallazgo de seguridad — Astro 5 con XSS

La auditoría de dependencias encontró **12 vulnerabilidades**, incluidos varios **XSS en el propio Astro 5.18.2**, dos de severidad alta (XSS por nombre de slot y SSRF por cabecera Host).

Se actualizó a **Astro 7.2.4** con las integraciones compatibles, y se fijó **sharp ≥0.35.3** por `overrides`, porque las 0.34.x heredan CVEs de libvips y sharp va a procesar imágenes subidas en IT-03.

**Resultado: de 12 a 7 vulnerabilidades.** Tras la actualización se reverificó build, tipos, lint y renderizado: todo correcto.

Las 7 restantes están en la cadena de herramientas de desarrollo de Netlify y **no corren en el sitio desplegado**. Para `image-size` y `extract-zip` no hay versión parcheada publicada. Se reverifica en IT-10.

Registrado como decisión **D-12**. Se actualizaron `stack_selection.md`, `design_summary.md` y `architecture.md`: el stack pasa a Astro 7 y Node 22 en producción.

### Checklist de seguridad — IT-01

| Control                               | Estado                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Sin secretos en el código             | ✅ Verificado con búsqueda de patrones; `.env.example` solo con marcadores |
| `.env` fuera del control de versiones | ✅ En `.gitignore`                                                         |
| Escapado de contenido                 | ✅ Astro escapa por defecto; actualizado a la versión sin XSS conocidos    |
| Dependencias de origen confiable      | ✅ Auditadas; 12 → 7, con `sharp` fijado                                   |
| Validación de entrada                 | ⏸️ Sin entradas todavía. Zod instalado para IT-02 en adelante              |
| Autenticación y autorización          | ⏸️ IT-04                                                                   |
| Consultas parametrizadas              | ⏸️ IT-02                                                                   |
| Validación de archivos subidos        | ⏸️ IT-03                                                                   |

### Nota menor

El WebSocket del HMR de Vite falla a través del proxy del preview. Solo afecta la recarga automática en desarrollo; no existe en el build de producción ni afecta al sitio.

### Próximo

**IT-02 · Base de datos y migraciones** — esquema Drizzle con las 10 entidades de `data_model.md`.

---

## IT-02 · Base de datos y migraciones — ✅ Completada

**Construido**

- `backend/db/schema.ts` — las **12 tablas** de `data_model.md` v3.0 con sus 9 enumerados, índices y claves foráneas
- `backend/db/migrations/0000_inicial.sql` — migración generada y versionada
- `backend/db/client.ts` — conexión con `max: 1`, deliberado: en un entorno sin servidor cada invocación es efímera y un pool grande agota las conexiones del plan gratuito
- `backend/db/migrate.ts` — aplicación manual de migraciones, nunca automática al arrancar una función
- `drizzle.config.ts` y los comandos `db:generate`, `db:migrate`, `db:studio`

**Decisiones de integridad**
El borrado en cascada se definió según lo que debe sobrevivir a qué:

| Relación                                | Al borrar           | Por qué                                                       |
| --------------------------------------- | ------------------- | ------------------------------------------------------------- |
| propiedad → imágenes                    | cascada             | Las fotos no tienen sentido sin su propiedad                  |
| propiedad → amenidades                  | cascada             | Ídem                                                          |
| zona / tipología → propiedad            | **restrict**        | Borrar una zona con propiedades publicadas rompería el sitio  |
| desarrollista / propietario → propiedad | anula la referencia | La propiedad sobrevive                                        |
| propiedad → lead                        | anula la referencia | **Una consulta nunca se pierde** aunque se borre la propiedad |

Además, **"un solo destacado por tipo" se garantiza en la base**, con un índice único parcial, no en el código de la aplicación: así no depende de que ningún camino del programa se olvide de desmarcar el anterior.

**Verificado — contra Postgres real**
Docker estaba apagado, así que la verificación se hizo con **PGlite**, que es Postgres compilado a WASM: misma base de código, sin infraestructura.

- ✅ La migración corre completa, sin errores
- ✅ Las 12 tablas se crean
- ✅ Al borrar una propiedad, sus imágenes se van (2 → 0)
- ✅ Una zona con propiedades no se puede borrar
- ✅ Un segundo destacado del mismo tipo es rechazado por la base
- ✅ Un destacado de noticias y otro de informes conviven; varios sin destacar también
- ✅ El lead sobrevive al borrado de su propiedad, con la referencia en nulo
- ✅ El email de administradora es único
- ✅ Valores por defecto: toda propiedad y todo artículo nacen en `borrador` — **nada se publica solo**
- ✅ Un lead nace con `notified_at` en nulo, que es la base de la decisión D-08

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Checklist de seguridad — IT-02

| Control                              | Estado                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| Sin credenciales en el código        | ✅ `DATABASE_URL` siempre desde el entorno                      |
| Los errores no filtran configuración | ✅ El mensaje nombra la variable que falta, nunca su valor      |
| Consultas parametrizadas             | ✅ Drizzle parametriza por diseño; no se concatena SQL          |
| Datos sensibles marcados             | ✅ `owners` y `password_hash` documentados como nunca expuestos |
| TLS en producción                    | ✅ `ssl: require` cuando `NODE_ENV=production`                  |

### Nota

La verificación con PGlite valida el DDL y las reglas de integridad. La prueba contra un Postgres en Docker queda para **IT-08**, donde se arma el entorno de despliegue.

### Próximo

**IT-03 · Imágenes y almacenamiento**

---

## IT-03 · Imágenes y almacenamiento — ✅ Completada

**Construido**

- `backend/lib/imageValidation.ts` — validación por **firma binaria**, límites de tamaño, saneo de nombres y regla de cupo de galería
- `backend/lib/storage.ts` — interfaz `Almacenamiento` con implementación S3. Se define primero el contrato: cambiar de Supabase a MinIO en un VPS es escribir otra implementación, sin tocar nada más (RNF-07)
- `backend/lib/images.ts` — procesamiento con Sharp, variantes WebP, `srcset` y borrado

**Decisiones**

_El tipo de archivo se decide por su contenido, no por su nombre._ La extensión y el `Content-Type` los controla quien sube, así que se leen los primeros bytes del archivo. Renombrar `algo.exe` a `foto.jpg` no alcanza para entrar.

_Se valida antes de tocar Sharp._ Primero la firma, después el procesamiento. Sharp no debería ser la primera defensa frente a un archivo desconocido — con más razón habiendo tenido que fijarlo por CVEs de libvips (D-12).

_En la base se guarda la ruta, nunca la URL completa._ Si cambia el proveedor, las URLs guardadas apuntarían al lugar viejo.

_Cada archivo lleva un identificador único en su ruta._ Dos fotos con el mismo nombre no se pisan, y permite cachear un año: una ruta dada nunca cambia de contenido.

**Dos defectos encontrados y corregidos durante la verificación**

1. **Se generaban variantes duplicadas.** Una foto de 300px producía tres archivos idénticos. Con 1 GB de almacenamiento gratuito eso es desperdicio puro. Ahora `anchosPara()` genera solo los anchos que aportan algo: 2400px → tres variantes, 300px → una sola. Es determinista a partir del `width` guardado, así que quien renderiza sabe qué variantes existen sin consultar el bucket.

2. **Las dimensiones de las fotos de celular quedaban al revés.** Las fotos de teléfono suelen venir apaisadas con una marca EXIF que dice "rotar 90°". Sharp reporta el bitmap crudo en `width`/`height` y las dimensiones ya orientadas en `autoOrient`. El código guardaba las crudas: las imágenes salían derechas pero se registraban como apaisadas, y la página habría reservado el espacio al revés — justo el salto de layout que se quería evitar. Ahora se guardan las orientadas. **Verificado con una foto vertical simulada: se registra 200x600, no 600x200.**

**Verificado**

_Criterio 1 — sube un JPEG y quedan las tres variantes con sus medidas_
✅ Tres variantes en 400, 800 y 1600 · ✅ medidas del original registradas · ✅ las tres en el bucket, todas WebP · ✅ la de 400px pesa menos que la de 1600px · ✅ el `srcset` ofrece los tres anchos

_Criterio 2 — un archivo no permitido renombrado a .jpg es rechazado_
✅ Ejecutable · ✅ SVG con script dentro · ✅ PDF · ✅ HTML con JavaScript · ✅ archivo con firma JPEG válida pero contenido corrupto · ✅ vacío · ✅ de 11 MB

_Criterio 3 — la carga múltiple respeta el tope de 15_
✅ 15 de una vez entra · ✅ 16 se rechaza · ✅ con 12 cargadas, 20 más se rechaza diciendo cuántas entran · ✅ con la galería llena, el mensaje explica qué hacer

_Otros_
✅ PNG y WebP aceptados · ✅ nombres saneados, sin poder salir de la carpeta con `../` · ✅ el borrado limpia todas las variantes · ✅ orientación EXIF aplicada

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Checklist de seguridad — IT-03

| Control                              | Estado                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| Validación de archivos subidos       | ✅ Por firma binaria, no por nombre ni por lo que declara el cliente |
| Límite de tamaño                     | ✅ 10 MB, medido sobre el archivo real                               |
| Límite de cantidad                   | ✅ 15 por galería, con mensaje claro                                 |
| Sin recorrido de directorios         | ✅ Nombres saneados; `../../etc/passwd` queda en `imagen`            |
| Sin secretos en el código            | ✅ Credenciales del bucket siempre desde el entorno                  |
| Los errores no filtran configuración | ✅ Se nombran las variables faltantes, nunca sus valores             |
| Dependencia de riesgo controlada     | ✅ Sharp fijado en 0.35.3, sin los CVEs de libvips                   |

### Pendiente de verificación con infraestructura real

La lógica se verificó con un doble de prueba en memoria. **La subida contra un bucket real queda por probar** cuando exista la cuenta de Supabase (acción A-02) o MinIO en Docker (IT-08). Lo que falta probar es la conexión y los permisos, no el procesamiento.

### Próximo

**IT-04 · Autenticación del panel**

---

## IT-04 · Autenticación del panel — ✅ Completada

**Construido**

- `backend/lib/auth.ts` — bcrypt coste 12, JWT de 8 horas, cookie de sesión, middleware único
- `backend/lib/rateLimit.ts` — límite por IP con ventana deslizante
- `frontend/src/pages/api/admin/auth/` — `login`, `logout` y `me`
- `backend/db/crear-admin.ts` y el comando `npm run db:crear-admin`
- Tabla `login_attempts` con su migración `0001` (decisión D-13)

**Decisiones**

_Un solo middleware para todo el panel._ Si cada endpoint escribiera su propia verificación, tarde o temprano uno quedaría sin proteger. Hay una sola función y todos la usan.

_El límite de intentos vive en la base._ En un entorno sin servidor un contador en memoria se reinicia con cada instancia. Ver D-13.

_Se guarda un hash de la IP, con sal._ Alcanza para contar intentos sin conservar direcciones. La sal importa: el espacio de direcciones IP es chico y un hash sin sal se revierte con una tabla precalculada.

_Se gasta el mismo tiempo cuando el email no existe._ El mensaje de error ya era idéntico en los dos casos, pero sin esto un email inexistente respondería al instante y uno real tardaría lo que tarda bcrypt. Esa diferencia alcanza para averiguar qué direcciones están registradas.

_La contraseña de alta se pide por teclado, con el eco tapado._ Pasarla como argumento la dejaría en el historial del terminal.

**Verificado**

_Contraseñas_ — ✅ hash bcrypt coste 12 · ✅ la correcta valida, la incorrecta no · ✅ dos hashes de la misma contraseña son distintos

_Sesión_ — ✅ el token trae los datos · ✅ se rechaza alterado, inventado, vacío, **firmado con otro secreto** y **vencido**

_Cookie_ — ✅ `HttpOnly` · ✅ `SameSite=Strict` · ✅ 8 horas · ✅ `Secure` solo en producción · ✅ el cierre la vacía

_Criterio "sin token todo endpoint admin da 401, con token pasa"_
✅ Sin cookie → 401 · ✅ token inventado → 401 · ✅ cookie ajena → 401 · ✅ token vencido → 401 · ✅ con token válido → 200 con los datos · ✅ **la respuesta no incluye el hash** · ✅ sin caché

_Criterio "al sexto intento fallido, 429"_ — contra Postgres real
✅ Los cinco primeros pasan, contando cuántos quedan · ✅ **el sexto queda bloqueado**, informando que reintente en 900 s · ✅ otra IP no se ve afectada · ✅ un acceso correcto limpia el contador · ✅ intentos de hace 20 minutos ya no bloquean (ventana deslizante) · ✅ la limpieza borra los vencidos

_Demora_ — ✅ email existente 452 ms contra inexistente 451 ms: indistinguible

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Checklist de seguridad — IT-04

| Control                       | Estado                                                           |
| ----------------------------- | ---------------------------------------------------------------- |
| Contraseñas cifradas          | ✅ bcrypt coste 12, con sal por contraseña                       |
| El hash nunca se expone       | ✅ Verificado: no aparece en ninguna respuesta                   |
| Rutas protegidas              | ✅ Middleware único; `login` y `logout` son públicos a propósito |
| Sesión no robable por scripts | ✅ `HttpOnly`                                                    |
| Protección contra CSRF        | ✅ `SameSite=Strict`                                             |
| Sin enumeración de usuarios   | ✅ Mismo mensaje y misma demora                                  |
| Fuerza bruta limitada         | ✅ 5 por IP cada 15 minutos, persistido                          |
| Sin secretos en el código     | ✅ `JWT_SECRET` desde el entorno, con largo mínimo verificado    |
| Datos personales minimizados  | ✅ Se guarda hash de IP con sal, no la dirección                 |
| Respuestas sin caché          | ✅ `Cache-Control: no-store`                                     |

### Pendiente de verificación con infraestructura real

El flujo HTTP completo de `login` necesita Postgres corriendo. La lógica quedó verificada contra Postgres en WASM; falta la prueba de punta a punta en IT-08.

### Próximo

**IT-05 · Sistema de diseño**

---

## IT-05 · Sistema de diseño — ✅ Completada

**Construido** — en `frontend/src/components/public/`

- `Corona.astro` — el isotipo de marca, decorativo y oculto a lectores de pantalla salvo que se le dé etiqueta
- `Contenedor.astro` — ancho máximo 1200px, y una variante de 65 caracteres para texto de lectura
- `Boton.astro` — tres variantes, 44px de área táctil mínima. Se renderiza como enlace o como botón según reciba destino
- `Badge.astro` — píldoras de país, ubicación y estado
- `Campo.astro` — etiqueta arriba, ayuda y error debajo
- `CardPropiedad.astro` — el componente central del sitio
- `SeparadorCorona.astro` — filete dorado, corona rosa, filete dorado
- `IconoSocial.astro` — las seis redes en círculos verdes
- `frontend/src/pages/sistema.astro` — muestrario interno, sin indexar

**Decisiones**

_El botón se renderiza como enlace cuando recibe un destino._ Un enlace disfrazado de botón sigue siendo un enlace: se abre en pestaña nueva, se copia la dirección, y el teclado lo trata como corresponde.

_Los errores de formulario se explican con texto, nunca solo pintando el borde de rojo._ Quien no distingue colores necesita leer qué pasó. Además van enlazados con `aria-describedby` para que los lectores de pantalla los anuncien.

_La card no se rompe sin foto._ Si falta la imagen queda un bloque crema con el nombre de la marca, en vez de un hueco roto.

_En terrenos se omiten dormitorios y baños._ Un lote sin construir no los tiene, y mostrar "0 dor." se lee como un error del sitio.

**Un problema encontrado y resuelto de raíz**

La animación de entrada se implementó primero con `IntersectionObserver`. Al verificarla, **el contenido quedaba invisible**: los navegadores congelan el observador en pestañas en segundo plano. En un navegador real no habría pasado, pero expuso el modo de fallo — una animación de entrada esconde contenido hasta que algo lo revela, y si ese algo falla, la sección no se ve nunca.

Se rehízo con **CSS puro** (`animation-timeline: view()` detrás de `@supports`). El contenido está siempre visible por defecto y la animación es una mejora opcional. **Se eliminó el componente y la página quedó sin nada de JavaScript.** Registrado como D-14.

**Verificado**

_Escritorio 1280px_ — ✅ Las cinco muestras de color · ✅ la escala tipográfica completa con las tres familias · ✅ las tres variantes de botón más el estado deshabilitado · ✅ las tres píldoras · ✅ las tres cards en grilla de 3 · ✅ el formulario con su error · ✅ los seis íconos sociales · ✅ la corona en cuatro tamaños · ✅ los separadores

_Móvil 360px_ — ✅ **Sin desbordamiento horizontal** · ✅ cards en una columna · ✅ **ningún botón por debajo de 44px** de área táctil · ✅ ningún elemento se sale del ancho · ✅ los colores pasan a dos columnas

_Corregido durante la verificación_: el texto de ayuda de los campos estaba en 12px, por debajo del mínimo de 14px de la escala. Es texto funcional que la persona necesita leer para completar el formulario. Llevado a 14px.

_Build_ — ✅ ✅ **Cero JavaScript en la página** · CSS total 24 KB

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Checklist de seguridad — IT-05

| Control                  | Estado                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Contenido escapado       | ✅ Astro escapa por defecto en toda interpolación                                                   |
| Enlaces externos seguros | ✅ `rel="noopener noreferrer"` en botones e íconos que abren pestaña nueva                          |
| Sin secretos             | ✅ Componentes de presentación, sin datos ni credenciales                                           |
| Accesibilidad            | ✅ Foco visible, área táctil de 44px, errores con texto, decorativos ocultos a lectores de pantalla |

### Nota sobre el entorno de verificación

El panel del navegador oculta la pestaña al ejecutar JavaScript, lo que congela animaciones y observadores. Las mediciones por JavaScript son fiables; las capturas requieren recargar la página en lugar de desplazarse. Esto **no afecta al sitio**, solo a cómo se verifica desde acá.

### Próximo

**IT-06 · Envío de correo**

---

## Infraestructura real conectada — Supabase

**2026-08-21** · Se creó la cuenta de Supabase con `reynaderealestate@gmail.com` y el proyecto `reyna-de-real-estate`. Esto permitió cerrar las verificaciones que habían quedado pendientes en IT-02, IT-03 e IT-04.

**Un problema de configuración y su causa**
La cadena de conexión no funcionaba: la contraseña de la base contenía un `?`, carácter que parte una URL en dos. Se codificó dentro de la cadena. Vale recordarlo si alguna vez se cambia la contraseña — conviene evitar `? @ : / #`, o codificarlos.

**Verificado contra infraestructura real**

_Base de datos_

- ✅ Conexión establecida — PostgreSQL 17.6, vía Session pooler en el puerto 5432
- ✅ **Las migraciones corren sobre Postgres real**: 13 tablas, 9 enumerados propios, 36 índices
- Esto confirma lo que IT-02 había verificado con Postgres en WASM

_Almacenamiento_

- ✅ Subida real a Supabase Storage: una foto de 2400x1600 generó sus tres variantes WebP
- ✅ Las medidas se registran correctamente
- ✅ **Las imágenes se ven desde internet** — HTTP 200, tipo `image/webp`, caché de un año
- ✅ El borrado elimina los objetos del bucket

_Un detalle que parecía un fallo y no lo era_: tras borrar, la imagen seguía respondiendo HTTP 200. Se verificó listando el bucket: **estaba vacío**. Era el CDN sirviendo su copia en caché, correcto dado que se publican con caché de un año. No es un problema: las rutas llevan un identificador único, así que un archivo borrado nunca se reutiliza.

**Queda pendiente**: `RESEND_API_KEY` (IT-06) y `NETLIFY_BUILD_HOOK_URL` (IT-08).

---

## IT-06 · Envío de correo — ✅ Implementada (falta probar un envío real)

**Construido**

- `backend/lib/mailer.ts` — interfaz `Correo`, implementación con Resend y la plantilla del aviso de consulta

**Decisiones**

_Ninguna función de este módulo lanza excepciones._ Devuelven un resultado que el llamador decide qué hacer. Es la traducción en código de la decisión D-08: un proveedor de correo caído no puede hacer que se pierda un lead.

_Se usa la API de Resend directamente con `fetch`, sin su SDK._ Una dependencia menos que auditar y actualizar, para tres llamadas HTTP.

_Hay un plazo máximo de 10 segundos._ Sin eso, un proveedor lento dejaría al visitante esperando la respuesta del formulario.

_El contenido de la consulta se escapa antes de armar el HTML._ Lo escribe cualquiera desde internet y los clientes de correo renderizan HTML.

_El aviso está pensado para leerse en el celular y decidir rápido_: quién consultó y por qué propiedad arriba, botones de responder por mail y por WhatsApp a mano. En este negocio la velocidad de respuesta define la venta (riesgo R-06).

_Al responder, el correo va directo al visitante_ (`reply_to`), no a la casilla del sitio.

**Verificado**

_Escapado de contenido público_
✅ Un `<script>` en el nombre queda inerte · ✅ un `onerror` en el mensaje no sobrevive · ✅ no se puede inyectar una etiqueta `<img>` · ✅ las comillas del título se escapan · ✅ la versión en texto plano conserva el original, donde no se ejecuta nada

_Contenido del aviso_
✅ El asunto dice quién consultó y por qué propiedad · ✅ responder va al visitante · ✅ botón de mail y de WhatsApp · ✅ avisa que la consulta ya quedó guardada · ✅ incluye versión en texto plano

_Casos incompletos_
✅ Sin teléfono no aparece el botón de WhatsApp · ✅ sin propiedad el asunto sigue teniendo sentido · ✅ sin mensaje no queda un bloque vacío

_Criterio "si el proveedor falla, el lead igual queda en base"_ — **contra la base real de Supabase**
✅ Sin clave configurada devuelve error en vez de lanzar excepción
✅ Con clave inválida devuelve error en vez de lanzar excepción (Resend responde 401)
✅ El motivo del fallo **no incluye la clave**
✅ **La consulta sigue en la base pese al fallo del correo**
✅ Queda marcada como no avisada, para poder revisarla o reintentar
✅ Cuando el envío funciona, se registra el momento

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Pendiente

**La otra mitad del criterio — "al enviar el formulario llega el mail" — no está verificada**: hace falta una cuenta de Resend con su clave. La comunicación con el proveedor sí quedó confirmada (responde 401 ante clave inválida, o sea que el camino de red funciona).

Además, para enviar desde `web@reynaderealestate.com` hay que **verificar el dominio en Resend** con registros DNS en Don Web. Sin eso, Resend solo permite enviar desde su dirección de prueba y hacia la casilla registrada.

### Próximo

**IT-07 · Datos de demostración**

---

## IT-07 · Datos de demostración — ✅ Completada

**Construido**

- `backend/db/seed/contenido.ts` — textos reales de la clienta, transcritos de `design/referencias/`
- `backend/db/seed/propiedades.ts` — catálogos, 8 propiedades y 5 consultas
- `backend/db/seed/index.ts` — el cargador, con `npm run seed`

**Decisiones**

_Los textos de la clienta se transcriben tal cual, no se reescriben._ El de "Conóceme" y el del informe están aprobados. Lo único que cambia es la corrección que ella pidió: **"estratégica" → "inteligente"**.

_Las imágenes son marcadores generados, no fotos reales._ Rectángulos con los colores de la marca, el nombre de la propiedad y la leyenda "imagen de demostración". No se usan fotos de propiedades ajenas ni de bancos de imágenes: alguien podría confundirlas con inmuebles reales en venta.

_Las 8 propiedades cubren los casos que rompen diseños_, no solo los fáciles:

- Un **terreno** sin dormitorios ni baños y con "precio a consultar"
- Una propiedad **en pozo**, sin año de construcción
- Propiedades en **venta y en renta**
- Cartera **propia y compartida**
- Con y sin enlace de Drive
- Con y sin desarrollista

_El video del hero y el retrato quedan vacíos a propósito_ (D-10). Así se verifica que el sitio se ve bien sin ellos, que es como va a salir.

**Verificado — contra la base y el almacenamiento reales**

_Cargado_: 4 zonas · 5 tipologías · 8 amenidades · 3 desarrollistas · 2 propietarios · **8 propiedades** · **39 imágenes de galería** · 1 informe · 3 noticias · 5 consultas · 18 claves de configuración

✅ Las 8 publicadas, 4 marcadas como destacadas
✅ Todas con portada
✅ Galería de 4 a 6 imágenes por propiedad
✅ El terreno sin dormitorios ni baños, con precio a consultar
✅ La propiedad en pozo sin año de construcción
✅ Hay venta y renta, cartera propia y compartida
✅ El informe destacado, **diciendo "inteligente"**, con la cita de McKinsey y los cuatro pilares
✅ El texto de "Conóceme" es el de la clienta
✅ Los dos WhatsApp y las tres redes
✅ Video y retrato vacíos, como corresponde
✅ **Las imágenes se ven desde internet** — HTTP 200, `image/webp`

**Espacio ocupado**: 153 archivos, **1,3 MB de los 1024 MB** del plan gratuito. Con 39 imágenes y tres variantes cada una. Deja margen de sobra: aun con fotos reales, que pesan más, el tope de 15 por propiedad mantiene el consumo controlado.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

_Corregido de paso_: `z.string().email()` quedó obsoleto en Zod 4; se pasó a `z.email()`.

### Próximo

**IT-08 · Entorno Docker y despliegue**

---

## IT-08 · Entorno Docker y despliegue — ✅ Implementada (falta probar Docker)

**Construido**

- `netlify.toml` — build, cabeceras de seguridad, caché y redirección canónica
- `docker-compose.yml` — Postgres 17 y MinIO, con el bucket creado automáticamente
- `deployment/docker/Dockerfile` — imagen multi-etapa, corriendo sin privilegios de administrador
- `deployment/docs/entorno_local.md` — cómo levantar todo sin servicios en la nube

**Las cabeceras de seguridad, y qué cierra cada una**

| Cabecera                    | Qué evita                                                              |
| --------------------------- | ---------------------------------------------------------------------- |
| `Content-Security-Policy`   | Que un script inyectado pueda ejecutarse o mandar datos afuera         |
| `X-Frame-Options: DENY`     | Que metan el sitio en un marco para engañar a un visitante             |
| `X-Content-Type-Options`    | Que un archivo subido se interprete como algo distinto de lo declarado |
| `Referrer-Policy`           | Que al salir del sitio se filtre la dirección exacta que estaba viendo |
| `Permissions-Policy`        | Acceso a cámara, micrófono y ubicación, que el sitio no necesita       |
| `Strict-Transport-Security` | Que el primer pedido viaje sin cifrar                                  |

En la política, `'unsafe-inline'` está permitido **solo para estilos**, porque Astro incrusta el CSS crítico. **Los scripts no lo llevan**, que es donde está el riesgo real.

Además: las respuestas del panel y del formulario nunca se cachean, y el panel no se indexa.

**Verificado**

- ✅ `netlify.toml` es TOML válido: 5 bloques de cabeceras, 1 redirección, Node 22
- ✅ `docker-compose.yml` es YAML válido: 3 servicios, 2 volúmenes
- ✅ **La política de seguridad no bloquea nada del propio sitio**: ninguna página carga scripts externos, scripts inline, ni fuentes o estilos de terceros
- ✅ **Ninguna fuente se descarga de Google Fonts** — todas están dentro del proyecto

Esta última verificación importa más de lo que parece: una política mal calibrada rompe el sitio recién en producción, cuando ya está publicado.

**Corrección de un dato que había dado mal**
En IT-02 informé que "Docker está instalado pero no corriendo". Era incorrecto: un error en cómo escribí la comprobación hizo que un comando inexistente se reportara como presente. **Docker no está instalado en este equipo.**

### Pendiente

**El criterio "`docker compose up` levanta el proyecto entero" no está verificado**: requiere Docker instalado. Los archivos son válidos y las imágenes son oficiales y de versiones fijadas, pero eso no reemplaza haberlo levantado.

No bloquea la entrega: el despliegue va a Netlify y Supabase, ya funcionando. Docker es el plan B de portabilidad (RNF-07).

### Próximo

**Hito 1 · El visitante encuentra y consulta una propiedad** — empieza UJ-01

---

## UJ-01 · Descubrir la marca y elegir camino — ✅ Completada

**Construido**

- `backend/lib/entorno.ts` — lectura unificada de variables de entorno. El proyecto las lee desde tres contextos (build de Astro, funciones de Netlify, scripts de consola) y cada uno las expone distinto
- `frontend/src/lib/datos.ts` — las consultas del sitio público
- `BarraSuperior.astro` · `Hero.astro` · `PieDePagina.astro` · `BotonWhatsApp.astro`
- `index.astro` — la home · `404.astro` — con marca
- Logos optimizados a WebP e imagen de respaldo del hero, en `frontend/public/`

**Decisiones**

_Los campos se seleccionan uno por uno en las consultas públicas_, en vez de traer la fila entera. Un `select *` traería `owner_id` y datos internos sin que nadie lo note, y basta un descuido para que terminen en el HTML (D-09).

_La barra superior cambia de color con animación ligada al scroll, en CSS._ Donde el navegador no la soporta queda **verde sólido desde el principio**. El respaldo nunca puede ser "transparente": sobre contenido claro el logo blanco desaparecería.

_El video del hero es opcional._ La clienta todavía no lo entregó (D-10). Si no hay video se muestra solo la imagen y la sección se ve terminada igual, no como algo a lo que le falta una pieza. La imagen se pinta primero y el video se superpone cuando puede: **nunca bloquea la carga**.

_El botón de WhatsApp lleva el mensaje ya escrito._ Sin eso, el visitante tiene que pensar qué decir, y muchos no escriben.

**Verificado**

_Criterio "ambos botones filtran bien"_
✅ Invertir → `/propiedades?operacion=venta` · ✅ Rentar → `/propiedades?operacion=renta`

> La comprobación funcional del filtro queda para UJ-03, cuando exista la página de catálogo. Los destinos son correctos.

_Criterio "todos los íconos del footer abren donde deben"_
✅ Los **seis**: sitio, Instagram, **Facebook** (que faltaba en la versión original), WhatsApp con mensaje prellenado, correo y YouTube
✅ **Todos los enlaces externos con `noopener noreferrer`** — sin esto, la página abierta puede manipular a la que la abrió
✅ Los dos teléfonos: el de México como llamada, el de Argentina como WhatsApp

_Criterio "el video no bloquea la carga ni dispara audio"_
✅ Sin video configurado se muestra la imagen de respaldo · ✅ el video va en silencio, en bucle y con `preload="none"` · ✅ con `prefers-reduced-motion` no se muestra

_Diseño_
✅ Barra transparente sobre el hero, **verde al bajar** · ✅ móvil 375px sin desbordamiento · ✅ botones a todo el ancho en móvil · ✅ 404 con marca y salidas claras

_Buscadores_
✅ Un solo `h1` · ✅ título y descripción propios · ✅ imagen para redes · ✅ dirección canónica · ✅ idioma declarado · ✅ **la 404 no se indexa**

_Build_ — 3 páginas · **cero JavaScript en la home** · 16 KB de HTML

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Checklist de seguridad — UJ-01

| Control                        | Estado                                                               |
| ------------------------------ | -------------------------------------------------------------------- |
| Datos internos fuera del sitio | ✅ Los campos se seleccionan uno por uno; `owners` nunca se consulta |
| Enlaces externos seguros       | ✅ `noopener noreferrer` en los seis                                 |
| Contenido escapado             | ✅ Astro escapa por defecto                                          |
| Sin secretos en el cliente     | ✅ La base se consulta al construir, nunca desde el navegador        |

### Próximo

**UJ-02 · Ver las propiedades destacadas**

---

## UJ-02 · Ver las propiedades destacadas — ✅ Completada

**Construido**

- `Destacadas.astro` — el carrusel, usando la card de IT-05 con datos reales
- `frontend/public/js/carrusel.js` — las flechas, como archivo propio

**Decisiones**

_El desplazamiento es nativo del navegador._ `scroll-snap` da los gestos táctiles y el recorrido con teclado sin una línea de JavaScript, y el navegador lleva la vista al elemento que recibe el foco. Las flechas son un agregado para escritorio: si el archivo no carga, el carrusel funciona igual.

_El script vive como archivo propio, no incrustado en la página._ Ver el hallazgo de abajo.

**Dos problemas encontrados y corregidos**

1. **El carrusel arrancaba desplazado 48 píxeles.** El centrado con `margin: auto` empuja el contenido cuando no entra en pantalla, así que el visitante veía la primera propiedad cortada apenas entraba. Se cambió a `justify-content: safe center`, que centra cuando todo entra y se alinea al inicio cuando no. **Verificado: ahora arranca en 0 y la primera card se ve entera.**

2. **El script quedaba incrustado en la página, y la política de seguridad del sitio prohíbe los scripts inline.** Astro incrusta los scripts pequeños. En producción, la política habría bloqueado el script y las flechas no habrían funcionado — un fallo que solo aparece después de publicar. Se movió a `/js/carrusel.js`, que se sirve como archivo propio y cumple la política. **La alternativa era permitir scripts inline, y no vale debilitar la protección de todo el sitio por unas flechas.**

**Verificado**

_Formato aprobado — coincide con `sec2-card-corregida.png`_
✅ Badge de **país** y de **zona** ("México" + "Tulum") · ✅ **sin** badge de dormitorios · ✅ **sin bajada bajo el título** · ✅ precio en dólares con separadores de miles · ✅ botón "Ver detalle" verde

_Navegación_
✅ Gestos táctiles y rueda del ratón, nativos · ✅ el contenedor recibe foco para recorrerlo con teclado · ✅ `scrollIntoView` desplaza correctamente, que es el mecanismo del navegador al navegar con Tab · ✅ flechas en escritorio, que se apagan al llegar a cada extremo

_Cantidades_
✅ Con **0** destacadas la sección **no se muestra**, sin dejar hueco · ✅ con 1, 2, 3 y 4 se ve bien · ✅ con 2 quedan centradas y las flechas ni aparecen · ✅ en móvil se ve una con la siguiente asomando, que es la señal de que hay más

_Datos y seguridad_
✅ Las 4 destacadas reales en el orden que fijó la clienta
✅ **Ningún dato de propietarios en el HTML** — se verificó buscando los cuatro datos internos de la semilla
✅ Todos los scripts son archivos propios: cumple la política de seguridad

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Nota sobre el entorno de verificación

El panel del navegador oculta la pestaña al ejecutar JavaScript, y en pestañas ocultas el navegador congela animaciones e ignora las asignaciones directas de scroll. Se confirmó comparando contra un control: el scroll vertical de la página tampoco responde. **No afecta al sitio**, solo a cómo se verifica desde acá.

### Próximo

**UJ-03 · Buscar y filtrar**

---

## UJ-03 · Buscar y filtrar — ✅ Completada

**Construido**

- `Buscador.astro` — los cuatro campos, en la home y en el catálogo
- `frontend/src/pages/propiedades/index.astro` — el catálogo completo
- `frontend/public/js/filtros.js` — el filtrado

**Decisiones**

_El buscador es un formulario de verdad, con método GET._ **Sin JavaScript también funciona**: envía a `/propiedades` con los filtros en la dirección y la página los aplica. Con JavaScript el filtrado es instantáneo y no recarga.

_Todas las propiedades se generan en el HTML y el filtrado ocurre en el navegador._ Tres razones: los buscadores indexan el catálogo entero, la respuesta es instantánea, y si el script no carga **se ven todas** en vez de una página vacía.

> Con pocas decenas de propiedades esto es lo más simple. Si el catálogo creciera a varios cientos, habría que paginar o filtrar en el servidor.

_El estado vive en la dirección._ Una búsqueda se puede compartir, guardar en favoritos, y el botón "atrás" funciona como se espera.

_Las propiedades "a consultar" quedan fuera de cualquier tramo de precio._ No tienen precio cargado, así que no se puede afirmar que entren en un rango — incluirlas sería adivinar.

_Se mantiene "tipo de propiedad" con terreno entre las opciones_, según la aclaración de la usuaria: en el rubro, un terreno es un inmueble sin construir, no otra operación.

**Verificado — 13 casos, todos correctos**

| Filtro                                   | Resultados |
| ---------------------------------------- | ---------- |
| Sin filtros                              | 8          |
| Zona Tulum centro / Holbox               | 3 / 2      |
| Tipo casa / terreno                      | 3 / 1      |
| Operación venta / renta                  | 6 / 2      |
| 3 o más dormitorios                      | 4          |
| Hasta 200 mil / más de 1 millón          | 3 / 1      |
| **Combinado**: casa en Tulum centro      | 2          |
| **Combinado**: venta + 4 dormitorios     | 2          |
| **Sin coincidencias**: terreno en Holbox | 0          |

Cada número se contrastó contra los datos de la semilla.

_Estado en la dirección_
✅ Al filtrar, la dirección pasa a `?zona=tulum-centro&tipo=casa`
✅ **Un enlace compartido restaura la búsqueda**: `?operacion=renta` deja los filtros puestos y muestra las 2 propiedades en renta
✅ Queda un aviso —"Mostrando propiedades en renta"— con salida a "Ver todas"
✅ Esto completa el camino desde el hero: **Invertir y Rentar ya llegan al catálogo filtrado**

_Sin coincidencias_
✅ Mensaje "No encontramos propiedades con esos criterios", con corona, explicación y dos salidas: "Ver todas" y "Escribinos"
✅ La grilla se oculta: no queda un espacio vacío arriba del mensaje

_Diseño_
✅ Grilla de 3 columnas en escritorio, 1 en móvil · ✅ los cuatro campos se apilan en móvil · ✅ destacadas primero, **en el orden que fijó la clienta**

_Seguridad_
✅ Los dos scripts se sirven como archivos propios: cumplen la política
✅ **Ningún dato de propietarios en el HTML**

**Dos correcciones durante la verificación**

1. El contador salía **"8propiedadesdisponibles"**, sin espacios, porque el compilador colapsa el espacio entre etiquetas contiguas.
2. Las destacadas se agrupaban primero pero **sin respetar el orden que definió la clienta**. Ahora Casa Abaton, Torre Mirador, Casa Babilon y Villa Sian salen en su orden.

_También_: se declararon los globales del navegador en la configuración de ESLint para los archivos de `public/js`, que hasta ahora se revisaban como si corrieran en Node.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Próximo

**UJ-04 · Ver la ficha de una propiedad**

---

## UJ-04 · Ver la ficha de una propiedad — ✅ Completada

**Construido**

- `Galeria.astro` — imagen grande, miniaturas y contador
- `frontend/src/pages/propiedades/[slug].astro` — una página por propiedad, generada al construir
- `frontend/public/js/galeria.js` — la vista ampliada
- `obtenerSimilares()` en la capa de datos

**Decisiones**

_La galería funciona sin JavaScript._ Las miniaturas son enlaces internos y el navegador desplaza la foto correspondiente. La vista ampliada es lo único que necesita script, y es un extra.

_La vista ampliada usa `<dialog>`, no un div hecho a mano._ El navegador ya sabe atrapar el foco adentro, cerrar con Escape y devolver el foco al salir. Reimplementar eso a mano sale casi siempre peor.

_En terrenos se omiten dormitorios, baños y antigüedad._ Un lote sin construir no los tiene, y mostrar "0 dormitorios" se lee como un error del sitio.

_Se agregaron datos estructurados de inmueble._ Ayudan a que los buscadores entiendan que la página es una propiedad en venta, con su ubicación y precio.

**Verificado**

_Criterio "en un terreno no aparecen dormitorios, baños ni antigüedad"_ — sobre Lote Selva Norte
✅ Los atributos que se muestran son solo: totales 2400 m², tipo Terreno, operación En venta, estado Terminado
✅ **Ninguno de los tres** aparece · ✅ el precio dice "Precio a consultar"

_Criterio "con 1 imagen la galería no muestra controles inútiles"_ — probado de verdad, dejando una propiedad con una sola foto en la base y devolviéndolas después
✅ Sin miniaturas · ✅ sin contador de fotos · ✅ **la foto se sigue viendo**

_Criterio "el enlace de Drive abre en pestaña nueva con `noopener noreferrer`"_
✅ `target="_blank"` y `rel="noopener noreferrer"`

_Criterio "los metadatos sociales usan la imagen principal"_
✅ `og:image` apunta a la portada de la propiedad · ✅ datos estructurados de tipo `RealEstateListing`

_Criterio "ningún dato de propietario aparece en el HTML"_
✅ Se buscaron los cinco datos internos de la semilla **en todo el sitio generado**: ninguno aparece

_Galería_
✅ 6 fotos con miniaturas, todas cargan · ✅ la vista ampliada abre al hacer clic, avanza con las flechas del teclado, cierra con Escape y con el botón · ✅ el contador dice "1 de 6"

_Ficha completa_
✅ Migas de pan · ✅ badges de país y zona · ✅ precio · ✅ los ocho atributos · ✅ amenidades · ✅ descripción · ✅ bloque de Drive · ✅ bloque de contacto con WhatsApp que nombra la propiedad · ✅ propiedades similares · ✅ móvil correcto

_Sitio completo_: 12 páginas · `astro check`: 0 errores · ESLint: 0 · Prettier: limpio

### Nota

El botón "Consultar" lleva al bloque de contacto de la ficha, que hoy ofrece WhatsApp y correo. **El formulario llega en UJ-06**; cuando exista, ese bloque lo incorpora.

### Próximo

**UJ-05 · Leer el informe Reyna Insights** _(o el siguiente del tracker)_

---

## UJ-05 · Contactar por WhatsApp — ✅ Completada

Casi todo el journey ya estaba construido, repartido entre UJ-01 y UJ-04. Lo que faltaba no era pintar botones: era **unificarlos**. Cada página armaba el enlace por su cuenta, y al mirarlos juntos aparecieron tres incoherencias.

**Construido**

- `frontend/src/lib/whatsapp.ts` — el único lugar donde se arma un enlace de WhatsApp
- `whatsapp.general`, `whatsapp.propiedad` y `whatsapp.flotante` en `i18n/es.json`
- `whatsapp.message_property` en `site_settings` — la clienta lo edita desde el panel en UJ-12

**Tres incoherencias corregidas**

1. **La ficha ofrecía dos mensajes distintos para lo mismo.** El botón flotante decía "vi tu web y me gustaría recibir más información sobre Casa Abaton"; el botón del bloque de contacto, dos pantallas más abajo, decía "me interesa Casa Abaton. ¿Podemos hablar?". Dos redacciones para el mismo pedido en la misma página. Ahora las tres salidas de la ficha dicen lo mismo.
2. **El 404 no tenía botón flotante.** Es justo la página donde más falta: quien cae en un enlace roto —una propiedad despublicada, un enlace viejo que alguien compartió— se queda sin camino. Ahora tiene la salida rápida.
3. **El número de Argentina abría WhatsApp en blanco.** El resto de los enlaces llevan el mensaje escrito; ese no. Quien escribía por ahí tenía que redactar desde cero, y eso hace que muchos no escriban.

**Decisiones**

_El mensaje sale de la configuración, no del código._ El diccionario es solo el respaldo. La clienta cambia el texto desde el panel sin que nadie toque un archivo.

_El mensaje de propiedad es una plantilla con `{propiedad}`._ Es lo que permite que sea editable: si la página lo concatenara a mano, cambiarlo exigiría tocar código.

_`enlaceWhatsApp()` devuelve cadena vacía si no hay número._ El botón se pinta solo si hay enlace. Antes se miraba el número y se armaba el enlace por separado — dos condiciones que podían desincronizarse.

**Verificado — en el navegador, escritorio y móvil**

_Número_ — `+52 984 311 5530` → `529843115530` en los 5 enlaces de la ficha
✅ El `+` y los espacios se descartan, como pide `wa.me`

_Mensajes_
✅ Home, catálogo y 404: "Hola Laura, vi tu web y me gustaría recibir más información"
✅ Ficha, en sus **tres** salidas: "Hola Laura, me interesa Casa Abaton. ¿Podemos hablar?"
✅ El pie de Argentina ahora lleva el mensaje general

_Botón flotante_ — medido sobre la página, no a ojo
✅ `position: fixed`, 56×56 px — por encima del mínimo táctil de 44
✅ **El clic llega al enlace**: `elementFromPoint` sobre el centro devuelve el botón, no algo encima
✅ Entra completo en pantalla en móvil y escritorio · ✅ presente en home, catálogo, ficha y 404

_Seguridad_
✅ Los 5 enlaces con `target="_blank"` y `rel="noopener noreferrer"`
✅ Sin scripts incrustados en el HTML generado: los únicos `<script>` son `/js/carrusel.js`, `/js/galeria.js` y datos estructurados

> Los errores de política de seguridad que aparecen en consola son de la **barra de desarrollo de Astro**, no del sitio. Se comprobó contra el HTML construido: ahí no hay ningún script incrustado.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 12 páginas

### Corrección de seguimiento

UJ-02 figuraba pendiente en la tabla del tracker aunque estaba terminada desde el 21 y anotada en la bitácora. Corregido.

### Próximo

**UJ-06 · Enviar una consulta** — el último journey del Hito 1. Es el único endpoint público del sitio (`POST /api/leads`) y cierra el punto de presentación a la clienta.

---

## Corrección · El logo real de la clienta — ✅ Completada

**2026-08-22.** La usuaria acercó los logos originales de Laura Cabral, que hasta hoy nunca habían llegado al proyecto: el sitio venía usando un logo provisorio dibujado por mí.

**Lo que llegó**: ocho variantes del mismo lockup — dos isotipos sueltos (corona rosa, corona turquesa) y seis combinaciones de corona × color de texto.

**Dos desajustes que aparecieron al mirarlos**

1. **El turquesa (`#81DCD2`) no está en la paleta.** Resultó ser el mismo tono que el verde de la marca, muy aclarado — encajaba solo sobre la barra verde. Aun así, sumarlo era cambiar la marca, no reemplazar un logo.
2. **Hay dos rosas.** El del logo (`#FFA6BF`) es más suave que el del sitio (`#FB5696`), y ambos iban a verse juntos en la barra superior.

Ambos se consultaron antes de tocar nada. **Decisión: corona rosa en todo, paleta intacta** (D-15).

**Construido**

- `design/marca/` — los ocho originales, ahora dentro del repositorio y con nombres que dicen qué son, en vez de `LA DIVINA (Portada para Facebook) - 5 (2) (1).png`
- `design/marca/generar-assets.mjs` — regenera todos los archivos públicos desde los originales
- `frontend/public/logos/` — `logo-claro`, `logo-oscuro`, `iso`, `favicon`, `og-default`

**La corona se vectorizó, no se pegó como imagen**

El isotipo aparece once veces por página, entre 20 y 64 px. Trazarlo del PNG y dejarlo como SVG mantiene tres cosas que una imagen perdía: se pinta con `currentColor` —así hereda el rosa de la paleta en lugar de arrastrar el degradé del archivo, que es justo lo que se pidió—, se ve nítido a cualquier tamaño, y pesa 2 KB sin sumar un pedido al servidor. Los lockups sí van como imagen, porque incluyen tipografía que el sitio no tiene entre sus fuentes.

> El trazado se hizo con `potrace` instalado **fuera del proyecto**. Sumar una dependencia al repositorio por una conversión de una sola vez no se justifica; el resultado ya está en el componente.

**Un error encontrado de paso**

`Base.astro` apuntaba a `/logos/og-default.png` **y ese archivo no existía**. Toda propiedad compartida por WhatsApp o redes sin imagen propia mostraba un hueco. Ahora existe: 1200×630, el lockup sobre el crema de la marca.

**Verificado**

_Barra superior_ — medido sobre la página, no a ojo
✅ El logo carga y rinde 137×44 px, con la proporción real del original (499×160)
✅ **A 375 px de ancho real no se pisa con el botón de Contacto**: quedan 77 px entre los dos, y ninguno se sale del contenedor
✅ El texto blanco del lockup sobre el verde de la barra

_Isotipo_ — las 11 apariciones de `/sistema`
✅ Todas en `rgb(251, 86, 150)`, el rosa de la paleta: **la paleta quedó intacta**, como se pidió
✅ Todas conservan la proporción del original (0.6283)

_Corregido durante la verificación_: el alto salía redondeado a entero, y a 20 px eso achataba la corona un 3%. Se sacó el redondeo.

_Favicon_ — se probaron tres encuadres y se miraron a 16, 32 y 64 px
✅ Va la corona a sangre a lo ancho: es la que más presencia tiene a 16 px
✅ Se descartó estirarla para llenar el cuadrado — alarga las puntas y deforma la marca

_Limpieza_
✅ Se eliminaron `iso-claro.webp` e `iso-oscuro.webp`: con una sola corona eran dos archivos idénticos. No los referenciaba nadie
✅ Sin referencias colgadas a los nombres viejos en todo el proyecto

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 12 páginas

### Pendiente que esto abre

El pie dice **"REYNA DE REAL ESTATE"** y el logo dice **"LAURA CABRAL"**. Son dos nombres para la misma marca y ahora conviven en la misma página. No lo cambié: el pie sigue el diseño aprobado en `design/referencias/footer.png`, y elegir cuál manda es una decisión de la clienta, no mía. Va anotado como **A-09**.

### Próximo

**UJ-06 · Enviar una consulta** — sigue siendo el último journey del Hito 1.

---

## UJ-06 · Enviar una consulta — ✅ Completada

El último journey del Hito 1, y el único endpoint público del sitio. Todo lo demás se genera al construir y no toca la base (D-04); acá entra texto escrito por cualquiera desde internet.

**Construido**

- `backend/lib/validation.ts` — el esquema, uno solo, que usan los dos lados
- `backend/lib/consultas.ts` — qué pasa cuando alguien consulta
- `frontend/src/pages/api/leads.ts` — el adaptador HTTP
- `FormularioContacto.astro` · `SeccionContacto.astro` · `frontend/public/js/formulario.js`
- `frontend/src/pages/gracias.astro` — adónde llega quien envía sin JavaScript
- La sección de contacto en la home, y el formulario dentro de la ficha
- `tests/` — vitest sobre PGlite. 21 pruebas

**El formulario funciona sin JavaScript**

Es un formulario de verdad, con `action` y `method`. Sin script se envía igual y el servidor responde **303 a `/gracias`**; con script se envía sin recargar y los errores salen al lado de cada campo. El endpoint distingue por el tipo de contenido: quien manda JSON recibe JSON.

No es un lujo. El formulario **es** la conversión del sitio: que dependa de que un archivo cargue es aceptar que a veces no entre ningún contacto y nadie se entere. Es el mismo principio de D-14 aplicado a la captación.

**La lógica salió del endpoint**

`procesarConsulta` recibe la base y el correo como parámetros. Se hizo por una razón concreta: los caminos que hay que poder probar son justo los que no ocurren en una demostración —el correo caído, el robot, el sexto envío—, y con las dependencias inyectadas cada uno se prueba de verdad en vez de simularse a medias.

**El límite por IP se generalizó**

`login_attempts` contaba solo accesos. Ahora tiene una columna `scope` y sirve a dos usos que **cuentan distinto**: en el acceso se anotan los fallos y un acierto borra el historial; en las consultas se anota cada envío. Mezclarlos habría dejado que un visitante que consulta cinco veces se quede sin intentos de acceso al panel.

> La tabla se sigue llamando `login_attempts`. Renombrarla exige que `drizzle-kit` pregunte si es un renombre o un borrar-y-crear, y eso pide una terminal interactiva que acá no hay. Se probó, colgó, se revirtió. **El nombre en SQL quedó viejo, el del código dice lo que la tabla es hoy**, y en `schema.ts` está anotado por qué.

**Verificado — en el navegador y contra Supabase real**

_Camino completo desde una ficha_
✅ El formulario llega con la propiedad puesta, el interés deducido de la operación (venta → invertir) y el mensaje empezado
✅ Enviado: la consulta quedó en Supabase con nombre, mail, teléfono, interés, mensaje, origen **y enlazada a Casa Abaton**
✅ El formulario se reemplaza por el agradecimiento, sin recargar

_Sin JavaScript_ — probado con `form.submit()`, que saltea el listener: el camino real, en un navegador real
✅ Termina en `/gracias`, con su página propia · ✅ la consulta quedó guardada, con interés `rentar`

_La trampa para robots_
✅ Responde `{"ok":true}` con 200: **exactamente lo mismo que un éxito**
✅ No dejó ninguna fila · ✅ no se envió ningún aviso
✅ El robot igual gasta su cuota: cinco envíos con trampa bloquean el sexto

_Límite de envíos_
✅ Los cinco primeros pasan; el sexto responde 429 con salida a WhatsApp
✅ El séptimo sigue bloqueado y **no consume cuota extra**: se revisa antes de anotar
✅ Tras cinco consultas el ámbito `login` seguía en cero — **los ámbitos no se pisan**

_Validación_
✅ Cliente: el navegador atajó `roto@` y marcó el campo, sin gastar cuota del servidor
✅ Servidor: `name: "A"` pasa la validación del navegador y **no la del servidor** — devuelve "Escribí tu nombre" al lado del campo
✅ El campo queda con `aria-invalid` y enlazado por `aria-describedby`: el error se lee, no solo se ve
✅ Un envío inválido **no consume cuota**: quien se equivoca escribiendo no queda bloqueado

_Si el mail falla, la consulta no se pierde (D-08)_ — comprobado de las dos maneras
✅ En pruebas: proveedor que devuelve error y proveedor que revienta; en ambos el lead queda guardado con `notified_at` nulo
✅ **En la base real**: la consulta de verificación quedó guardada con `notified_at` nulo, porque todavía no hay `RESEND_API_KEY`. El fallo pendiente de IT-06 quedó demostrado sin romper nada

_Seguridad_
✅ Lo que escribe el visitante se escapa antes de entrar al HTML del mail: se probó con `<script>` y `<img onerror>`
✅ En el navegador los errores se pintan con `textContent`, nunca con `innerHTML`
✅ La respuesta no devuelve el identificador del lead ni detalle de errores de base: el detalle va al registro del servidor
✅ Ningún script incrustado en el HTML generado
✅ La política de seguridad ya permitía los tres caminos: `form-action 'self'`, `connect-src 'self'` y `script-src 'self'`

**Un hallazgo durante la verificación**

Un envío de formulario **sin cabecera `Origin` devuelve 403**. No es un defecto: es la protección anti-CSRF de Astro. Un navegador siempre manda `Origin` en un POST de formulario, así que el camino real funciona —se comprobó— y de paso queda cerrado el envío desde otro sitio.

**Regresión revisada**: se tocó el limitador que usa el acceso al panel. Se volvió a probar el login — credenciales incorrectas siguen devolviendo 401 con el mensaje genérico, y el fallo se anota en su propio ámbito.

**Limpieza**: se borraron de Supabase las cinco consultas que creé verificando y se vació el contador, para no dejar la IP bloqueada. Quedan solo las cinco de la semilla.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · **21 pruebas en verde** · build: 13 páginas

### 🎯 Punto de presentación

**El Hito 1 está completo.** El recorrido del visitante funciona de punta a punta: entrar → buscar → filtrar → ver la ficha → consultar por WhatsApp o por formulario. Ya se le puede mostrar a la clienta.

### Pendiente que no bloquea

`RESEND_API_KEY` sigue sin configurarse, así que **los avisos por mail no salen** — pero ninguna consulta se pierde: quedan en la base con `notified_at` nulo. Cierra al resolverse A-05 y verificar el dominio en Resend.

### Próximo

**Revisión de hito** — `/review` sobre el Hito 1 completo, antes de arrancar el panel.

---

## Revisión del Hito 1 — 2026-08-23

Revisión independiente sobre UJ-01 a UJ-06, leyendo el código y el `dist/` construido, no la bitácora. Se corrieron `npm test` (21 en verde), `npm run check` (0 errores, 1 sugerencia), `npm run lint` (limpio) y `npm run build` (13 páginas, contra Supabase real). Los grep de filtrado se hicieron sobre un `dist/` recién construido, no sobre el que ya estaba.

**Resultado: 0 hallazgos críticos, 8 importantes, 13 menores.**

### Lo que se verificó y está bien

**RNF-10 — los datos de propietarios no llegan al sitio. Cero coincidencias.** Se volcó la base real y se buscó en todo el `dist/` cada valor de `owners` (nombres, teléfonos, mails, notas), de `developers` y de `leads`. Ninguno aparece. La única coincidencia de "propia" es la frase "terraza propia" en una descripción. El mecanismo que lo sostiene es `camposPublicos` en `frontend/src/lib/datos.ts`: la lista se escribe campo por campo justamente para que un `select *` no arrastre `owner_id`. Funciona, pero ver el hallazgo I-7 sobre qué lo protege de acá en adelante.

**Rutas del panel.** Solo existen tres: `login.ts`, `logout.ts` y `me.ts`, en `frontend/src/pages/api/admin/auth/`. `me` llama a `requerirSesion`; las otras dos son públicas por diseño y tiene sentido que lo sean. No hay ningún endpoint admin sin proteger porque todavía no hay ningún otro endpoint admin. La verificación real de este punto es de UJ-07 en adelante.

**El endpoint público.** No se encontró ningún agujero explotable. Todas las consultas van por Drizzle parametrizado, no hay una sola concatenación de SQL. La respuesta no devuelve el id del lead ni detalle de errores de base. El hash de contraseña de descarte (`gastarTiempoEquivalente`) se midió: 452 ms contra 474 ms de una comparación real, así que la defensa contra el ataque por tiempo efectivamente gasta el tiempo. Los datos del visitante se escapan antes de entrar al HTML del mail. Sí hay dos abusos de bajo impacto, anotados en los menores.

**Sin secretos en el sitio construido.** Se buscó cada valor de `.env` dentro de `dist/`: ninguno aparece. `.env.example` no tiene un solo valor real. `leerEnv` cae a `import.meta.env` con acceso dinámico, así que Vite no puede inlinear nada.

---

### Importantes — hay que arreglarlos antes de entregar

**I-1 · `/noticias` está en la barra de todas las páginas y no existe.**
`BarraSuperior.astro` lista dos enlaces fijos: `/propiedades` y `/noticias`. El segundo se generó en las trece páginas del `dist/` y apunta a una página que recién se construye en UJ-15. Cualquiera que lo toque cae en el 404. El seguimiento marca el cierre del Hito 1 como **el punto donde se le muestra el sitio a la clienta**, y ese es exactamente el escenario en el que se va a encontrar el enlace roto. Hasta que exista `/noticias`, el enlace no debería estar en la barra.

**I-2 · Sin JavaScript, un error del formulario desaparece sin dejar rastro.**
`leads.ts` redirige los errores a `/#contacto?envio=error`, `?envio=datos` y `?envio=limite`. Hay dos problemas encadenados. El primero: la query está **dentro del fragmento**, así que no la ve ni el servidor ni `location.search`. El segundo: nadie lee `envio` — se buscó en todo el proyecto y el único lugar donde aparece la palabra es el propio `leads.ts`. Y como el fragmento resultante es `contacto?envio=error`, que no coincide con ningún `id`, el navegador ni siquiera baja hasta la sección de contacto.

El resultado real: alguien sin JavaScript manda el formulario con el mail mal escrito, y termina arriba de todo en la home, con el formulario vacío y sin un solo mensaje. No sabe que falló. Si venía de una ficha, además lo sacó de la ficha.

Esto contradice el criterio de aceptación de UJ-06 — "si algo falta, el error dice exactamente qué" — precisamente en el camino que la decisión D-16 existe para proteger. D-16 se escribió porque "el modo de fallo más caro es el silencio", y este camino falla en silencio.

**I-3 · La vista a pantalla completa de la galería no se abre con el teclado.**
`galeria.js` cuelga un `click` de cada `<img>`. Una imagen no es enfocable, no tiene `role="button"`, no tiene `tabindex` ni manejo de Enter o Espacio. Quien navega con teclado ve el `cursor-zoom-in` pero no puede abrir nada. UJ-04 pide, con esas palabras, "vista a pantalla completa, navegable con teclado y con gestos", y el RNF de accesibilidad fija "navegación por teclado completa". Las miniaturas sí son enlaces y sí funcionan; lo que falta es la ampliación.

**I-4 · La ficha ignora la imagen de portada.**
`Galeria.astro` no renderiza nada cuando `imagenes.length === 0`, y `obtenerPropiedad` arma la galería solo desde `property_images`. `coverPath` no entra nunca. Entonces una propiedad publicada con portada pero sin galería muestra la columna izquierda de la ficha completamente en blanco, mientras que en el catálogo la card se ve perfecta. `CardPropiedad` sí tiene respaldo para el caso sin foto — un bloque crema con la marca. La ficha no tiene ninguno. Con la semilla no se ve porque las ocho propiedades tienen entre 4 y 6 fotos de galería.

**I-5 · Las miniaturas de la galería bajan la imagen de 1600px para pintarla a 112×84.**
En `Galeria.astro` la miniatura usa `img.src`, y `prepararImagen` define `src` como **la variante más grande**. La imagen grande sí usa `srcset` y elige bien; las miniaturas no tienen `srcset` y piden 1600px fijo. Se verificó en el HTML construido: 26 referencias a `-1600.webp` en una sola ficha.

Con la semilla no se nota, porque los marcadores sintéticos pesan 16 KB. Con fotos reales, una variante de 1600px ronda los 200-250 KB, así que seis miniaturas suman más de 1,2 MB por ficha, en el celular, encima de la imagen grande. El presupuesto de RNF-01 es 250 KB por imagen de galería y menos de 1,2 MB de página. Es un defecto de UJ-04, no una métrica pendiente de IT-09: la semilla lo está tapando.

**I-6 · La portada no guarda sus dimensiones, y eso va a romper imágenes en UJ-08.**
`properties` tiene `cover_path` y `cover_alt_es`, pero no ancho ni alto — `property_images` sí los tiene. Por eso `datos.ts` llama `prepararImagen(coverPath, 1600, 1200, ...)` con los números escritos a mano, y de ahí sale `anchosPara(1600) = [400, 800, 1600]`.

El problema es que `anchosPara` también decide qué variantes se **generan**, y lo hace con el ancho real del archivo: una portada de 1000px produce `-400`, `-800` y `-1000`. El HTML, en cambio, va a pedir `-1600.webp` como `src` y en el `srcset`. Ese archivo no existe: **portada rota**. Hoy no pasa porque `generarMarcador` fabrica todo a 1600×1200, que es justo lo que el código asume. En cuanto la clienta suba una foto más chica desde el panel, se rompe. El comentario del seed ("la card fija la proporción 4:3, así que no hacen falta las dimensiones") explica por qué no se guardaron, pero pasa por alto que las dimensiones no son solo para reservar espacio: deciden qué archivos existen.

**I-7 · No hay una sola prueba de autenticación, ni una que proteja RNF-10.**
Las 21 pruebas cubren UJ-06 y lo cubren bien — el correo caído, el robot, el sexto envío, los ámbitos que no se pisan. Pero `docs/nfr.md` nombra los caminos críticos con nombre y apellido: "autenticación, envío de leads, publicación de propiedad y carga de la imagen principal". De esos cuatro hay uno. IT-04 está marcada ✅ con cero pruebas: el límite de cinco intentos, la respuesta idéntica ante mail inexistente y el 401 sin token se verificaron a mano una vez y no hay nada que avise si se rompen.

El segundo hueco es más específico de este proyecto: lo único que hoy impide que los datos de propietarios lleguen al HTML es que alguien mantenga a mano la lista `camposPublicos`. El día que se sume un campo con un `select *` o se agregue `owner` a un join, nada lo detecta hasta IT-10. Una prueba que corra las consultas públicas y falle si aparece cualquier clave de `owners` cuesta muy poco y convierte una convención en una garantía.

**I-8 · El seguimiento no dice la verdad sobre el avance.**
`task_tracker.md` declara **17/28 (+2 parciales)**. Contando la propia tabla de detalle: terminadas son IT-01 a IT-05, IT-07 y UJ-01 a UJ-06, o sea **12**. IT-06 e IT-08 están 🟡. El total correcto es **12/28 más 2 parciales**, no 17.

La fila de infraestructura tiene el mismo problema al revés: dice "7/8 (+1 parcial)" cuando abajo hay dos tareas en 🟡, así que es 6/8 más 2 parciales. Importa porque este archivo es lo primero que se lee en cada `/session-start` y es de donde va a salir cualquier número que se le informe a la clienta.

---

### Menores — vale anotarlos

**M-1 · En el celular no hay forma de volver al catálogo.** Los enlaces de la barra son `hidden … sm:inline-block`, así que abajo de 640px solo quedan el logo y "Contacto". No hay menú desplegable. Desde una ficha o desde el 404, en móvil, el único camino al catálogo es el logo (que va a la home) o el botón del pie. En la home no molesta porque están los dos botones del hero; en el resto de las páginas sí.

**M-2 · El botón "atrás" no vuelve a la búsqueda anterior.** `filtros.js` usa `history.replaceState`, que no crea entradas de historial, así que el manejador de `popstate` no se dispara nunca y "atrás" te saca de la página. El comentario del archivo y el de UJ-03 afirman lo contrario. Compartir el enlace y recargar sí funcionan, que es lo que pide el criterio de aceptación; lo que no funciona es lo que el comentario promete de más.

**M-3 · El catálogo vacío responde con el mensaje equivocado.** Sin propiedades publicadas, `filtros.js` calcula cero visibles y muestra "No encontramos propiedades con esos criterios" — pero no hay criterios. Y sin JavaScript queda una grilla en blanco bajo el texto "0 propiedades disponibles". Cae dentro de IT-11, pero es el mismo componente que ya está terminado.

**M-4 · El campo corregido se queda rojo.** `mostrarError` agrega `border-red-600` y `limpiarErrores` no lo saca: quita `aria-invalid` y borra el párrafo, nada más. Quien corrige el mail y reenvía ve el campo marcado en rojo sin ningún mensaje al lado. Además `mostrarError` hace `setAttribute('aria-describedby', …)`, que pisa el valor que ya traía el campo — en el teléfono eso borra la referencia al texto de ayuda.

**M-5 · El JSON-LD de la ficha se escribe sin escapar.** `[slug].astro` hace `set:html={JSON.stringify(datosEstructurados)}` dentro de un `<script type="application/ld+json">`. `JSON.stringify` no escapa `/`, así que un `</script>` en el título o la descripción de una propiedad cierra el bloque y lo que sigue se interpreta como HTML. Hoy solo la administradora escribe esos campos, así que es autoinfligido, pero la lista de seguridad de `CLAUDE.md` pide contenido escapado y el arreglo es reemplazar `<` por `<`. De paso: la bitácora de UJ-06 afirma "ningún script incrustado en el HTML generado", y este bloque lo es.

**M-6 · Un cuerpo inválido no consume cuota, y eso se puede usar.** En `procesarConsulta` el límite se revisa antes de validar, pero `registrarIntento` corre **después** de que la validación pasa. La decisión es deliberada y está bien argumentada ("quien se equivoca escribiendo no queda bloqueado"), pero deja que alguien golpee `/api/leads` sin límite con basura: cada golpe cuesta un SELECT contra Supabase y ninguno se anota. Con el plan gratuito de por medio, conviene al menos anotar los inválidos con un contador aparte y más tolerante.

**M-7 · La IP se puede falsificar fuera de Netlify.** `ipDeLaPeticion` prueba `x-nf-client-connection-ip` y cae a `x-forwarded-for`. En Netlify la primera siempre está y la pone la plataforma, así que ahí no hay problema. Pero RNF-07 exige que el proyecto corra entero con `docker compose`, y en ese entorno la primera no existe y la segunda la escribe quien quiera: el límite por IP se saltea cambiando una cabecera. Conviene que el respaldo solo se use cuando una variable de entorno declare que hay un proxy de confianza adelante.

**M-8 · No hay `robots.txt` ni `sitemap.xml`.** `docs/nfr.md` los pide por nombre en la sección de SEO, y el `dist/` no tiene ninguno de los dos. Lo que llama la atención no es que falten —el Hito 1 no los pedía— sino que **ninguna tarea del seguimiento se los adjudica**: IT-09 es rendimiento y accesibilidad, IT-12 es despliegue. Con D-05 justificando Astro por el SEO, es raro que el sitemap no tenga dueño.

**M-9 · El ancla de "saltar al contenido" está pero el enlace no.** `<main id="contenido">` en la home, y ningún `href="#contenido"` en todo el sitio. Quedó la mitad de un salto de navegación que el RNF de accesibilidad da por hecho.

**M-10 · `/sistema` enlaza a una propiedad que no existe.** La card de muestra usa el slug `lote-selva`; el real es `lote-selva-norte`. La página tiene `noindex` y no está en la navegación, así que no llega a nadie de afuera, pero es un enlace roto en el `dist/` igual.

**M-11 · El CSP fija Supabase.** `img-src 'self' data: https://*.supabase.co`. Se verificó que hoy coincide con las URLs generadas. El día que el almacenamiento se mude a MinIO —que es el escenario que RNF-07 y `storage.ts` preparan explícitamente— las imágenes se bloquean sin ningún error visible más que el hueco. Conviene derivar el origen de `STORAGE_PUBLIC_URL` en vez de escribirlo en el `netlify.toml`.

**M-12 · `admin_users` está vacía en la base real.** `npm run seed` no crea la administradora; eso lo hace `npm run db:crear-admin`, aparte. No es un defecto —tener la contraseña en el seed sería peor—, pero UJ-07 e IT-11 arrancan contra una base donde nadie puede entrar, y conviene saberlo de antemano.

**M-13 · El camino con video del hero nunca se ejercitó.** `hero.video_url` está vacío en `site_settings`, así que las trece páginas construidas muestran solo `hero-respaldo.jpg` (1920×1080, 24 KB). El bloque `<video>` de `Hero.astro` está escrito y se lee correcto —`muted`, `playsinline`, `loop`, oculto con `prefers-reduced-motion`—, pero nunca se renderizó. La verificación de UJ-01 "el video no bloquea la carga ni dispara audio" sigue sin poder hacerse, y UJ-01 está marcada ✅. Depende de la acción A-03, no del código; vale dejar la verificación anotada como pendiente en lugar de darla por hecha.

---

### Sobre el estado del hito

El recorrido del visitante existe y funciona: se entra, se busca, se filtra, se abre una ficha, se consulta por WhatsApp o por formulario. Nada de lo que encontré compromete datos ni deja el sitio inseguro, y por eso no hay hallazgos críticos.

Lo que sí hay es una diferencia entre lo que el seguimiento declara terminado y lo que se sostiene solo. Tres de los importantes —I-2, I-3 e I-4— son criterios de aceptación escritos en `user_journeys.md` que no se cumplen. Dos más —I-5 e I-6— son defectos que la semilla tapa porque genera exactamente los datos que el código asume: van a aparecer el día que la clienta cargue una foto propia. Y I-1 es un enlace roto en la barra de todas las páginas, justo antes de la reunión donde se muestra el sitio.

Mi recomendación es cerrar I-1 e I-2 antes de mostrarle nada a la clienta —son los dos que se ven—, y el resto antes de arrancar el Hito 2, en particular I-6, que es una deuda del modelo de datos y va a ser más cara de pagar una vez que UJ-08 esté construido encima.

---

## Correcciones de la revisión + UJ-15 — ✅ Completadas

Cuatro de los ocho hallazgos importantes de la revisión del Hito 1, más el journey que uno de ellos destapó. Verifiqué cada hallazgo contra el código antes de tocarlo: los cuatro eran reales.

### I-2 · Sin JavaScript, un error del formulario desaparecía en silencio

**Mío, de ayer.** Escribí el destino como `/#contacto?envio=error`. Eso fallaba de dos maneras a la vez: el `?envio=error` quedaba **dentro del fragmento**, así que ni siquiera era una query string, y aunque lo hubiera sido, nadie la leía. El visitante volvía al tope de la home sin ningún mensaje, convencido de que había enviado la consulta.

Lo di por bueno porque probé el camino feliz sin JavaScript —que sí andaba— y **nunca probé el camino de error sin JavaScript**. Es exactamente el modo de fallo que D-16 existe para evitar, y se me coló igual.

**Arreglado en dos partes**

1. `consulta-no-enviada.astro` — página propia, generada en el servidor, con un mensaje distinto según el motivo y salida por WhatsApp.
2. **Se sacó `novalidate` del HTML.** Ese atributo apagaba la validación del navegador para todos, incluido quien no tiene script: los datos malos llegaban al servidor para no recibir explicación. Ahora el script se lo pone al cargar, y recién ahí toma el control. Sin script, valida el navegador.

### I-3 · La galería no se abría con teclado

Las fotos eran `<img>` con un `click` encima: sin `tabindex` ni `role`, no había forma de llegar con tabulador. UJ-04 lo pedía con esas palabras y lo di por cumplido.

Ahora el script —que es quien agrega la única razón para activarlas— las vuelve operables: `role="button"`, `tabindex`, etiqueta que dice qué foto es, Enter y barra espaciadora, y foco visible.

### I-6 · La portada asumía 1600 px a mano

`aPropiedad` escribía `1600, 1200` fijo. Las variantes de una imagen llegan **solo hasta su propio ancho**, así que una portada más chica iba a hacer pedir `-1600.webp`, un archivo que nadie creó: recuadro roto. No se veía porque los datos de demostración fabrican todo a 1600×1200.

Y ya estaba mal para los artículos: sus portadas son **16:9**, así que el alto declarado nunca fue 1200.

**Arreglado en el modelo**, que es donde estaba el problema: `properties` y `articles` ganaron `cover_width` y `cover_height` (migración 0003), la semilla guarda las dimensiones que ya calculaba y descartaba, y la capa de datos las lee. Cuando no hay dimensión guardada, el respaldo pasó a ser **el ancho más chico**: en el peor caso la foto se ve menos nítida, en vez de romperse.

> Se arregló ahora y no después de UJ-08 a propósito: en cuanto Laura empiece a subir portadas reales, cada una que no mida 1600 sería una imagen rota en producción.

### I-1 · `/noticias` estaba en el menú y no existía → **UJ-15**

Enlazado desde las 13 páginas, llevaba a un 404. Se decidió construir la página en vez de esconder el enlace.

- `/noticias` — listado, con estado vacío que explica qué va a haber ahí y ofrece dos salidas
- `/noticias/[slug]` — la nota, con migas, fecha, minutos de lectura, otras noticias y datos estructurados
- `lib/articulos.ts` — parte el cuerpo en bloques, y `CardNoticia.astro`

**El cuerpo nunca se inserta como HTML.** Se parte en títulos y párrafos, y cada bloque se renderiza interpolando el texto, que Astro escapa solo. Lo escribe la clienta desde el panel, así que no es contenido de confianza.

### Un enlace roto más, que apareció al buscarlos todos

Escribí un chequeo que recorre las 17 páginas construidas y sigue cada `href` interno. Encontró **`/propiedades/lote-selva`** en el muestrario `/sistema`: un slug de ejemplo que no coincidía con ninguna propiedad. Corregido. **Ahora no queda ningún enlace roto en el sitio.**

### De paso

`npm run seed` y `npm run db:migrate` **no cargaban `.env`**, así que los comandos documentados en la memoria del proyecto no funcionaban tal cual estaban escritos. Vengo esquivándolo a mano con `--env-file` toda la sesión. Ahora los scripts lo cargan solos.

### Verificado

_El camino de error sin JavaScript_ — con `curl`, como lo haría un navegador sin script
✅ Datos inválidos → 303 a `/consulta-no-enviada?motivo=datos`, con su mensaje propio
✅ Envío correcto → 303 a `/gracias`
✅ La página muestra el motivo correcto, con WhatsApp y vuelta al formulario

_La galería con teclado_ — simulando a alguien que llega con tabulador
✅ Recibe el foco · ✅ abre con Enter · ✅ abre con barra espaciadora · ✅ `role="button"` y "Ampliar foto 1 de 6"

_Las dimensiones_ ✅ Las portadas de noticias declaran **1600×900**, su proporción real
✅ 35 pruebas, 9 nuevas: que el `srcset` nunca pida una variante que no se generó, y que sin dimensiones se pida la más chica

_El contenido editable no ejecuta nada_ — probado con un cuerpo hostil real cargado en la base
✅ `<script>` y `<img onerror>` salen escapados · ✅ el único `<script>` de la página son los datos estructurados
✅ Queda cubierto por pruebas, para no depender de que alguien lo repita a mano

_Enlaces_ ✅ Las 17 páginas recorridas, cada `href` interno seguido: **ninguno roto**

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · **35 pruebas** · build: 17 páginas

### Lo que sigue abierto de la revisión

Cuatro importantes sin tocar: las miniaturas que bajan la variante de 1600 px para pintarla a 112 (invisible con la semilla, cara con fotos reales), la falta de pruebas de autenticación, la falta de una prueba que proteja RNF-10, y los trece menores — entre ellos **no hay menú móvil**, así que desde una ficha en el celular no se llega al catálogo.

---

## Ajustes pedidos por la clienta — ✅ Aplicados

**2026-08-23.** Cinco correcciones que llegaron por la usuaria.

**1 · Fuera los corazones del hero.** Los botones "Invertir" y "Rentar" tenían un emoji delante. Se eliminaron, y con ellos el `gap-2` que los separaba del texto y que ya no separaba nada.

**2 · El número principal pasa a ser el de Argentina** (`+54 9 351 819 4131`). Es un cambio de configuración, no de código: se actualizó `whatsapp.primary` en la base y el valor por defecto de la semilla, para que un recargado no lo pise.

> **Consecuencia que conviene tener presente**: todos los enlaces de WhatsApp del sitio —el botón flotante, el pie, la ficha— ahora apuntan al número argentino. El de México sigue publicado, pero como teléfono (`tel:`), no como WhatsApp. Si la idea era que ambos abrieran WhatsApp, es un cambio aparte.

**3 · El mail de las consultas.** No hubo nada que cambiar: `contacto.email` y `contacto.lead_email` ya eran `reynaderealestate@gmail.com`. **Esto cierra A-05**, que estaba pendiente desde el acuerdo y era lo único que trababa IT-06.

**4 · La bajada de Noticias** pasó a "Lo que pasa en el mercado inmobiliario, contado sin vueltas.". De paso se movió a `i18n/es.json`: estaba escrita dentro de la página, lo que contradice la regla del propio proyecto de que los textos de interfaz no van incrustados en componentes.

**5 · El hero cambia de jerarquía.** La pregunta pasa a ser el `<h1>` y el claim de marca queda debajo, más chico y en rosa — según la referencia que mandó la clienta.

- El `<h1>` bajó de 56 a 46 px en escritorio: la clienta pidió prioridad, no tamaño
- El claim quedó en 24 px, en el rosa de la paleta
- Los nombres de las props (`titulo`, `pregunta`) siguen describiendo **el contenido, no el lugar** donde cae cada uno. Renombrarlos por su posición los volvería a dejar mal el día que la jerarquía cambie otra vez
- Se le sumó el punto final al claim, como en la referencia

**Verificado en el navegador**
✅ Cero corazones en la página; los botones dicen solo "Invertir" y "Rentar"
✅ `<h1>` = la pregunta, 46 px, en mayúsculas · claim = 24 px en `rgb(251, 86, 150)`
✅ El único número de WhatsApp de la home es `5493518194131`; el de México queda como `tel:`
✅ La bajada de Noticias es la nueva
✅ En móvil la pregunta baja a dos líneas y no se rompe nada

**Una falsa alarma que vale anotar.** Al verificar, el navegador informaba que el archivo `-1600.webp` medía 422 px, lo que habría significado imágenes borrosas en todo el sitio. Se descargaron las tres variantes del bucket y se midieron: **400×225, 800×450 y 1600×900, correctas**. El 422 era un artefacto del viewport emulado del panel de previsualización, no del sitio.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 17 páginas

---

## UJ-16 · Conocer a Laura — ✅ Completada

**Construido**: `SeccionNosotros.astro`, sumada a la home entre destacadas y contacto.

**La decisión que gobierna la sección**

La usuaria propuso poner una foto genérica y reemplazarla cuando llegue la de Laura. Se avanzó por el otro camino, que es el que ya estaba decidido en D-10: **la sección se ve terminada sin retrato, y el retrato entra después desde el panel sin tocar código**.

El motivo no es purismo. Un paisaje de stock en la portada es ambiente y nadie lo lee como una propiedad puntual; una cara ajena en la sección personal **se lee como Laura**. En un negocio que se sostiene en la confianza personal eso juega en contra, y lo provisorio tiende a quedarse.

**Dos composiciones reales, no una con un hueco**

_Sin foto_ — una sola columna centrada a ancho de lectura, con la corona arriba y la primera frase destacada en Playfair. Se lee como una carta, que es lo que el texto es.

_Con foto_ — dos columnas, texto a la izquierda y retrato a la derecha; en móvil el retrato va arriba.

**Verificado — los dos estados, midiendo**

_Sin foto_ (lo que se publica hoy)
✅ 8 párrafos, 2 coronas, el claim "Your dream is reality" cerrando con filete dorado
✅ En el HTML construido **no aparece ninguna etiqueta de imagen**: no hay recuadro vacío que disimular

_Con foto_ — se cargó una de prueba en `nosotros.photo`, se comprobó y se revirtió
✅ La grilla pasa a dos columnas reales: `512px 320px`
✅ El retrato ocupa 320×400 — proporción 4:5 con recorte, así entra bien cualquier foto que mande, venga apaisada o vertical
✅ `width`/`height` declarados: el espacio queda reservado y la página no salta al cargar
✅ La imagen carga, decodifica y está encima de todo (`elementFromPoint` sobre su centro devuelve la propia imagen)

> El panel de previsualización **no logra capturar esa imagen en las capturas**, aunque el navegador confirme que está pintada. Es el mismo artefacto que apareció con las portadas de noticias. Se verificó por medición y no a ojo.

**Dos hallazgos de paso**

1. **`--radius-tarjeta` no existe.** La usé en el formulario de consulta y en la ficha, pero la variable definida es `--radius-card`. Una variable inexistente deja la propiedad inválida: **las tarjetas del formulario venían con las esquinas cuadradas** desde UJ-06. Corregido en los dos lugares.
2. **La configuración se cachea a nivel de módulo.** Es correcto para el build —una sola consulta— pero en desarrollo obliga a reiniciar el servidor para ver un cambio hecho en la base. Anotado para no volver a perseguirlo.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · **35 pruebas en verde** · build: 17 páginas

### Pendiente que no bloquea

`nosotros.photo` sigue vacío a propósito. Cuando Laura mande su retrato se carga desde el panel y la sección cambia sola (A-03b).

---

## UJ-14 · Leer el informe Reyna Insights — ✅ Completada

Con esto **el sitio público queda entero**: no falta ninguna pantalla de las que ve el visitante.

**Construido**

- `frontend/src/pages/insights/[slug].astro` — el informe completo
- `SeccionInsights.astro` — la entrada desde la home, **sin logo**, como pide el diseño aprobado
- `CuerpoArticulo.astro` — un solo renderizador de cuerpo, compartido con las noticias

**El defecto que apareció al construirla**

Los cuatro pilares del informe salían **con su párrafo entero adentro del encabezado**. La causa: el texto los escribe pegados, sin línea en blanco entre el título y su párrafo, y la expresión regular del separador usaba la bandera `s`, que hace que el `.` cruce el salto de línea. El encabezado se comía todo hasta la próxima línea en blanco.

**El defecto ya existía antes de esta tarea**, en el mismo separador que usan las noticias. No se veía porque las noticias sí dejan línea en blanco después de cada título. Habría aparecido el primer día que la clienta escribiera de corrido desde el panel.

Ahora el separador corta la primera línea del resto, así que las dos formas de escribir funcionan.

**También se sumaron las citas.** El informe usa `>` dos veces y el separador no lo reconocía: el signo salía impreso en la página. Lo mismo le habría pasado a la clienta al citar algo desde el panel.

**Verificado**

_El cuerpo se parte bien_ — sobre el HTML construido
✅ 4 secciones (`h2`), **4 pilares (`h3`) de entre 15 y 23 caracteres** — ninguno se llevó su párrafo
✅ 2 citas como `blockquote`, sin el `>` a la vista · ✅ 8 párrafos

_Criterio "legible sin zoom en 360px"_ — medido a 360 px reales, no forzando el contenedor
✅ Cuerpo 17 px con interlineado de 27,6 px · encabezado 30 px · pilares 20 px · citas 18 px
✅ **Nada desborda y el documento no scrollea de costado**

_Criterio "indexable"_
✅ Sin etiqueta `robots` · ✅ canónica correcta · ✅ datos estructurados de tipo `Article`

_Criterio "sin logo en la portada"_
✅ El bloque de la home no contiene el logo

_Criterio "con los datos de contacto de Reyna"_
✅ Cierra con Laura presentándose, botón de contacto, WhatsApp y el mail

_Regresión_: las noticias pasaron a usar el renderizador compartido y siguen correctas — 3 encabezados y 4 párrafos, todos con largo de encabezado.

_El texto_: "estratégica" ya figuraba corregido a "inteligente" en el contenido cargado.

**Pruebas**: 8 casos nuevos sobre el separador — encabezado pegado a su párrafo, `##` frente a `###`, citas de una y varias líneas, un `>` en medio de un párrafo que **no** debe volverse cita, y el informe recortado como caso completo. **43 en verde.**

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 18 páginas

---

## UJ-07 · Entrar al panel — ✅ Completada

Primer journey del Hito 2. Se hizo antes que UJ-08 porque no se puede cargar una propiedad sin poder entrar: los endpoints de sesión existían desde IT-04, pero no había ninguna pantalla de `/admin`.

**Construido**

- `frontend/src/middleware.ts` — la puerta del panel, una sola para todo
- `layouts/Panel.astro` — barra lateral y contenido; en móvil el menú pasa a una fila arriba
- `pages/admin/login.astro` y `pages/admin/index.astro` — ingreso y tablero
- `lib/panel.ts` — las consultas del panel, separadas de las del sitio público
- `public/js/ingreso.js` y `public/js/panel.js`

**La protección va en un middleware, no en cada página**

Es el espíritu de D-13 llevado a las pantallas. Si cada una escribiera su propia verificación, tarde o temprano una quedaría sin proteger — y sería justo la que nadie mira. Ahora **una página nueva bajo `/admin` queda protegida por existir**.

El middleware hace dos cosas más:

- **Redirige al ingreso en vez de devolver 401.** Quien navega espera una pantalla, no un error de API. Y recuerda adónde iba: `/admin/propiedades` sin sesión vuelve a `/admin/login?volver=%2Fadmin%2Fpropiedades`.
- **Prohíbe cachear todo el panel.** Sin esto, al cerrar sesión el botón "atrás" vuelve a mostrar la última pantalla desde el historial, con los datos a la vista, aunque la sesión ya no exista.

> El parámetro `volver` se valida contra `/^\/admin(\/[\w\-/]*)?$/`. Sin eso, el ingreso sería un trampolín: un enlace con `?volver=https://otro-sitio` mandaría a la clienta afuera después de escribir su contraseña.

**El ingreso no finge funcionar sin JavaScript**

El botón viene deshabilitado desde el HTML y lo habilita el script. El endpoint responde JSON, así que sin script el navegador mostraría un volcado de datos en pantalla. Es preferible un botón que no responde y un `<noscript>` que lo explica.

Es lo contrario de lo que se decidió para el formulario público (D-16), y a propósito: ahí quien entra es un cliente que se pierde para siempre; acá es la administradora del sitio, en su computadora, que puede activar JavaScript.

**Verificado — los cuatro criterios del journey**

_"Rutas protegidas sin token"_
✅ `/admin` sin sesión → 302 a `/admin/login` · ✅ `/admin/propiedades` → 302 conservando el destino
✅ Con sesión, el tablero responde 200

_"Sesión expira a las 8 horas"_
✅ La cookie trae `Max-Age=28800` y el token `exp - iat = 28800` segundos. Ocho horas exactas
✅ Además `HttpOnly`, `SameSite=Strict`, `Path=/`

_"El hash nunca viaja al cliente"_
✅ Ni el ingreso ni `me` devuelven nada parecido a un hash: solo id, nombre y email

_"Al cerrar sesión no puedo volver con el botón atrás"_ — probado de verdad en el navegador
✅ Se entró, se vio el tablero con datos, se cerró sesión y **se apretó atrás**: cae en la home pública, no en el panel
✅ El panel responde `Cache-Control: no-store, no-cache, must-revalidate`
✅ La cookie no se ve desde JavaScript

_Mensaje de error_
✅ Credenciales incorrectas → 401 con "Email o contraseña incorrectos", el mismo texto exista o no el email

**El tablero**

Cuatro contadores y las últimas cinco consultas. Las consultas nuevas van primero y en rosa: es la única cifra que pide una acción. Las que **no se avisaron por mail salen marcadas "Sin aviso"** — son las que se podrían perder sin que nadie se entere, y hoy son todas, porque falta la cuenta de Resend.

**Un error mío durante la verificación**: el script que creaba el administrador de prueba imprimía la clave con `console.warn`, que escribe en el canal de errores, y yo lo estaba descartando. La clave nunca se guardó y el ingreso "fallaba" con credenciales correctas. Era el script de prueba, no el código.

**Limpieza**: se borró el administrador temporal —**no queda ninguno cargado**— y una consulta de prueba que había quedado de una verificación anterior. Quedan las cinco de la semilla.

> Para crear la usuaria real: `npm run db:crear-admin` desde una terminal. Pide la contraseña por teclado y no la muestra, así no queda en el historial. **Tiene que correrlo la usuaria**, no yo.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · 43 pruebas en verde · build: 19 páginas

### Próximo

**UJ-08 · Publicar una propiedad** — el journey más grande del proyecto.

---

## UJ-08 · Publicar una propiedad — 🟡 En curso (primera parte)

El journey más grande del proyecto. Se hace por partes: **datos primero, imágenes después**. Esta tanda deja el listado y toda la lógica de alta y edición funcionando; falta el formulario en pantalla y la carga de fotos.

**Construido**

- `backend/lib/slug.ts` — direcciones legibles, únicas
- `backend/lib/propiedades.ts` — crear, editar, publicar, listar, borrar. Con la base por parámetro (D-17)
- Esquemas de propiedad en `backend/lib/validation.ts`
- `api/admin/properties/index.ts` y `[id].ts` — listar, crear, leer, editar, borrar
- `pages/admin/propiedades/index.astro` — el listado con filtros

**Dos defectos encontrados por las pruebas, no por la pantalla**

**1 · Un precio vacío se guardaba como USD 0.** `z.coerce.number()` convierte `''` en `0`, porque `Number('') === 0`. La propiedad quedaba con precio cero y se publicaba mostrándolo. Afectaba también a metros cubiertos, metros totales y año: una propiedad sin metros cargados habría mostrado "0 m²", que se lee como un error del sitio.

Ahora el vacío se descarta **antes** de coercionar y queda en nulo. Cubierto con dos pruebas.

> Es un defecto que ninguna demostración habría mostrado: al cargar una propiedad de verdad siempre se pone precio. Aparece el día que alguien deja un campo en blanco, que con quince propiedades cargadas es cuestión de tiempo.

**2 · El contador decía "8propiedades en total"**, sin espacio. Es el mismo defecto que apareció en UJ-03: el compilador colapsa el espacio entre expresiones contiguas. Se arma la frase completa en una sola expresión.

**Decisiones**

_La dirección pública no cambia aunque cambie el título._ Se genera al crear y no se toca. Cambiarla rompería todo enlace que alguien haya compartido — y en este negocio los enlaces a una propiedad circulan por WhatsApp.

_Dos propiedades con el mismo título no chocan_: la segunda queda `casa-abaton-2`. "Departamento en Tulum" es un título de lo más probable.

_Toda propiedad nace en borrador._ Publicar es un acto aparte y deliberado.

_El enlace de Drive se valida como Drive_, no como una dirección cualquiera. El campo existe para el material que la clienta comparte desde ahí; otra cosa pegada en ese lugar es casi siempre un error.

**Verificado — contra la base real, con sesión**

_Protección_
✅ Los **cinco** endpoints devuelven 401 sin sesión, con "Necesitás iniciar sesión"
✅ `/admin/propiedades` sin sesión redirige al ingreso conservando el destino

_Listado_
✅ Trae las 8 propiedades con zona y tipología · ✅ filtra por estado · ✅ busca por texto ("abaton" → Casa Abaton)
✅ **No devuelve `ownerId` ni ningún dato de propietarios** (RNF-10)

_Alta y publicación_
✅ Crear devuelve 201 con id y dirección generada
✅ **Publicar sin imagen principal se rechaza** con "Cargá la imagen principal antes de publicar", el texto exacto del contrato
✅ Un enlace que no es de Drive se rechaza indicando el campo
✅ Borrar responde 200

_Pruebas_: 22 casos nuevos sobre la lógica de propiedades — precio vacío, título corto, sin zona, enlaces de Drive válidos e inválidos, publicar sin portada, el título que cambia sin mover la dirección, filtros del listado y que nunca aparezcan datos de propietarios. **69 en verde.**

**Limpieza**: se borraron el administrador temporal de la verificación y la propiedad de prueba. Queda solo el administrador real.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 20 páginas

### Lo que falta de UJ-08

- Formulario en pestañas (datos, amenidades, textos, publicación)
- Carga de imagen principal y galería con arrastrar, soltar y reordenar
- Gestión de catálogos

---

## UJ-08 · Segunda parte — el formulario

**Construido**

- `components/admin/FormularioPropiedad.astro` — el formulario en cinco pestañas
- `components/admin/CampoPanel.astro` — campo con etiqueta, ayuda y hueco de error
- `public/js/propiedad.js` — pestañas y guardado
- `pages/admin/propiedades/nueva.astro` y `[id].astro`
- `obtenerCatalogos()` en `lib/panel.ts` — las cinco listas en una sola consulta

**Las pestañas no son páginas**

Todos los campos existen siempre en el HTML; las pestañas solo muestran y ocultan. Eso permite lo que importa: **un error en "Datos" se señala aunque la clienta esté parada en "Textos"** — el formulario cambia de pestaña solo y pone el foco en el campo. Se verificó de esa manera exacta.

Como efecto secundario, sin JavaScript se ven las cinco secciones una debajo de la otra: un formulario largo pero completo, en vez de una pantalla con campos inalcanzables.

**Dos defectos encontrados al usarlo, no al leerlo**

**1 · Dejar "— Sin elegir —" en desarrollista o propietario impedía guardar la propiedad entera.** Los dos campos son opcionales, pero la lista manda `''` y `Number('')` es `0`, que no pasa `.positive()`. **Es la misma causa raíz que el precio en USD 0** de la tanda anterior: yo había arreglado los campos numéricos y no las listas opcionales.

Es un defecto que la clienta habría encontrado en la primera propiedad que cargara: casi ninguna tiene desarrollista.

**2 · Los mensajes salían en inglés de la librería**: "Too small: expected number to be >0". Una fuga de las tripas de la validación a la pantalla, justo lo que la regla del proyecto prohíbe. Ahora dicen "Elegí un desarrollista de la lista".

**Una corrección de criterio**

Los títulos de sección estaban ocultos con `sm:hidden`, atados al ancho de pantalla. La condición correcta no es el ancho sino **si el script corrió**: son el reemplazo de las pestañas para quien no las tiene. Ahora los oculta el propio script al activar las pestañas.

**Verificado en el navegador, de punta a punta**

✅ Guardar con el título vacío desde la pestaña "Publicación" → **salta a "Textos" y enfoca el título**
✅ Cargar una propiedad completa la crea, redirige a su edición y muestra la dirección generada
✅ **Publicar sin foto**: se crea igual como borrador y el aviso dice **las dos cosas** — "La propiedad se guardó como borrador, pero no se pudo publicar: Cargá la imagen principal antes de publicar". Si solo mostrara el error, parecería que se perdió lo cargado
✅ En la base quedó todo: precio, dormitorios, baños, m² cubiertos, descripción con sus párrafos y las dos amenidades
✅ Los campos vacíos quedaron en **nulo**: m² totales, año, desarrollista y propietario
✅ El aviso "Dato interno. No se muestra en el sitio." acompaña al propietario

**Pruebas**: 2 nuevas — las listas opcionales sin elegir, y que los mensajes estén en castellano. **71 en verde.**

**Limpieza**: administrador temporal y propiedad de prueba borrados. Quedan el administrador real y las 8 propiedades de la semilla.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 21 páginas

### Lo que falta de UJ-08

Carga de imagen principal y galería con arrastrar, soltar y reordenar. Y los catálogos, para que las listas se puedan administrar.

---

## UJ-08 · Tercera parte — imágenes — ✅ Journey completo

**Construido**

- `backend/lib/imagenesPropiedad.ts` — portada y galería, con base y almacenamiento por parámetro
- `api/admin/properties/[id]/cover.ts` y `images.ts`
- `components/admin/Galeria.astro` y `public/js/galeria-admin.js`

**Se reordena arrastrando y también con botones**

El arrastre solo deja afuera a quien navega con teclado, y **elegir qué foto va primero es justamente lo que decide qué se ve en el sitio**. Cada fila tiene flechas además del asa de arrastre, y el foco se queda en el botón después de mover — si no, hay que volver a buscarlo en cada paso.

**Todo guarda solo, sin botón.** Subir, reordenar, describir y borrar son acciones completas. Un "guardar" aparte para el orden es una trampa: se reordena, se sale, y se perdió. El orden y las descripciones se agrupan con una espera corta, porque arrastrar dispara muchos cambios seguidos.

**Decisiones**

_La portada anterior se borra recién después de que la nueva quedó guardada._ Si algo falla en el medio, la propiedad se queda con la vieja en lugar de quedarse sin ninguna.

_No se puede quitar la portada de una propiedad publicada._ Quedaría con un hueco en el catálogo y se compartiría sin foto. Hay que pasarla a borrador primero, y el mensaje lo dice.

_Una foto rota no cancela a las buenas._ Si alguien arrastra diez y una está dañada, entran nueve — y **se avisa cuántas entraron**, porque si no la clienta cuenta las miniaturas y no entiende qué pasó.

**Verificado — contra Supabase y el bucket reales**

✅ Un archivo que **no es una imagen, renombrado a `.jpg`**, se rechaza: "El archivo no es una imagen JPG, PNG o WebP". No se guardó nada — manda la firma binaria, no la extensión
✅ Portada real: se guarda con dimensiones y sus tres variantes
✅ Dos fotos a la galería: `agregadas: 2, pedidas: 2`
✅ **Una buena y una falsa juntas**: `agregadas: 1, pedidas: 2`
✅ Con portada, **publicar funciona**
✅ Quitar la portada de una propiedad publicada se rechaza indicando qué hacer

_Reordenar, probado con los botones de teclado en el navegador_
✅ La tercera pasa a primera, las posiciones se renumeran
✅ **El nuevo orden quedó en la base**, y la descripción viajó con su imagen, no con su posición
✅ El aviso "Guardado." aparece al terminar

_Pruebas_: 14 casos nuevos con un almacenamiento en memoria — el archivo disfrazado, el tope de 15 con su mensaje, pasarse del tope, la foto rota entre buenas, borrar del bucket y de la base, reordenar, y que **un id de otra propiedad se ignore** en vez de dejar reordenar una galería ajena. **80 en verde.**

**Limpieza**: la propiedad de prueba se borró junto con sus 4 archivos del bucket. Los archivos huérfanos ocupan lugar y no los reclama nadie.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · build: 21 páginas

### UJ-08 queda completo salvo los catálogos

Zonas, tipologías, desarrollistas, amenidades y propietarios todavía se administran solo por semilla. Es UJ-08b y va con el resto del Hito 2.

---

## Primer despliegue a Netlify — 🟡 En curso

**2026-09-06.** El sitio está publicado en `reyna-de-real-estate.netlify.app`, bajo la cuenta y el equipo de la marca (`reynaderealestate@gmail.com`), como pedía D-03.

**Lo que se hizo**

- Sitio creado y vinculado; 12 variables de entorno cargadas por la usuaria
- `PUBLIC_SITE_URL` corregida: venía apuntando a `localhost`, lo que habría dejado todas las direcciones canónicas y los metadatos sociales del sitio declarados como localhost, y los enlaces del mail de aviso rotos
- Bloqueo de indexación (`robots.txt` + cabecera `X-Robots-Tag`) mientras el contenido sea de demostración. **Anotado como A-11 para quitarlo antes de la entrega** — son las dos cosas, no una

**Verificado en producción**
✅ Home, catálogo, ficha, noticias, informe y 404 responden
✅ `/admin` sin sesión redirige al ingreso; los endpoints del panel devuelven 401
✅ `Strict-Transport-Security` llega
✅ **Una consulta enviada al sitio en vivo quedó guardada en Supabase**

**D-08 confirmado en el servidor real.** En los registros de la función:
`La consulta se guardó pero el aviso falló — Falta configurar RESEND_API_KEY`.
La consulta se guardó, el mail no salió, **no se perdió nada**. Es el comportamiento que se diseñó, ocurriendo en producción y no en una prueba.

**El defecto que destapó el despliegue** — ver D-19

El panel devolvía 500. Causa inmediata: se construyó en una Mac y subió el binario de macOS de `sharp` a un servidor Linux. Causa de fondo: `lib/datos.ts` importaba dos funciones de aritmética desde el mismo archivo que el procesador de imágenes, y eso **arrastraba `sharp` a todas las páginas**.

Corregido: los anchos viven en `backend/lib/anchosImagen.ts`, sin dependencias. Comprobado sobre el paquete construido — el módulo con `sharp` ahora lo importan solo los dos endpoints de subida.

**Pendiente**: conectar el repositorio para que construya Netlify y no la máquina de desarrollo. Es lo que hace que `sharp` se instale para Linux.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · 80 pruebas en verde

---

## Correcciones desde el sitio en producción

**2026-09-07.** Cuatro observaciones de la usuaria probando el panel publicado.

**1 · La solapa volvía a "Datos" al subir o borrar una foto**

Subir una imagen recarga la página —es la forma de que las miniaturas queden bien sin reconstruirlas a mano en el navegador—, y al recargar el formulario arrancaba de nuevo en la primera solapa. La operadora cargaba una foto desde "Material" y el panel la mandaba al principio.

**La solapa abierta pasa a vivir en la dirección** (`?seccion=material`), con `replaceState` y no un salto: cambiar de pestaña no es navegar y no debe llenar el historial. De paso, ahora una pestaña concreta se puede compartir por enlace.

Verificado en el navegador subiendo y borrando una foto de verdad: la pantalla se queda en Material en los dos casos.

**2 · Los cambios no se ven en el sitio — no es un error**

El sitio público **es estático** (D-04): se genera al construir y las visitas no tocan la base. Guardar y republicar cambia el dato, pero la página que ve el visitante sigue siendo la generada la última vez.

Falta el botón "Publicar cambios" que dispara la reconstrucción, que es **UJ-13**. Hoy `NETLIFY_BUILD_HOOK_URL` está vacío.

> Es un modo de fallo silencioso y caro: la clienta cree que publicó y no pasa nada. Sube la prioridad de UJ-13 por encima del resto del Hito 2.

**3 · Más filtros en el listado**: tipología, zona, desarrollista y operación, sumados a estado y búsqueda. Son campos de un formulario `GET`, así que **funcionan sin JavaScript** y el estado vive en la dirección — una búsqueda se comparte, igual que en el catálogo público.

Un id inventado (`?zona=999`) devuelve cero resultados en vez de romper.

**4 · Las secciones del menú devolvían 404**

Cinco entradas del menú lateral llevaban a "no encontramos esta página", que se lee como algo roto y no como algo pendiente. Ahora cada una tiene su pantalla con el sello **En construcción**, qué va a poder hacer ahí, y **qué puede hacer mientras tanto** — con enlace a donde sí se puede.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · 80 pruebas en verde

---

## UJ-13 · Publicar los cambios — ✅ Completada

El journey que cierra el agujero más caro del panel: hasta ahora la clienta guardaba, veía "publicada", y el sitio seguía igual. Sin ninguna señal de que faltaba un paso.

**Construido**

- `backend/lib/publicacion.ts` — disparo, agrupado y estado
- Migración `0004_publicaciones` y su tabla
- `api/admin/publish.ts` — `GET` para el estado, `POST` para disparar
- `frontend/src/pages/build.json.ts` — la marca de cuándo se generó el sitio
- La barra del panel y `public/js/publicar.js`

**Por qué una tabla y no una clave de configuración**

Guardar la fecha de publicación en `site_settings` habría actualizado `site_settings.updated_at`, y **el propio acto de publicar habría contado como un cambio pendiente**: el panel diría "tenés cambios sin publicar" para siempre. Hay una prueba que fija justamente eso.

**Cómo sabe que ya está en vivo**

El sitio publica en `/build.json` la fecha en que se generó. El panel la guarda antes de disparar y la vuelve a mirar cada cinco segundos; cuando cambia, el cambio **ya lo ve el visitante**.

Preguntarle a la API de Netlify era lo obvio, pero exigía otra credencial y respondería "el build terminó", que no es lo mismo que "ya se ve". Lo segundo es lo que le importa a la clienta.

**Tres decisiones que evitan mentiras**

_Sin webhook configurado no se ofrece el botón._ Se avisa que la publicación automática no está lista. Un botón que no puede funcionar es peor que no tener botón.

_La publicación se anota **después** de que el disparo salió bien._ Si se anotara antes, un webhook caído dejaría la ventana de agrupado bloqueando los reintentos durante un minuto — justo cuando hay que reintentar.

_Se distingue "la pedí" de "ya había una en camino"._ El panel no dice que disparó algo cuando en realidad se sumó a una publicación anterior.

**Verificado**

_En pruebas (12 casos nuevos)_
✅ **Cinco pedidos seguidos producen un solo build** — el criterio del journey
✅ Pasada la ventana de 60 segundos, un pedido nuevo sí dispara
✅ Sin webhook: no dispara, no anota, y no dice que publicó
✅ Webhook que falla o que revienta: se avisa y **no queda anotado**, así el reintento funciona enseguida
✅ Publicar no se cuenta a sí mismo como cambio pendiente

_En el navegador_
✅ Sin webhook, la barra dice "Publicación automática sin configurar" y **esconde el botón**
✅ Con webhook: primer disparo `yaEstaba: false`, los tres siguientes `yaEstaba: true` — un solo disparo recibido
✅ Con una publicación reciente, la barra dice "Publicando…" y esconde el botón
✅ `GET` y `POST` devuelven 401 sin sesión

**Pendiente de configuración**: falta crear el webhook en Netlify y cargar `NETLIFY_BUILD_HOOK_URL`. Hasta entonces el panel lo dice en vez de fallar.

`astro check`: 0 errores · ESLint: 0 · Prettier: limpio · **92 pruebas en verde**
