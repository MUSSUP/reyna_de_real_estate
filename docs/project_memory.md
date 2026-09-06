# Memoria del Proyecto — Reyna de Real Estate

Actualizado: 2026-08-23

---

## Estado

**En ejecución. 15 de 28 terminadas, 2 parciales, 12 sin empezar. 🎯 El sitio público está entero; falta el panel.**

> El conteo venía diciendo 17/28 y estaba inflado desde antes: nunca cerró la cuenta. Corregido contando los estados uno por uno.

✅ IT-01 · Esqueleto del proyecto
✅ IT-02 · Base de datos y migraciones
✅ IT-03 · Imágenes y almacenamiento
✅ IT-04 · Autenticación del panel
✅ IT-05 · Sistema de diseño
🟡 IT-06 · Envío de correo — implementado y verificado; falta probar un envío real (necesita cuenta de Resend)
✅ IT-07 · Datos de demostración — cargados en Supabase real
🟡 IT-08 · Entorno Docker y despliegue — configuración lista y verificada; falta probar `docker compose up` (Docker no está instalado)

**Hito 1 — el visitante encuentra y consulta una propiedad**
✅ UJ-01 · Home: hero, barra, pie, WhatsApp y 404
✅ UJ-02 · Carrusel de destacadas
✅ UJ-03 · Buscador y catálogo `/propiedades`
✅ UJ-04 · Ficha de propiedad con galería
✅ UJ-05 · Contacto por WhatsApp
✅ UJ-06 · Formulario de consulta
✅ **Revisión del Hito 1**: 0 críticos, 8 importantes, 13 menores. Se cerraron 4
✅ UJ-15 · Noticias — **adelantada del Hito 3**: el menú la enlazaba y la página no existía
▶️ **Próximo: el Hito 2 (panel), empezando por UJ-08**

---

## Qué es

Sitio de captación para **Laura Cabral** (marca: **Reyna de Real Estate**), broker de propiedades de lujo en Riviera Maya. Cliente de Musapp; el acuerdo tiene alrededor de un año y sufrió interrupciones.

Dominio `reynaderealestate.com`, ya administrado por la clienta.
Reemplaza una versión a medio construir en Bubble cuyo diseño está aprobado.

---

## Lo más importante para retomar

**El alcance está definido por el "Documento de Cierre de Alcance V1"** (Drive, 29/06/2026) **más las correcciones de julio.** Ver decisiones D-06 y D-11.

Ese documento apareció durante la planificación y **contradecía el plan en nueve puntos**. Se reescribió todo (v1 → v2), y luego se amplió al evaluar el costo real de cada pedido (v2 → v3).

**Lo único fuera de alcance es el sitio bilingüe** (D-11): el costo no está en el código sino en obligar a la clienta a cargar todo dos veces, para siempre.

**El sitio sale en español.** Incluye galería de fotos y noticias e informes administrables.

---

## Próximo paso

Continuar el **Hito 1** según el tracker. El recorrido del visitante ya funciona de punta a punta: entrar → buscar → filtrar → ver la ficha → consultar por WhatsApp.

**El Hito 1 está completo.** El recorrido del visitante funciona de punta a punta: entrar → buscar → filtrar → ver la ficha → consultar por WhatsApp o por formulario.

**El formulario funciona sin JavaScript** (D-16): es un formulario de verdad y el servidor responde 303 a `/gracias`. Cualquier formulario nuevo del sitio público debe seguir ese patrón.

**Hay pruebas**: `npm test` corre 35 casos con vitest sobre un Postgres real (PGlite) con las migraciones aplicadas. La lógica de la consulta vive en `backend/lib/consultas.ts` y recibe base y correo por parámetro (D-17) — ese es el criterio para los próximos endpoints.

> **Los avisos por mail todavía no salen**: falta `RESEND_API_KEY`. Ninguna consulta se pierde — quedan en la base con `notified_at` nulo, y así se ven en la bandeja del panel.

**El logo es el real de la clienta** (D-15, 2026-08-22). Los originales viven en `design/marca/` — son irreemplazables y no se editan a mano. Todo lo de `frontend/public/logos/` es derivado: se regenera con `node design/marca/generar-assets.mjs`. Se usa **solo la corona rosa** y la paleta quedó intacta; las variantes turquesa están archivadas sin usar.

**El cuerpo de noticias e informes se pinta en un solo lugar**: `CuerpoArticulo.astro`, con el separador de `lib/articulos.ts`. Reconoce `##`, `###`, `>` y párrafos, y nada más — el texto **nunca** se inserta como HTML. Cualquier página nueva con texto editable debe usar ese componente.

**Los enlaces de WhatsApp se arman en un solo lugar**: `frontend/src/lib/whatsapp.ts`. Ninguna página debe volver a construir un `wa.me` a mano. Los textos viven en `site_settings` (`whatsapp.message` y `whatsapp.message_property`, con marcador `{propiedad}`), no en el código.

