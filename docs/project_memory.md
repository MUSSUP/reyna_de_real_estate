# Memoria del Proyecto — Reyna de Real Estate

Actualizado: 2026-11-07

---

## Estado

**En ejecución. 24 terminadas, 4 parciales, 1 sin empezar** (29 filas en el seguimiento: las 28 del plan más UJ-08b).
**🎯 El sitio público está entero. El panel está cerrado y revisado. Falta la entrega (IT-12).**

**En vivo**: <https://reynaderealestate.com> · Panel: `/admin`
El dominio quedó apuntado el **10/11**: certificado de Let's Encrypt emitido, `www` y `http` redirigen
al dominio raíz con HTTPS. La dirección vieja de Netlify sigue respondiendo.
✅ **Al día.** El 10/11 se empujaron los nueve commits que esperaban desde el 18/10 y Netlify construyó.
Verificado en vivo: las fotos volvieron, las tres páginas de consulta no enviada, la página de error,
el aviso de contraseña en el ingreso y los destinos táctiles del pie. **El portón dejó pasar su propio
despliegue**, que era la trampa que había aparecido tres veces.

**Infraestructura**

✅ IT-01 a IT-05, IT-07 — esqueleto, base, imágenes, autenticación, diseño, datos de demostración
✅ IT-10 · Auditoría de seguridad final — **hecha** (commit `d514e42`). No rehacerla
✅ IT-11 · Verificación con y sin datos — hecha, las dos mitades. **No cubrió el panel**; eso lo revisó la revisión final
🟡 IT-06 · Envío de correo — implementado y verificado; **falta la cuenta de Resend**, así que los avisos no salen
🟡 IT-08 · Docker y despliegue — desplegado y funcionando en Netlify; falta probar `docker compose up` (Docker no está instalado en el equipo)
🟡 IT-09 · Rendimiento y accesibilidad — menú móvil, título invisible y destinos táctiles resueltos. **Falta medir el peso de la portada con las fotos reales de Laura**
⬜ IT-12 · Despliegue y entrega, DNS en Don Web, guía de uso ← **lo único sin empezar**

**Hito 1 — el visitante (completo)**
✅ UJ-01 a UJ-06 · home, carrusel, buscador, ficha, WhatsApp, formulario
✅ UJ-14, UJ-15, UJ-16 · informe Insights, noticias, Conóceme
✅ Revisión del Hito 1: 0 críticos, 8 importantes, 13 menores — **todos cerrados**

**Hito 2 — el panel (cerrado)**
✅ UJ-07 a UJ-13 + UJ-08b · entrar, publicar propiedad, destacadas, noticias e informes, consultas, textos, publicar cambios, catálogos
✅ Revisión del Hito 2: 1 crítico, 9 importantes, 13 menores. Todos los importantes cerrados

**Revisión final** (la obligatoria antes de entregar): hecha. 3 críticos, 8 importantes, 6 menores.
Cerrados los dos críticos de código (C-2, C-3), los importantes I-1 a I-8 y los menores m-1 a m-6.
**C-1 cerrado el 10/11.** Queda abierto sólo **I-9**: los avisos por correo, que necesitan la cuenta de Resend.

---

## ⚠️ Lo primero al retomar

**No queda nada de código sin verificar.** El 10/11 se cerró C-1: se apretó "Publicar cambios" en el
panel y el sitio cambió. **El portón de despliegues está probado por los tres caminos** — push con la
marca, webhook del panel, y cancelar un commit que no la lleva.

**IT-12 avanzó el 10/11**: la **guía de uso vive en el panel** (`/admin/ayuda`) y hay un documento de
entrega para quien herede el código (`docs/entrega.md`). El `sitemap.xml` quedó hecho, con la
indexación todavía bloqueada a propósito.

**Lo que falta no es código**: apuntar el dominio, la cuenta de Resend, el nombre de marca, las fotos
de Laura, y la transferencia.

