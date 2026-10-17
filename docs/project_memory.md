# Memoria del Proyecto — Reyna de Real Estate

Actualizado: 2026-10-17 (segunda vuelta)

---

## Estado

**En ejecución. 23 de 28 terminadas, 2 parciales, 4 sin empezar.**
**🎯 El sitio público está entero y en vivo. El Hito 2 (panel) está cerrado y revisado.**

**En vivo**: <https://reyna-de-real-estate.netlify.app> · Panel: `/admin`

**Infraestructura**

✅ IT-01 a IT-05, IT-07 — esqueleto, base, imágenes, autenticación, diseño, datos de demostración
🟡 IT-06 · Envío de correo — implementado y verificado; **falta la cuenta de Resend**, así que los avisos no salen
🟡 IT-08 · Docker y despliegue — desplegado y funcionando en Netlify; falta probar `docker compose up` (Docker no está instalado en el equipo)

**Hito 1 — el visitante (completo)**
✅ UJ-01 a UJ-06 · home, carrusel, buscador, ficha, WhatsApp, formulario
✅ UJ-14, UJ-15, UJ-16 · informe Insights, noticias, Conóceme
✅ Revisión del Hito 1: 0 críticos, 8 importantes, 13 menores

**Hito 2 — el panel**
✅ UJ-07 · Entrar al panel
✅ UJ-08 · Publicar una propiedad — formulario, portada y galería (faltan los catálogos, UJ-08b)
✅ UJ-09 · Elegir y ordenar destacadas
✅ UJ-11 · Revisar las consultas
✅ UJ-12 · Editar los textos del sitio
✅ UJ-13 · Publicar cambios (webhook de rebuild)
✅ UJ-10 · Publicar noticias e informes — con vista previa
✅ UJ-08b · Catálogos — las cinco listas
✅ **Revisión del Hito 2**: 1 crítico, 9 importantes, 13 menores. Todos los importantes cerrados

**Hito 3 — calidad y entrega**
⬜ IT-09 · Auditoría de rendimiento y accesibilidad ← **próximo**
⬜ IT-10 · Auditoría de seguridad final (obligatoria — verificar que `owners` no se filtre)
⬜ IT-11 · Verificación con y sin datos (obligatoria)
⬜ IT-12 · Despliegue y entrega, DNS en Don Web

---

## ⚠️ Lo primero al retomar

**1. La migración 0005 no está aplicada en la base.** El esquema tiene `updated_at` en las cinco tablas de catálogo y la base todavía no. `astro build` falla con `column "updated_at" does not exist`, así que **el trabajo del 17/10 está comprometido pero sin empujar**. Se arregla con `npm run db:migrate`. Es aditiva y no toca ningún dato.

**2. No se puede entrar al panel: la contraseña de la administradora se perdió.**
Las cuatro pantallas construidas el 17/10 —destacadas, configuración, artículos y catálogos— **nunca se vieron funcionando en un navegador**. Están construidas y probadas, con los portones de sesión verificados con peticiones reales, pero nadie las miró. Se arregla con `npm run db:crear-admin`, que es además la acción A-10 de la entrega.

> La revisión del Hito 2 lo marcó como hallazgo propio, y tenía razón: tres de los problemas que encontró se habrían visto en el primer minuto de uso real.

**Firmar una sesión a mano con el `JWT_SECRET` queda bloqueado por la política de credenciales, y está bien que quede bloqueado.** No insistir por ahí: la contraseña la pone la persona.

---

## Qué es

Sitio de captación para **Laura Cabral** (marca: **Reyna de Real Estate**), broker de propiedades de lujo en Riviera Maya. Clienta y amiga de Musapp; el acuerdo tiene alrededor de un año y sufrió interrupciones.

Dominio `reynaderealestate.com` en Don Web, hoy a nombre de Musapp.
Reemplaza una versión a medio construir en Bubble cuyo diseño está aprobado.

**El alcance está cerrado** por el "Documento de Cierre de Alcance V1" (Drive, 29/06/2026) más las correcciones de julio (D-06, D-11). Apareció durante la planificación y contradecía el plan en nueve puntos; se reescribió todo. **Lo único fuera de alcance es el sitio bilingüe**: el costo no está en el código sino en obligar a la clienta a cargar todo dos veces, para siempre.

**La intención de Musapp es terminar y desligarse.** No sumar nada que no esté en el alcance.

---

## Patrones que hay que respetar

