# Arquitectura — Reyna de Real Estate

Versión: 2.0 · 2026-08-20 · **Prioridad: MEDIA**

> v2.0 tras la decisión B5: sitio en español, sin CMS de noticias, imagen principal en lugar de galería.

---

## Vista general

```
┌─────────────────────────────────────────────────────────┐
│  VISITANTE                                              │
│  reynaderealestate.com                                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTML estático desde CDN
                     ▼
┌─────────────────────────────────────────────────────────┐
│  NETLIFY CDN — Sitio público (Astro, generado en build) │
│  · Home ES/EN · Catálogo · Fichas · Informe · Noticias  │
│  · Índice JSON del catálogo → buscador en el navegador  │
└────────────────────┬────────────────────────────────────┘
                     │ solo el formulario llama al servidor
                     ▼
┌─────────────────────────────────────────────────────────┐
│  NETLIFY FUNCTIONS (Node 22)                            │
│  · POST /api/leads          (público, con límite)       │
│  · /api/admin/*             (protegido con JWT)         │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           ▼                              ▼
┌────────────────────┐        ┌──────────────────────────┐
│ POSTGRES           │        │ STORAGE S3-COMPATIBLE    │
│ (Supabase gratuito)│        │ (Supabase Storage)       │
│ Drizzle + migrac.  │        │ Imágenes en WebP         │
└────────────────────┘        └──────────────────────────┘
           ▲
           │ publica cambios
┌──────────┴──────────────────────────────────────────────┐
│  PANEL ADMIN  reynaderealestate.com/admin               │
│  React, protegido. Al publicar dispara el rebuild.      │
└─────────────────────────────────────────────────────────┘
```

---

## El flujo que define el sistema

**Lectura (el visitante)**: no toca la base. Todo el contenido está en el HTML generado durante el build. Por eso el sitio es rápido, indexable, y sobrevive a que la base gratuita se pause (R-01).

**Escritura (la administradora)**: el panel lee y escribe en la base. Cuando termina de editar y presiona **Publicar**, se dispara un webhook que reconstruye el sitio. En uno o dos minutos los cambios están en línea.

**La única excepción**: el formulario de contacto escribe directo en la base, en el momento. Un lead no puede esperar a un build.

---

## Estructura de carpetas

```
frontend/
  src/
    pages/
      index.astro                    # Home ES
      propiedades/index.astro        # Catálogo ES
      propiedades/[slug].astro       # Ficha ES
      insights/[slug].astro          # Informe ES
      noticias/index.astro
      noticias/[slug].astro
      en/…                           # Espejo en inglés
      admin/…                        # Panel (isla React)
    components/
      public/                        # Hero, Buscador, CardPropiedad, Footer…
      admin/                         # Formularios, tablas, cargador de imágenes
    layouts/
    i18n/                            # Diccionarios ES/EN y pickLocale()
    lib/
  public/
    logos/  fonts/

backend/
  functions/
    leads.ts
    admin-auth.ts
    admin-properties.ts
    admin-cover.ts
    admin-leads.ts
    admin-catalogs.ts
    admin-settings.ts
    admin-publish.ts
  db/
    schema.ts
    migrations/
    seed.ts
  lib/
    auth.ts          # JWT + bcrypt
    validation.ts    # Esquemas Zod compartidos
    storage.ts       # Cliente S3
    mailer.ts        # Aviso de leads (Resend)
    rateLimit.ts
    errors.ts

deployment/
  Dockerfile  docker-compose.yml  netlify.toml
```

---

## Seguridad transversal