> 🔴 **PENDIENTE AHORA: borrar `PUBLIC_SITE_URL` de Netlify.** El dominio ya funciona, pero **la
> canónica que sirve hoy dice `https://reyna-de-real-estate.netlify.app/`** — verificado en vivo el
> 10/11. O sea que cada página del dominio nuevo le está diciendo a Google que la versión de verdad
> está en la dirección vieja. Se arregla borrando la variable y volviendo a desplegar.
>
> ⚠️ **El detalle completo, para la próxima vez.** Hoy vale
> `https://reyna-de-real-estate.netlify.app` y de ahí salen **todas las canónicas, los `og:url` y el
> mapa del sitio** — verificado en vivo. Sin tocarla, cada página del dominio nuevo le diría a Google
> que la versión de verdad está en la dirección vieja. **Borrarla alcanza**: `astro.config.mjs` ya
> tiene el dominio como respaldo, así que no hay dirección que escribir mal. Está en `docs/entrega.md`.
>
> **Apuntar el dominio no obliga a abrir el sitio a Google** (A-11): eso además necesita contenido real
> y el nombre de marca decidido (A-09).

**Y antes de cualquier push, dos cosas que ya costaron caro:**

1. **Mirar si Supabase está despierta.** Se pausa sola; pasó **tres veces**. Con la base caída la
   construcción falla y **gasta un despliegue en algo roto**. El chequeo barato es una consulta directa:
   si el subdominio del proyecto devuelve `000` está pausada, si devuelve `401` está arriba. **Ojo: al
   reactivarla el API vuelve antes que el pooler de Postgres**, así que puede dar `401` y la conexión
   seguir diciendo `tenant/user not found` unos minutos. Hay que esperar a que conecte de verdad.
2. **Verificar que el mensaje del commit de arriba lleve `[desplegar]`** (ver más abajo).

**El commit de más arriba tiene que llevar `[desplegar]` en el mensaje.** Netlify lee `netlify.toml` **del commit que construye**, así que el portón se aplica a sí mismo: si el mensaje de arriba no tiene la marca, se saltea su propio despliegue y nada avisa. Ya pasó dos veces — la segunda, por agregar un commit encima del que sí la tenía. **Verificar antes de empujar, no después.**

**Y queda una pregunta abierta que todavía puede obligar a un cambio antes de entregar**: mirar en Netlify → Functions el **registro de ejecuciones de `mantener-despierta`** el día después de un despliegue.

- Hay una ejecución exitosa → el problema era el 200 silencioso y está resuelto.
- **No hay ninguna ejecución** → Netlify no corre funciones programadas en el plan gratuito, y hay que cambiar de enfoque: sería un defecto que se lleva las fotos de Laura cada semana.

**La contraseña del panel**: hay una de desarrollo creada en local. **Laura todavía tiene que poner la suya** (`npm run db:crear-admin`, acción A-10). **No hay recuperación de contraseña** —necesita mandar un mail y eso espera la cuenta de Resend—, así que si la pierde depende de alguien con terminal. Es el callejón sin salida más importante de la entrega.

**Firmar una sesión a mano con el `JWT_SECRET` queda bloqueado por la política de credenciales, y está bien que quede bloqueado.** La contraseña la pone la persona.

---

## Qué es

Sitio de captación para **Laura Cabral** (marca: **Reyna de Real Estate**), broker de propiedades de lujo en Riviera Maya. Clienta y amiga de Musapp; el acuerdo tiene alrededor de un año y sufrió interrupciones.

Dominio `reynaderealestate.com` en Don Web, hoy a nombre de Musapp.
Reemplaza una versión a medio construir en Bubble cuyo diseño está aprobado.

**El alcance está cerrado** por el "Documento de Cierre de Alcance V1" (Drive, 29/06/2026) más las correcciones de julio (D-06, D-11). Apareció durante la planificación y contradecía el plan en nueve puntos; se reescribió todo. **Lo único fuera de alcance es el sitio bilingüe**: el costo no está en el código sino en obligar a la clienta a cargar todo dos veces, para siempre.

**La intención de Musapp es terminar y desligarse. El alcance está cerrado del lado de Musapp.** No sumar nada.

**Dos cosas que se pidieron y se decidió no hacer**, para no reabrirlo:

