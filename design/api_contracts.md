# Contratos de API — Reyna de Real Estate

Versión: 3.0 · 2026-08-21 · **Prioridad: ALTA** (leer antes de cada journey)

> v3.0 tras la decisión D-11: se suman los endpoints de **galería** y **artículos**.

Base: `/.netlify/functions/`, expuesta como `/api/` · JSON · UTF-8

---

## Principios

1. **El sitio público casi no usa la API**: se genera estático en el build. Solo el formulario llama al servidor.
2. **Todo `/api/admin/*` exige autenticación**, sin excepción.
3. **Los errores nunca filtran detalles internos**: código y mensaje legible al cliente, detalle al log.
4. **Toda entrada se valida con Zod en el servidor**, aunque el cliente ya haya validado.
5. **`owners` no se expone jamás** en ninguna respuesta pública.

---

## Formato

**Éxito**: `{ "ok": true, "data": { } }`
**Error**: `{ "ok": false, "error": { "code": "...", "message": "...", "fields": { } } }`

**Códigos**: `VALIDATION_ERROR` (400) · `UNAUTHORIZED` (401) · `FORBIDDEN` (403) · `NOT_FOUND` (404) · `RATE_LIMITED` (429) · `INTERNAL_ERROR` (500)

---

# Público

## POST `/api/leads`
Único endpoint que toca el visitante.

**Cuerpo**
```json
{
  "name": "Ana Pérez",
  "email": "ana@ejemplo.com",
  "phone": "+52 984 000 0000",
  "interest": "invertir",
  "message": "Me interesa Casa Abaton",
  "propertySlug": "casa-abaton",
  "sourcePath": "/propiedades/casa-abaton",
  "website": ""
}
```

| Campo | Reglas |
|-------|--------|
| `name` | obligatorio, 2 a 100 |
| `email` | obligatorio, formato válido |
| `phone` | opcional, 6 a 25 |
| `interest` | `invertir`, `rentar` o `consulta` |
| `message` | opcional, hasta 2000 |
| `propertySlug` | opcional, se resuelve a `property_id` en el servidor |
| `website` | **honeypot**: si trae contenido, responde éxito y descarta |

**Efecto**: guarda el lead y **envía aviso por mail** a `contacto.lead_email`. Si el envío falla, el lead **ya quedó guardado** y se registra el fallo — nunca se pierde una consulta.

**Respuesta 200**: `{ "ok": true, "data": { "received": true } }`

**Seguridad**: 5 envíos por IP cada 10 minutos → 429 · honeypot silencioso · contenido escapado al mostrarlo · no devuelve identificadores internos.

---

# Administración

Requieren `Authorization: Bearer <jwt>` (cookie `HttpOnly`). Sin token: 401.

## Autenticación

### POST `/api/admin/auth/login`
`{ "email": "...", "password": "..." }` → `{ "token": "...", "user": { "id", "name", "email" } }`

**Seguridad**: bcrypt coste 12 · **mensaje idéntico** ante email inexistente y contraseña incorrecta (`"Email o contraseña incorrectos"`) · 5 intentos por IP cada 15 minutos · JWT de 8 horas firmado con `JWT_SECRET` · cookie `HttpOnly`+`Secure`+`SameSite=Strict` · el hash nunca se devuelve.

### POST `/api/admin/auth/logout` · GET `/api/admin/auth/me`

---

## Propiedades

### GET `/api/admin/properties`
Parámetros: `status`, `q`, `page`, `perPage` (máx. 100).

```json
{ "ok": true, "data": { "items": [ { "id": "...", "slug": "casa-abaton", "titleEs": "Casa Abaton", "status": "publicado", "isFeatured": true, "featuredOrder": 1, "priceUsd": "1680000.00", "priceOnRequest": false, "zone": { "city": "Tulum", "zone": null, "country": "México" }, "type": { "slug": "casa", "nameEs": "Casa" }, "operation": "venta", "constructionStatus": "terminado", "coverUrl": "https://.../cover.webp", "hasDriveUrl": true, "updatedAt": "..." } ], "total": 8, "page": 1, "perPage": 20 } }
```

### GET `/api/admin/properties/:id`
Propiedad completa, incluidas amenidades y `ownerId`.

### POST `/api/admin/properties`
Obligatorio: `titleEs`, `propertyTypeId`, `zoneId`, `operation`, y `priceUsd` o `priceOnRequest`.
Opcional: `developerId`, `ownerId`, `constructionStatus`, `yearBuilt`, `areaCoveredM2`, `areaTotalM2`, `bedrooms`, `bathrooms`, `amenityIds`, `driveUrl`, `descriptionEs`, `ownership`.
Se crea en `borrador`. El `slug` se genera del título y se garantiza único.

### PATCH `/api/admin/properties/:id`
Actualización parcial. **Publicar exige imagen principal** → si falta, 400 con `"Cargá la imagen principal antes de publicar"`. El `slug` no cambia tras publicar.

### DELETE `/api/admin/properties/:id`
Archiva (borrado lógico). Con `?purge=true` borra también el archivo, y solo si nunca estuvo publicada.