| Frente | Medida |
|--------|--------|
| Autenticación | JWT firmado, 8 horas, en cookie `HttpOnly` + `Secure` + `SameSite=Strict` |
| Contraseñas | bcrypt coste 12. Nunca se devuelve el hash |
| Autorización | Toda función `admin-*` verifica el token antes de tocar la base. Middleware único, no repetido |
| Inyección SQL | Drizzle con consultas parametrizadas. Nunca SQL concatenado |
| XSS | Astro escapa por defecto. El mensaje de los leads se escapa en el panel |
| Privacidad de terceros | La tabla `owners` no se expone en ningún endpoint público ni llega al HTML generado (RNF-10) |
| Enlaces externos | El enlace a Drive se abre con `rel="noopener noreferrer"` |
| Carga de archivos | Tipo verificado por firma binaria, tamaño limitado, nombre saneado, extensión reescrita |
| Fuerza bruta | Límite por IP en login (5 cada 15 min) y en el formulario (5 cada 10 min) |
| Filtración de datos | Los errores devuelven código y mensaje genérico; el detalle va al log del servidor |
| Enumeración de usuarios | Login responde igual ante email inexistente y contraseña incorrecta |
| Cabeceras | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS |
| Secretos | Ninguno en el código. Ver mapa de credenciales |

---

## Mapa de credenciales

Según los tres niveles de CLAUDE.md.

### Nivel 1 — Variables de entorno (`.env`, nunca versionado)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Cadena de conexión a Postgres |
| `JWT_SECRET` | Firma de los tokens. Mínimo 32 caracteres aleatorios |
| `STORAGE_ENDPOINT` | URL del servicio S3-compatible |
| `STORAGE_BUCKET` | Nombre del bucket |
| `STORAGE_ACCESS_KEY` | Clave de acceso |
| `STORAGE_SECRET_KEY` | Clave secreta |
| `PUBLIC_SITE_URL` | URL canónica, para metadatos y sitemap |

### Nivel 2 — Configuración de despliegue (panel de Netlify)

Las mismas variables del Nivel 1, cargadas como variables de entorno del sitio, más:

| Variable | Uso |
|----------|-----|
| `NETLIFY_BUILD_HOOK_URL` | Webhook que dispara la regeneración |
| `RESEND_API_KEY` | Envío del aviso de consultas |

Se cargan en la interfaz de Netlify, **nunca en `netlify.toml`**, que sí se versiona.

### Nivel 3 — Panel admin, cifradas en base

Reservado para credenciales que la clienta administre por sí misma. **Vacío en esta entrega**: no hay integraciones de terceros todavía. La tabla y el mecanismo de cifrado se dejan preparados para la Fase 2 (clave de API del CRM, credenciales de envío de correo).

> Todas las claves se generan **con el mail de la marca**, `reynaderealestate@gmail.com`, no con cuentas de Musapp (RNF-09).

---

## Preparación para un segundo idioma (RNF-11)

El sitio sale **en español**. Lo que se deja listo, sin costo:

- Los campos narrativos ya tienen su par `_en` en la base, nulo por ahora
- Los textos de interfaz viven en `src/i18n/es.json`, no incrustados en los componentes
- Las rutas se generan desde una constante de idioma, de modo que agregar `/en/` no obliga a reescribir páginas
- La función `pickLocale` existe y devuelve siempre español mientras haya un solo idioma

Activar el inglés más adelante es cargar contenido y encender el ruteo, no rehacer el sitio.

---

## Rendimiento

- HTML estático desde CDN
- Imágenes en WebP, con `srcset` en tres tamaños, carga diferida fuera de la primera pantalla, y `width`/`height` declarados para evitar saltos de layout
- Tipografías autoalojadas con `font-display: swap` — sin depender de Google Fonts en tiempo de ejecución
- JavaScript solo donde hace falta: buscador, galería, formulario y panel
- Objetivo: Lighthouse ≥ 90 en móvil (RNF-01)

---

## Portabilidad

`docker-compose.yml` levanta el proyecto completo — aplicación, Postgres y MinIO como storage S3 — sin depender de ningún servicio externo. Es el mismo entorno que correría en el VPS Hetzner si hiciera falta migrar.

Mudar de proveedor significa cambiar variables de entorno, no reescribir código.