- **La integración con EstateWave** (la plataforma donde Laura va a gestionar). Es un proyecto nuevo con su propio presupuesto: cliente de API con firma, webhook verificado, mapeo de los dos modelos, y una estrategia de acumulación porque cada cambio empujado necesita reconstruir y hay 20 reconstrucciones por mes. Se le avisó al programador (Álvaro) con los tres hallazgos de seguridad de su especificación. **No se ofreció soporte posterior.**
- **Permisos por rol** para una empleada. Hoy se pueden crear varios usuarios (`npm run db:crear-admin`) pero **no se puede restringir qué ve cada uno**: `admin_users` tiene sólo correo, nombre y contraseña. Quien entra, ve también los **propietarios** (datos de terceros) y las **consultas**. Está explícitamente fuera del alcance acordado y tocaría los 17 endpoints.

---

## El presupuesto de Netlify, que condiciona el diseño

|                                                     |                                                      |
| --------------------------------------------------- | ---------------------------------------------------- |
| Plan gratuito                                       | **300 créditos por mes**                             |
| Cada despliegue                                     | **15 créditos → 20 despliegues por mes, ni uno más** |
| Todo lo demás (ancho de banda, cómputo, peticiones) | **0,3 créditos** — ruido estadístico                 |
| Ciclo                                               | del 5 de un mes al 4 del siguiente                   |

**El costo depende de cuántas veces se aprieta el botón, no de cuánto hay adentro.** Las fotos no pasan por Netlify: se sirven desde Supabase. Así que cargar el catálogo entero y publicar una vez = **1 de las 20 publicaciones del mes**.

Dos mecanismos existen por esto:

- **El portón de despliegues** (`netlify.toml`). Un despliegue sólo arranca si viene del botón "Publicar cambios" del panel o si el mensaje del commit dice `[desplegar]`. Netlify lo lee al revés de lo intuitivo: **salir con 0 cancela**. Está probado en cinco situaciones y **falla del lado de desplegar**, porque el modo de fallo peligroso es que Laura no pueda publicar y nada se lo avise. **Efecto lateral a documentar: un despliegue lanzado a mano desde el panel de Netlify se cancela en silencio.**
- **El cupo visible en el panel**, al lado del botón: "Te quedan 13 publicaciones este mes". No impide nada. Cuenta contra el ciclo de facturación, no contra el mes calendario. Los dos números viven en `backend/lib/publicacion.ts` con una prueba que los fija.

**Hay que decirle a Laura que agrupe cambios y publique de a tandas**, con el motivo real. Con 20 por mes, publicar todos los días la deja afuera.

---

## Patrones que hay que respetar

