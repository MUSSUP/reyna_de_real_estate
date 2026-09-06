# Resumen de Diseño — Reyna de Real Estate

v3.0 · 2026-08-21 · **Leer al iniciar cada tarea. Los documentos completos, solo por secciones puntuales.**

## Qué es

Sitio de captación para Laura Cabral, broker de propiedades de lujo en Riviera Maya. **En español.** Reemplaza una versión en Bubble cuyo diseño está aprobado (`design/referencias/`).

## Stack

Astro 7 + React 19 (islas) + Tailwind 4 · Netlify Functions (Node 22) · Postgres con Drizzle · Storage S3-compatible · JWT + bcrypt propio · Zod · Sharp · Resend · Docker

## La regla que gobierna todo

**El sitio público es estático.** Se genera en el build; las visitas no tocan la base. Publicar dispara un webhook que regenera. Única excepción: `POST /api/leads`. Esto resuelve rendimiento, SEO, costo y la pausa por inactividad de la base gratuita.

## Entidades

`admin_users` · `zones` · `property_types` · `developers` · `owners` _(interna)_ · `amenities` + `property_amenities` · `properties` · `property_images` · `articles` · `leads` · `site_settings`

Cada propiedad tiene **imagen principal** (`cover_path`, la del carrusel y los metadatos), **galería** (hasta 15) y **enlace a Drive** (`drive_url`, para el video y material pesado).
El informe Reyna Insights es un `articles` con `type='informe'` e `is_pinned`.

## Mapa de módulos

```
frontend/src/pages     públicas + /admin
frontend/src/components  public/ · admin/
frontend/src/i18n      es.json + pickLocale()
backend/functions      leads · admin-auth · admin-properties · admin-cover · admin-images
                       admin-articles · admin-leads · admin-catalogs · admin-settings · admin-publish
backend/db             schema.ts · migrations/ · seed.ts
backend/lib            auth · validation · storage · mailer · rateLimit · errors
deployment             Dockerfile · docker-compose · netlify.toml
```

## Patrones

- Un solo middleware de autenticación para todas las funciones `admin-*`
- Esquemas Zod compartidos entre cliente y servidor; **el servidor siempre valida**
- Errores con código y mensaje legible; el detalle va al log, nunca al cliente
- **Los formularios públicos funcionan sin JavaScript** (D-16): `action` + `method`, y el servidor responde 303 a una página real cuando el envío no viene por `fetch`
- Lo que se pueda probar va en `backend/lib/`, con base y servicios **por parámetro** (D-17). `npm test` corre vitest sobre PGlite con las migraciones reales
- Login responde igual ante email inexistente y contraseña incorrecta
- Buscador: filtrado en el navegador sobre un índice JSON embebido
- Textos de interfaz en `i18n/es.json`, nunca incrustados en componentes
- Rutas de imagen relativas al bucket, jamás URLs absolutas

## Marca

Rosa `#FB5696` · Verde `#1E4F4C` · Dorado `#C9A96E` · Crema `#F2E9E4` · Texto `#3A3A3A`
Playfair Display (títulos) · Cinzel (subtítulos y claims) · Montserrat (cuerpo)
Corona rosa como isotipo recurrente. **Un solo CTA rosa por pantalla.**
Logo real de la clienta en `design/marca/` (originales, no editar); lo público se regenera con `node design/marca/generar-assets.mjs`. **Solo la corona rosa**: las variantes turquesa quedaron sin usar (D-15).
**Sin glassmorphism, sin modo oscuro**: el registro es lujo editorial.

## Credenciales

**Nivel 1** (`.env`): `DATABASE_URL` · `JWT_SECRET` · `STORAGE_ENDPOINT` · `STORAGE_BUCKET` · `STORAGE_ACCESS_KEY` · `STORAGE_SECRET_KEY` · `RESEND_API_KEY` · `PUBLIC_SITE_URL`
**Nivel 2** (panel de Netlify): las mismas + `NETLIFY_BUILD_HOOK_URL`
**Nivel 3** (admin, cifradas): vacío en esta entrega; mecanismo preparado para la Fase 2

Todas las cuentas se crean con `reynaderealestate@gmail.com`, no con cuentas de Musapp.

## Assets pendientes

Video del hero y retrato de Laura los tiene pendientes la clienta. Ambos viven en `site_settings` y se reemplazan desde el panel, sin código (D-10). El hero arranca con stock libre; **la sección Nosotros se diseña para verse bien sin foto** — nunca un retrato genérico.

## Tres cosas que no se pueden olvidar

1. **`owners` nunca llega al sitio público** (RNF-10). Se verifica en la auditoría final.
2. **El alcance incluye galería y contenido editorial** (D-11). Lo único que sigue fuera es el **sitio bilingüe**.
3. **Si el mail de aviso falla, el lead ya está guardado.** Nunca se pierde una consulta.