### PUT `/api/admin/properties/featured`
`{ "order": [ { "id": "...", "featuredOrder": 1 } ] }` — reordena el carrusel en una operación.

---

## Imagen principal y galería

### POST `/api/admin/properties/:id/cover`
`multipart/form-data`, **un solo archivo**.

**Validaciones**: tipo verificado por **firma binaria**, no por extensión · solo JPEG, PNG y WebP · hasta 10 MB · nombre saneado, nunca el del cliente.
**Procesamiento**: variantes WebP de 400, 800 y 1600px, con `width`/`height` registrados. Reemplaza la anterior y borra el archivo viejo.

### DELETE `/api/admin/properties/:id/cover`
Rechaza con 400 si la propiedad está publicada.

### POST `/api/admin/properties/:id/images`
Carga de galería, `multipart/form-data`, **varios archivos por vez**.

**Validaciones**: tipo por **firma binaria** · JPEG, PNG y WebP · hasta 10 MB por archivo · **máximo 15 por propiedad** → 400 con `"Llegaste al máximo de 15 imágenes"` · nombre saneado.
**Procesamiento**: variantes WebP de 400, 800 y 1600px, con dimensiones registradas. Se agregan al final del orden.

### PATCH `/api/admin/images/:id`
Modifica `altEs` y `sortOrder`.

### PUT `/api/admin/properties/:id/images/order`
Reordena la galería completa en una operación: `{ "order": [ { "id": "...", "sortOrder": 1 } ] }`

### DELETE `/api/admin/images/:id`
Borra el registro y sus archivos del bucket.

---

## Artículos (noticias e informes)

### GET `/api/admin/articles`
Parámetros: `type` (`noticia` o `informe`), `status`, `page`, `perPage`.

```json
{ "ok": true, "data": { "items": [ { "id": "...", "slug": "nuevo-desarrollo-en-tulum", "type": "noticia", "titleEs": "Nuevo desarrollo en Tulum", "status": "publicado", "isPinned": false, "coverUrl": "https://.../cover.webp", "publishedAt": "...", "updatedAt": "..." } ], "total": 4 } }
```

### GET `/api/admin/articles/:id` · POST · PATCH · DELETE
Mismo patrón que propiedades. Obligatorio al crear: `titleEs`, `type`. Se crea en `borrador`; el `slug` se genera del título y se garantiza único.

**Publicar** exige título, cuerpo y portada → si falta algo, 400 indicando cuál.
**Marcar `isPinned`** desmarca el anterior del mismo tipo, en la misma transacción.
**El cuerpo se guarda en Markdown y se sanea al renderizar** (RNF-06): ningún script sobrevive.

### POST `/api/admin/articles/:id/cover`
Portada del artículo. Mismas validaciones que la imagen principal de una propiedad.

---

## Leads

### GET `/api/admin/leads`
Parámetros: `status`, `from`, `to`, `page`, `perPage`.
Devuelve además `counts` por estado, para los contadores del tablero.

### PATCH `/api/admin/leads/:id`
Solo `status` y `notes`. Los datos que dejó el visitante son **inmutables**.

### GET `/api/admin/leads/export`
CSV UTF-8 **con BOM** (para que Excel muestre bien los acentos). Respeta los filtros del listado.

---

## Catálogos

### GET `/api/admin/catalogs`
Devuelve zonas, tipologías, desarrollistas, amenidades y propietarios para poblar los formularios.

### POST/PATCH/DELETE `/api/admin/catalogs/:entity/:id?`
ABM de catálogos. `entity` ∈ `zones`, `property-types`, `developers`, `amenities`, `owners`.
Rechaza el borrado si hay propiedades asociadas → 400 con el motivo.

---

## Configuración

### GET `/api/admin/settings` · PUT `/api/admin/settings`
`{ "updates": [ { "key": "hero.title", "valueEs": "..." } ] }`
Solo claves existentes: no se pueden crear nuevas desde la API.

---

## Publicación

### POST `/api/admin/publish`
Dispara la regeneración del sitio vía webhook de Netlify.
`{ "ok": true, "data": { "queued": true, "estimatedSeconds": 90 } }`
**Agrupa llamadas en una ventana de 60 segundos**: varios guardados seguidos producen un solo build.

---

## Cobertura

| Journey | Endpoints |
|---------|-----------|
| UJ-01 a UJ-05 (público) | Ninguno: contenido estático |
| UJ-06 (contacto) | `POST /api/leads` |
| UJ-07 (login) | `/api/admin/auth/*` |
| UJ-08 (propiedad) | `/api/admin/properties/*`, `/cover`, `/images/*`, `/catalogs` |
| UJ-09 (destacadas) | `PUT /api/admin/properties/featured` |
| UJ-10 (artículos) | `/api/admin/articles/*` |
| UJ-11 (leads) | `/api/admin/leads*` |
| UJ-12 (textos) | `/api/admin/settings` |
| UJ-13 (publicar) | `POST /api/admin/publish` |