- **El sitio público es estático** (D-04). Las visitas no tocan la base y publicar dispara un rebuild. **Ninguna página pública se genera en el servidor**: lo único que no se hornea es `POST /api/leads` —el único que toca la base en una visita— y `500.astro`, que es la página de error y está verificada libre de base. Hay que mantenerlo así: una página pública con `prerender = false` deja de verse cuando Supabase se pausa.
- **Los formularios públicos funcionan sin JavaScript** (D-16). En el panel rige **donde la técnica de interacción falla sin él**: destacadas y configuración son formularios de verdad, porque arrastrar no dispara nada en pantallas táctiles y la clienta entra desde el celular. Artículos y catálogos **necesitan JavaScript y lo dicen con un `<noscript>`**. No es lo mismo que "todo el panel anda sin JavaScript": eso lo afirmaba esta memoria y era más de lo que el código hacía.
- **La lógica va en `backend/lib/`, con base y servicios por parámetro** (D-17). `npm test` corre vitest sobre PGlite con las migraciones reales: **323 casos** en 13 archivos, incluidas las de autenticación, privacidad de `owners`, D-19 y una que exige que ningún mensaje de error salga en inglés.
- **La suite va con `maxWorkers: 2`** y no hay que subirlo. Cada archivo levanta **un Postgres entero en memoria**; sin tope tarda 474 s, tira dos pruebas falsas y la corrida siguiente muere sin memoria. Con el tope: 204 s y pasa entera. **Una prueba que falla por contención enseña a desconfiar de las rojas, que es lo contrario de para lo que están.**
- **Un solo middleware de sesión** (D-13). Todo endpoint del panel usa `requerirSesion`: verificado archivo por archivo, los 17.
- **Lo que necesita el navegador no comparte archivo con lo que solo corre en el servidor** (D-19). Dos archivos sin dependencias existen por eso: `anchosImagen.ts` y `urlSegura.ts`, y el procesamiento de imágenes vive separado (`imagenesPropiedad.ts`, `imagenesArticulo.ts`). Importar aritmética desde el módulo de imágenes arrastraba `sharp` a todas las páginas y rompió un despliegue. **Hay una prueba que sigue la cadena de importaciones de cada página y falla si alguna llega a `sharp`.**
- **Una dirección que escribe alguien y termina en un `href` es código**, y lo mismo vale para un título que termina dentro de un `<script type="application/ld+json">`: `JSON.stringify` no escapa `</script>`. Se usa `jsonLdSeguro`. Las direcciones se validan en positivo (sólo `http`/`https`) al guardar **y** al dibujar (`valorUrl`): escapar no protege de `javascript:`.
- **El anti-CSRF viene de `checkOrigin: true` de Astro, que solo se instala si el proyecto tiene un middleware.** Borrar `frontend/src/middleware.ts` lo apagaría en silencio.
- **El CSP sólo deja imágenes propias y de Supabase** (`img-src 'self' data: https://*.supabase.co`) y video sólo propio (`media-src` cae en `default-src 'self'`). Por eso los campos de video y de retrato del panel avisan que un enlace de Drive o Instagram no se va a ver: **el único síntoma sería un hueco**, imposible de diagnosticar desde el panel. El día que el almacenamiento se mude, conviene derivar el origen de `STORAGE_PUBLIC_URL` en vez de escribirlo en `netlify.toml`.
- **Hay que leer los criterios de aceptación de `implementation/user_journeys.md` antes de declarar una journey terminada**, no después. En UJ-10 declaré cuatro criterios cumplidos sin haberlos leído, y la revisión los encontró.
- **Ningún efecto decorativo esconde contenido** (D-14). Si la animación falla se ve el contenido sin animar, nunca al revés.
- **Solo se escriben las filas que de verdad cambian.** Tocar `updated_at` al guardar sin cambios haría que el panel diga "tenés cambios sin publicar" por haber abierto la pantalla.
- **Los enlaces de WhatsApp se arman en un solo lugar**: `frontend/src/lib/whatsapp.ts`.
- **El texto editable nunca se inserta como HTML**: `CuerpoArticulo.astro` con el separador de `lib/articulos.ts`.
- **El logo es el real de la clienta** (D-15). Los originales en `design/marca/` no se editan; lo de `frontend/public/logos/` se regenera con `node design/marca/generar-assets.mjs`. **Solo la corona rosa**; la paleta quedó intacta.
- **Astro 7, no Astro 5** (D-12): la rama 5 tenía XSS en el framework. `sharp` fijado a ≥0.35.3 por `overrides` — no bajarlo.
- **No correr `npm audit fix`.** Rompió el árbol de dependencias (`@netlify/blobs` desapareció y la construcción falló) y hubo que restaurar `package-lock.json` de una copia. **Tampoco `--omit=dev`**: poda eslint y vitest.
- **El repositorio es público** (D-20). Las comunicaciones sobre la clienta viven fuera.
- **Se puede construir el sitio entero sin Supabase**, y conviene cuando la base está pausada. Se parcha `backend/db/client.ts` para que use **PGlite** —el mismo Postgres en WebAssembly de las pruebas, pero apuntando a una carpeta en disco—, se corren las migraciones y una siembra mínima, se construye, se mira el `dist/`, y **se revierte el parche**. La semilla real no sirve para esto: sube imágenes a Supabase Storage y falla con la base caída. Así se verificaron el paginado, los enlaces, las tres páginas de consulta no enviada y la página de error.
- **La página de error se verifica invocando la función del sitio construido**, no con `astro dev`: en desarrollo Astro no usa la página 500 propia. Se importa `createHandler` de `.netlify/build/entry.mjs`, se pide `/500` **sin ninguna variable de base en el entorno**, y se mira que responda 500 en castellano. Pedir `/admin` no sirve: el portón de sesión redirige antes de tocar la base.
- **Medir antes de afirmar, sin excepción.** Cuatro veces en este proyecto un diagnóstico "evidente" no sobrevivió a la primera medición: el SSL de la función, el contador de errores con `grep -c error`, el tamaño del presupuesto de Netlify, y un comentario que afirmaba que el código fallaba del lado seguro cuando no.

