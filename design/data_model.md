# Modelo de Datos — Reyna de Real Estate

Versión: 3.0 · 2026-08-21 · **Prioridad: ALTA** (leer antes de cada journey)

> v3.0 tras la decisión D-11: se suman **galería de imágenes** y **artículos** (noticias e informes). Base: Documento de Cierre del 29/06/2026.
> **Sitio en español.** Los campos quedan preparados para inglés (sufijo `_en`, nulos) pero **no se cargan ni se muestran** en esta entrega.

Motor: Postgres 15+ · ORM: Drizzle · Migraciones en `backend/db/migrations/`

---

## Entidades

### `admin_users`
Acceso único para la clienta (acuerdo, punto 3).

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `email` | text | único, minúsculas |
| `password_hash` | text | bcrypt coste 12. **Nunca se expone** |
| `name` | text | |
| `last_login_at` | timestamptz | |
| `created_at` | timestamptz | |

---

### `zones`
Ciudad y zona. Alimenta el filtro y los dos badges de la card.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | serial PK | |
| `slug` | text | único |
| `city` | text | `Tulum`, `Playa del Carmen`, `Cancún`, `Holbox` |
| `zone` | text | opcional, subzona dentro de la ciudad |
| `country` | text | `México` |
| `country_code` | char(2) | `MX` — alimenta el badge de país |
| `sort_order` | int | |

---

### `property_types`
Tipologías. Tabla y no enum porque ya se pidió sumar "terreno".

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | serial PK | |
| `slug` | text | único |
| `name_es` / `name_en` | text | `name_es` obligatorio |
| `sort_order` | int | |

**Semilla**: casa · departamento · villa · **terreno** · local comercial
*Terreno es un inmueble sin construir. En él no se muestran dormitorios ni baños.*

---

### `developers`
Desarrollistas. Entidad del acuerdo.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | serial PK | |
| `name` | text | único |
| `website` | text | opcional |
| `notes` | text | interno |

---

### `owners`
Propietarios. Entidad del acuerdo. **Datos internos, jamás expuestos en el sitio público.**

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | serial PK | |
| `name` | text | |
| `phone` / `email` | text | opcionales |
| `notes` | text | interno |

> ⚠️ Ningún endpoint público devuelve esta tabla. Es información de contacto de terceros.

---

### `amenities`
Amenidades. Relación muchos a muchos con propiedades.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | serial PK | |
| `slug` | text | único |
| `name_es` / `name_en` | text | |
| `icon` | text | identificador del ícono |

**Semilla**: piscina · gimnasio · seguridad 24h · estacionamiento · roof top · playa privada · pet friendly · cowork

### `property_amenities`
`property_id` + `amenity_id`, clave primaria compuesta.

---

### `properties`
Entidad central. Campos según el punto 5.5 del acuerdo.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `slug` | text | único, generado del título, inmutable tras publicar |
| `title_es` / `title_en` | text | `title_es` obligatorio |
| `description_es` / `description_en` | text | descripción libre |
| `property_type_id` | int FK | obligatorio |
| `zone_id` | int FK | obligatorio |
| `developer_id` | int FK | opcional |
| `owner_id` | int FK | opcional, **interno** |
| `operation` | enum (`venta`, `renta`) | alimenta la segmentación Invertir/Rentar |
| `construction_status` | enum (`pozo`, `construccion`, `terminado`) | el "estado" del acuerdo |
| `year_built` | int | antigüedad. Nulo en pozo y en terrenos |
| `price_usd` | numeric(12,2) | ≥ 0 |
| `price_on_request` | boolean | si es verdadero se muestra "Precio a consultar" |
| `area_covered_m2` | int | m² cubiertos |
| `area_total_m2` | int | m² totales |
| `bedrooms` | int | 0 en terrenos |
| `bathrooms` | int | 0 en terrenos |
| `cover_path` | text | **imagen principal**, subida desde el panel |
| `cover_alt_es` | text | accesibilidad |
| `drive_url` | text | **enlace a la carpeta de Drive** con el resto de fotos y video (acuerdo, punto 3) |
| `is_featured` | boolean | aparece en el carrusel |
| `featured_order` | int | menor primero |
| `status` | enum (`borrador`, `publicado`, `archivado`) | por defecto `borrador` |
| `ownership` | enum (`propia`, `compartida`) | cartera propia o de otro broker (R-07) |
| `published_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

**Índices**: `slug` único · `status` · `is_featured, featured_order` · `zone_id` · `property_type_id` · `operation` · `price_usd` · `bedrooms`

**Reglas**
- Solo las `publicado` aparecen en el sitio
- Publicar exige: `title_es`, tipología, zona, operación, precio (o a consultar) e **imagen principal**
- `drive_url` se valida como URL de Drive y **se abre en pestaña nueva con `rel="noopener noreferrer"`**
- El `slug` se conserva al despublicar, para no romper enlaces

> **Nota (D-11)**: la galería se sumó al alcance. `cover_path` sigue siendo la imagen principal — la que se usa en el carrusel, el listado y los metadatos sociales. El `drive_url` se conserva para el **video y material pesado** de cada propiedad, que no se aloja en el proyecto.

---

### `property_images`
Galería de la propiedad. Sumada por la decisión D-11.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `property_id` | uuid FK → `properties` | en cascada al borrar |
| `storage_path` | text | ruta en el bucket, nunca URL completa |
| `alt_es` | text | accesibilidad (RNF-04) |
| `width` / `height` | int | para reservar espacio y evitar saltos de layout |
| `sort_order` | int | orden en la galería |
| `created_at` | timestamptz | |

**Reglas**: hasta **15 imágenes** por propiedad · JPEG, PNG y WebP hasta 10 MB · al subir se generan variantes WebP en 400, 800 y 1600px · la portada (`cover_path`) es independiente y no cuenta dentro de este límite.

> El tope de 15 protege el almacenamiento gratuito: 8 propiedades × 15 imágenes × 3 tamaños rondan 250 MB, dentro del límite de 1 GB.

---

### `articles`
Noticias e informes en una sola tabla: comparten estructura, y así la clienta puede publicar informes nuevos además de noticias. Sumada por la decisión D-11.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `slug` | text | único |
| `type` | enum (`noticia`, `informe`) | obligatorio |
| `title_es` / `title_en` | text | `title_es` obligatorio |
| `excerpt_es` | text | bajada para los listados |
| `body_es` | text | contenido en Markdown |
| `cover_path` | text | portada en el bucket |
| `cover_alt_es` | text | |
| `status` | enum (`borrador`, `publicado`) | por defecto `borrador` |
| `is_pinned` | boolean | el que aparece destacado en la home |
| `published_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