- **El sitio público es estático** (D-04). Las visitas no tocan la base. Publicar dispara un rebuild. Única excepción: `POST /api/leads`.
- **Los formularios públicos funcionan sin JavaScript** (D-16). En el panel rige **donde la técnica de interacción falla sin él**: destacadas y configuración son formularios de verdad, porque arrastrar no dispara nada en pantallas táctiles y la clienta entra desde el celular. Artículos y catálogos **necesitan JavaScript y lo dicen con un `<noscript>`**. No es lo mismo que "todo el panel anda sin JavaScript": eso lo afirmaba esta memoria y era más de lo que el código hacía.
- **La lógica va en `backend/lib/`, con base y servicios por parámetro** (D-17). `npm test` corre vitest sobre PGlite con las migraciones reales: **300 casos**, incluidas las de autenticación, privacidad de `owners`, D-19 y una que exige que ningún mensaje de error salga en inglés.
- **Un solo middleware de sesión** (D-13). Todo endpoint del panel usa `requerirSesion`: verificado archivo por archivo en la revisión del Hito 2, los 17.
- **Lo que necesita el navegador no comparte archivo con lo que solo corre en el servidor** (D-19). Dos archivos sin dependencias existen por eso: `anchosImagen.ts` y `urlSegura.ts`, y el procesamiento de imágenes vive separado (`imagenesPropiedad.ts`, `imagenesArticulo.ts`). Importar aritmética desde el módulo de imágenes arrastraba `sharp` a todas las páginas y rompió un despliegue. **Hay una prueba que sigue la cadena de importaciones de cada página y falla si alguna llega a `sharp`.**
- **Una dirección que escribe alguien y termina en un `href` es código**, y lo mismo vale para un título que termina dentro de un `<script type="application/ld+json">`: `JSON.stringify` no escapa `</script>`. Se usa `jsonLdSeguro`.
- **El anti-CSRF viene de `checkOrigin: true` de Astro, que solo se instala si el proyecto tiene un middleware.** Borrar `frontend/src/middleware.ts` lo apagaría en silencio.
- **Hay que leer los criterios de aceptación de `implementation/user_journeys.md` antes de declarar una journey terminada**, no después. En UJ-10 declaré cuatro criterios cumplidos sin haberlos leído, y la revisión los encontró.
- **Ningún efecto decorativo esconde contenido** (D-14). Si la animación falla se ve el contenido sin animar, nunca al revés.
- **Solo se escriben las filas que de verdad cambian.** Tocar `updated_at` al guardar sin cambios haría que el panel diga "tenés cambios sin publicar" por haber abierto la pantalla.
- **Una dirección que escribe alguien y termina en un `href` es código.** Se valida en positivo (solo `http`/`https`) al guardar **y** al dibujar (`valorUrl`). Escapar no protege de `javascript:`.
- **Los enlaces de WhatsApp se arman en un solo lugar**: `frontend/src/lib/whatsapp.ts`.
- **El texto editable nunca se inserta como HTML**: `CuerpoArticulo.astro` con el separador de `lib/articulos.ts`.
- **El logo es el real de la clienta** (D-15). Los originales en `design/marca/` no se editan; lo de `frontend/public/logos/` se regenera con `node design/marca/generar-assets.mjs`. **Solo la corona rosa**; la paleta quedó intacta.
- **Astro 7, no Astro 5** (D-12): la rama 5 tenía XSS en el framework. `sharp` fijado a ≥0.35.3 por `overrides` — no bajarlo.
- **El repositorio es público** (D-20). Las comunicaciones sobre la clienta viven fuera.

---

## Lo que quedó abierto de la revisión del Hito 1

| #     | Qué                                                                                     | Estado                          |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------- |
| I-4   | La ficha ignora `coverPath`: con portada y sin galería queda la columna izquierda vacía | Abierto                         |
| I-5   | Las miniaturas bajaban la variante de 1600 px para pintarla a 112                       | ✅ Cerrado en UJ-09             |
| I-7   | No hay pruebas de autenticación ni una que proteja RNF-10                               | Abierto — lo pide el NFR        |
| menor | **No hay menú móvil**: desde una ficha en el celular no se llega al catálogo            | Abierto — se ve en la 1ª visita |

---

## Infraestructura

**Supabase** (`reynaderealestate@gmail.com`): Postgres 17.6, bucket de imágenes. Las credenciales viven en `.env`, que no se versiona.

> **El plan gratuito pausa el proyecto tras unos días sin actividad, y pasó dos veces.** Cuando pasa, el sitio público sigue en pie —es estático— pero **las fotos desaparecen**, porque se sirven desde el almacenamiento en el momento de mirar la página. Se resolvió con `netlify/functions/mantener-despierta.mjs`, que consulta la base cada tres días. **Si el sitio vuelve a aparecer sin fotos, lo primero que hay que mirar es si esa función se sigue ejecutando.**

> Si alguna vez se cambia la contraseña de la base: evitar `? @ : / #`, o codificarlos dentro de la cadena. Un `?` sin codificar la parte en dos.

**Netlify**: repositorio `MUSSUP/reyna_de_real_estate`, **público** — el plan gratuito no construye repositorios privados, y eso tuvo el despliegue trabado un mes. Variables de entorno cargadas en el panel de Netlify (nivel 2).

**El muestrario de componentes** vive en `/sistema`, sin indexar.

---

## Acciones que bloquean la entrega y no son código

| #    | Acción                                                                                                                                   | Quién            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| A-10 | **Que Laura ponga su propia contraseña del panel** (`npm run db:crear-admin`). Hoy nadie la tiene                                        | Musapp + clienta |
| A-11 | **Quitar el bloqueo de indexación**: borrar `frontend/public/robots.txt` **y** la cabecera `X-Robots-Tag` de `netlify.toml`. Son las dos | Musapp           |
| A-07 | **Confirmar el alcance final por escrito.** El borrador vive fuera del repositorio                                                       | Musapp           |
| A-09 | **Definir el nombre de marca**: el logo dice "Laura Cabral" y el pie dice "Reyna de Real Estate". Conviven en la misma página            | Clienta          |
| A-08 | **Transferir el dominio y el repositorio** a la clienta después de entregar                                                              | Musapp           |
| A-03 | **Video del hero** y **retrato de Laura**. Ambos se cargan desde el panel, sin código (D-10). La sección se ve bien sin foto             | Clienta          |
| A-04 | Fotos reales de las propiedades                                                                                                          | Clienta          |

**Decisiones abiertas**: la cuenta de Resend (sin ella no salen los avisos de consultas, y tampoco se puede hacer recuperación de contraseña, que necesita mandar un mail).

---

## Archivos clave

- `design/design_summary.md` — leer al iniciar cada tarea
- `implementation/task_tracker.md` — 28 tareas, 3 hitos, bitácora
- `docs/work_log.md` — el relato de cada journey y por qué se decidió lo que se decidió
- `docs/decision_log.md` — las decisiones de arquitectura
- `design/referencias/` — 6 capturas de la versión aprobada + PDF de correcciones