---

## Infraestructura

**Supabase** (`reynaderealestate@gmail.com`): Postgres 17.6, bucket de imágenes. Las credenciales viven en `.env`, que no se versiona.

> **El plan gratuito pausa el proyecto tras unos días sin actividad, y pasó tres veces.** Se intenta evitar con `netlify/functions/mantener-despierta.mjs`, que consulta la base **todos los días** (antes cada tres: el margen eran dos intentos y fallaron los dos). **Devuelve 500 cuando falla**, que es el arreglo de fondo: los tres finales devolvían 200, así que Netlify no podía distinguir una ejecución buena de una rota y estuvo once días caída sin que nadie se enterara. **Fallar ruidosamente es la decisión correcta para un mecanismo de guardia: el que protege algo tiene que poder gritar.**
>
> **Lo que todavía no se verificó es que la función se ejecute de verdad.** Está registrada en Netlify, pero no se vio el registro de ejecuciones. Ver "Lo primero al retomar".

> Si alguna vez se cambia la contraseña de la base: evitar `? @ : / #`, o codificarlos dentro de la cadena. Un `?` sin codificar la parte en dos.

**Netlify**: repositorio `MUSSUP/reyna_de_real_estate`, **público** — el plan gratuito no construye repositorios privados, y eso tuvo el despliegue trabado un mes. Variables de entorno cargadas en el panel de Netlify (nivel 2).

**El muestrario de componentes** vive en `/sistema`, sin indexar.

---

## Acciones que bloquean la entrega y no son código

| #    | Acción                                                                                                                                                                                                             | Quién            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| A-10 | **Que Laura ponga su propia contraseña del panel** (`npm run db:crear-admin`). Hoy sólo hay una de desarrollo                                                                                                      | Musapp + clienta |
| A-11 | **Quitar el bloqueo de indexación**: borrar `frontend/public/robots.txt` **y** la cabecera `X-Robots-Tag` de `netlify.toml`. Son las dos. Junto con el `sitemap.xml`                                               | Musapp           |
| A-07 | **Confirmar el alcance final por escrito.** El borrador vive fuera del repositorio                                                                                                                                 | Musapp           |
| A-09 | **Definir el nombre de marca**: el logo dice "Laura Cabral" y el pie dice "Reyna de Real Estate". Conviven en la misma página. Bloquea abrir el sitio a Google                                                     | Clienta          |
| A-08 | **Transferir el dominio y el repositorio** a la clienta después de entregar. Activar segundo factor en Supabase, Netlify y el correo de la marca **antes**                                                         | Musapp           |
| A-03 | **Video del hero** y **retrato de Laura**. El retrato se pega como dirección desde el panel; **el video no se sube desde el panel**: el archivo tiene que estar en el sitio, así que lo pone alguien con el código | Clienta + Musapp |
| A-04 | Fotos reales de las propiedades — hacen falta además para cerrar IT-09                                                                                                                                             | Clienta          |

**Decisiones abiertas**: la cuenta de Resend. Sin ella no salen los avisos de consultas **y no hay recuperación de contraseña**, que es lo único que evita que Laura dependa de Musapp si pierde la clave.

---

## Archivos clave

- `design/design_summary.md` — leer al iniciar cada tarea
- `implementation/task_tracker.md` — 29 filas, 3 hitos, bitácora
- `docs/entrega.md` — **el camino de entrada para quien hereda el repositorio**: las tres cosas que
  sorprenden, lo que no está hecho, y las acciones de entrega
- `frontend/src/pages/admin/ayuda.astro` — **la guía de la clienta**. Si cambia cómo funciona algo,
  se actualiza ahí. No consulta la base a propósito: funciona con Supabase pausada
- `docs/work_log.md` — el relato de cada journey y por qué se decidió lo que se decidió
- `docs/decision_log.md` — las decisiones de arquitectura
- `design/referencias/` — 6 capturas de la versión aprobada + PDF de correcciones