**Reglas**: solo un artículo puede tener `is_pinned` por cada `type` · el Markdown **se sanea al renderizar** (RNF-06) · publicar exige título, cuerpo y portada.

**Semilla**: el informe "Bienes raíces: una oportunidad de crecimiento" se carga con su contenido ya redactado, como `informe` y `is_pinned`.

---

### `leads`
Consultas del formulario.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `name` | text | 2 a 100 caracteres |
| `email` | text | formato válido |
| `phone` | text | opcional |
| `interest` | enum (`invertir`, `rentar`, `consulta`) | |
| `message` | text | hasta 2000 |
| `property_id` | uuid FK | la propiedad desde la que consultó |
| `source_path` | text | página de origen |
| `status` | enum (`nuevo`, `contactado`, `cerrado`, `descartado`) | por defecto `nuevo` |
| `notes` | text | interno |
| `notified_at` | timestamptz | cuándo se envió el aviso por mail |
| `created_at` | timestamptz | |

**Seguridad**: el mensaje se **escapa siempre** al mostrarlo — es contenido de origen público. `notes` nunca se expone.

---

### `login_attempts`
Intentos fallidos de acceso. **Agregada en IT-04** por la decisión D-13: en un entorno sin servidor un contador en memoria se reinicia con cada instancia, así que el límite no frenaría nada.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | uuid PK | |
| `ip_hash` | text | SHA-256 con sal. **Nunca la IP en claro** |
| `created_at` | timestamptz | |

**Reglas**: solo se registran fallos · ventana deslizante de 15 minutos · un acceso correcto limpia el historial de esa IP · los vencidos se borran desde el propio login.

---

### `site_settings`
Textos y datos editables sin tocar código.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `key` | text PK | `hero.title`, `whatsapp.primary` |
| `value_es` / `value_en` | text | |
| `group` | text | `hero`, `nosotros`, `contacto`, `redes`, `insights` |
| `input_type` | enum (`texto`, `parrafo`, `url`, `telefono`, `email`) | |
| `updated_at` | timestamptz | |

**Claves iniciales**: `hero.title`, `hero.question`, `hero.cta_invertir`, `hero.cta_rentar`, `hero.video_url`, `nosotros.title`, `nosotros.body`, `nosotros.claim`, `nosotros.photo`, `contacto.email`, `contacto.phone_mx`, `contacto.phone_ar`, `contacto.lead_email`, `whatsapp.primary`, `whatsapp.message`, `redes.instagram`, `redes.facebook`, `redes.youtube`.

---

## El informe Reyna Insights

Se modela como un registro de `articles` con `type = 'informe'` e `is_pinned = true`. Su contenido, ya redactado, se carga en la semilla. La clienta puede editarlo y publicar informes nuevos desde el panel (D-11).

---

## Relaciones

```
admin_users     (independiente)

zones ──────────┐
property_types ─┤
developers ─────┼──< properties ──< property_amenities >── amenities
owners ─────────┘        │
                         ├──< property_images
                         └──< leads (opcional)

articles        (independiente)
site_settings   (independiente)
```

---

## Datos de demostración

1 administradora · 5 tipologías · 4 zonas · 8 amenidades · 3 desarrollistas · 2 propietarios · **8 propiedades publicadas** (incluidas Casa Abaton en Tulum, Torre Mirador y Casa Babilon en Holbox, de la referencia) con imagen principal, **4 a 6 imágenes de galería** y enlace de Drive · el informe de Reyna Insights con su contenido real · **3 noticias** · 5 leads en distintos estados · todas las claves de configuración.

Cubre todas las entidades y relaciones. Obligatorio antes de la entrega, junto con la verificación de estados vacíos.