**El sitio ya se puede ver**: `npm run dev` → `http://localhost:4321`

**La base ya tiene datos de demostración** (`npm run seed -- --limpiar` los recarga). A partir de acá, cada journey se puede ver con contenido real.

**Pendiente de credenciales**: `RESEND_API_KEY` para probar un envío real, y verificar el dominio en Resend con DNS en Don Web para poder enviar desde `web@reynaderealestate.com`.

El muestrario de componentes vive en `/sistema` (sin indexar). Sirve de referencia visual al construir cada journey.

**Infraestructura real ✅ conectada** (2026-08-21): Supabase creado con el mail de la marca. Migraciones aplicadas sobre Postgres 17.6 y subida de imágenes verificada contra el bucket real. Las credenciales viven en `.env`, que no se versiona.

> Si alguna vez se cambia la contraseña de la base: evitar `? @ : / #`, o codificarlos dentro de la cadena. Un `?` sin codificar la parte en dos.

---

## Lo que quedó abierto de la revisión

Ninguno bloquea el Hito 2, pero conviene cerrarlos antes de entregar. El informe completo está en `docs/work_log.md`.

| # | Qué | Por qué importa |
| ----- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| I-4 | La ficha ignora `coverPath`: propiedad con portada y sin galería queda con la columna izquierda vacía | La card sí tiene respaldo; la ficha no |
| I-5 | Las miniaturas bajan la variante de 1600 px para pintarla a 112 | Invisible con la semilla; con fotos reales son más de 1 MB extra por ficha |
| I-7 | No hay pruebas de autenticación ni una que proteja RNF-10 | El NFR nombra la autenticación como camino crítico |
| menor | **No hay menú móvil**: desde una ficha en el celular no se llega al catálogo | Se ve en la primera visita desde un teléfono |
| menor | Falta `robots.txt` y `sitemap.xml`, y no son tarea de nadie en el plan | Sin dueño, no se hacen |

---

## Decisiones que condicionan todo

1. **El sitio público es estático** (D-04): las visitas no tocan la base. Publicar dispara un rebuild.
2. **Netlify gratuito, no el VPS de Musapp** (D-02): para que Musapp no quede como infraestructura permanente de su clienta.
3. **Cuentas a nombre de la marca** (D-03): `reynaderealestate@gmail.com`, no cuentas de Musapp.
4. **Imagen principal + galería + enlace a Drive** para el video (D-07, ampliado por D-11).
5. **Los leads se avisan por mail** (D-08), como preveía el acuerdo.
6. **`owners` nunca se expone** (D-09).
7. **Los scripts van como archivo propio, nunca incrustados en la página**: la política de seguridad prohíbe los scripts inline (UJ-02).
8. **Ningún efecto decorativo puede esconder contenido** (D-14). Si la animación falla, se ve el contenido sin animar, nunca al revés.
9. **El panel tiene un solo middleware de sesión** (D-13). Todo endpoint nuevo del panel debe usar `requerirSesion`.
10. **Astro 7, no Astro 5** (D-12): la rama 5 tenía XSS en el framework. `sharp` fijado a ≥0.35.3 por `overrides` — no bajarlo.

---

## Bloqueos y pendientes

| # | Pendiente | Impacto |
| -------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ~~A-01~~ | ✅ Resuelto: dominio en **Don Web, cuenta de Musapp**. Acceso total al DNS | — |
| A-08 | **Transferir el dominio a la clienta** después de entregar. Hoy está a nombre de Musapp | Pendiente, no bloquea |
| ~~A-02~~ | ✅ Resuelto: Supabase creado con `reynaderealestate@gmail.com`, base y bucket funcionando | — |
| A-03 | Falta el video del hero. La carpeta de Drive de la clienta está vacía | Bloquea UJ-01. Hay un `.mp4` en los assets locales que podría servir |
| ~~A-05~~ | ✅ Resuelto: las consultas van a `reynaderealestate@gmail.com` | — |
| A-09 | **Qué nombre manda**: el logo dice "Laura Cabral", el pie dice "Reyna de Real Estate" | No bloquea, pero se ve en toda página |
| A-07 | **Enviar el aviso de alcance final a la clienta** antes de construir. Borrador en `docs/aviso_alcance_clienta.md` | Deja registro de qué incluye la entrega |

---

## Archivos clave

- `design/design_summary.md` — leer al iniciar cada tarea
- `implementation/task_tracker.md` — 28 tareas, 3 hitos
- `docs/decision_log.md` — 11 decisiones; D-06 y D-11 definen el alcance
- `planning/questions.md` — B5 explica el conflicto de alcance
- `design/referencias/` — 6 capturas de la versión aprobada + PDF de correcciones

---

## Contexto humano

El acuerdo es de largo plazo. La prioridad es **llegar a algo presentable pronto**: el Hito 1 está diseñado para eso — al terminarlo hay un sitio real para mostrar, aunque el panel todavía no exista.
