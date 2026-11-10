# Entrega — Reyna de Real Estate

Lo que hay que saber en la primera hora, para quien hereda este repositorio.
No reemplaza a `docs/project_memory.md` (el estado) ni a `docs/work_log.md` (el por qué de cada
decisión): es el camino de entrada.

**La guía para la clienta no está acá.** Vive dentro del panel, en `/admin/ayuda`, porque después de
la entrega ella no tiene a quién preguntarle y la ayuda tiene que estar donde trabaja. Si cambiás
cómo funciona algo, actualizá esa pantalla: es `frontend/src/pages/admin/ayuda.astro`.

---

## Qué es

Sitio de captación de una broker de propiedades en Riviera Maya, con panel de administración para que
ella misma cargue propiedades, noticias y textos. Astro 7 + React en islas + Tailwind 4, Postgres en
Supabase con Drizzle, desplegado en Netlify.

```
frontend/src/pages/        las páginas: públicas, /admin/*, y /api/*
frontend/src/lib/          lectura de datos para las páginas (consulta al construir)
backend/lib/               la lógica, con la base por parámetro
backend/db/                esquema, migraciones y siembra
tests/backend/             13 archivos, 323 casos, Postgres real en memoria
netlify/functions/         la función que mantiene despierta la base
```

## Las tres cosas que sorprenden

### 1. El sitio público es estático, y publicar es un despliegue

Las visitas **no consultan la base**: las páginas se escriben al construir. Cuando la clienta aprieta
"Publicar cambios", el panel dispara un webhook de Netlify y el sitio se reconstruye.

Consecuencia: **un cambio en la base no se ve hasta que alguien publica.** Si agregás una integración
que escriba datos de afuera, necesita una estrategia de acumulación — no reconstruir por cada cambio.

Lo único que corre en el servidor es `POST /api/leads`, todo `/admin/*` y `/api/admin/*`, y la página
de error. **Ninguna página pública se genera en el momento de mirarla**, y hay que mantenerlo así: una
página pública con `prerender = false` deja de verse cuando Supabase se pausa.

### 2. Hay 20 despliegues por mes, y un portón que los protege

El plan gratuito da 300 créditos y cada despliegue cuesta 15. Ya pasó una vez que el desarrollo se
comió el presupuesto y la clienta no pudo publicar.

Por eso `netlify.toml` tiene una regla `ignore`: **un despliegue sólo arranca si viene del botón del
panel o si el mensaje del commit dice `[desplegar]`**. Dos cosas que no avisan:

- Netlify lee `netlify.toml` **del commit que construye**, así que la regla se aplica a sí misma. Si
  el commit de más arriba no lleva la marca, **se saltea su propio despliegue en silencio**. Pasó
  tres veces. Verificalo antes de empujar.
- Un despliegue lanzado a mano desde el panel de Netlify **se cancela en silencio** por el mismo
  motivo. En el panel se ve como terminado sin construir, no como error.
- La búsqueda es de texto y abarca **todo el mensaje del commit**, no sólo la primera línea. Así que
  **mencionar la marca alcanza para dispararla**: un commit cuyo cuerpo explique dónde va la marca se
  despliega solo. Para hablar de ella sin activarla, nombrarla sin los corchetes.

Un commit que sólo toca documentación **no lleva la marca**: el portón no es una molestia que haya que
esquivar, es la razón por la que a la clienta le quedan publicaciones.

### 3. Supabase se pausa sola

El plan gratuito suspende el proyecto tras unos días sin actividad. **Pasó tres veces.** Cuando pasa,
el sitio sigue en pie —es estático— pero **las fotos desaparecen**, porque se sirven desde el
almacenamiento en el momento de mirar la página.

`netlify/functions/mantener-despierta.mjs` consulta la base todos los días para evitarlo, y
**devuelve 500 cuando falla**. Eso último es el arreglo importante: antes devolvía 200 en todos los
casos y estuvo once días rota sin que nadie se enterara.

Si el sitio aparece sin fotos: entrar a Supabase y apretar "Restore project". La página de error del
sitio lo explica, y la ayuda del panel también. **Al reactivarla, el API vuelve antes que el pooler de
Postgres**: el subdominio puede dar `401` y la conexión seguir fallando con `tenant/user not found`
unos minutos.

---

## Arrancar en local

```bash
npm install
cp .env.example .env     # y completar con las credenciales
npm run db:migrate
npm run seed
npm run dev
```

El portón de calidad, antes de cualquier commit:

```bash
npm run check && npm run lint && npm test
```

`npm test` tarda unos tres minutos y medio. **No subas `maxWorkers` en `vitest.config.ts`**: cada
archivo levanta un Postgres entero en memoria, y sin tope la suite tira fallos falsos y se queda sin
memoria.

**No corras `npm audit fix`.** Rompió el árbol de dependencias y hubo que restaurar
`package-lock.json` de una copia. Tampoco `--omit=dev`: poda eslint y vitest.

### Verificar sin Supabase

Si la base está pausada y hace falta construir, se puede apuntar `backend/db/client.ts` a **PGlite**
—el mismo Postgres en WebAssembly de las pruebas, con carpeta en disco—, correr las migraciones, una
siembra mínima y construir; después se revierte el parche. La siembra real no sirve para esto: sube
imágenes a Supabase Storage y falla igual.

La página de error se verifica **sobre el sitio construido**, no con `astro dev` (en desarrollo Astro
no usa la página 500 propia): se importa `createHandler` de `.netlify/build/entry.mjs` y se pide
`/500` sin ninguna variable de base en el entorno.

---

## Reglas del código que no son obvias

- **Nada de contenido editable entra como HTML.** El cuerpo de los artículos se parte en bloques y se
  interpola; los enlaces se parten en trozos y el `href` pasa por `urlSegura`, que valida en positivo
  (sólo `http`/`https`). Nunca `set:html` con texto de la clienta.
- **Lo que necesita el navegador no comparte archivo con lo que sólo corre en el servidor.** Por eso
  existen `anchosImagen.ts` y `urlSegura.ts` sin dependencias. Importar aritmética desde el módulo de
  imágenes arrastraba `sharp` a todas las páginas y rompió un despliegue. **Hay una prueba que sigue
  la cadena de importaciones de cada página y falla si alguna llega a `sharp`.**
- **Un solo middleware de sesión.** Todo endpoint del panel usa `requerirSesion`. `auth.ts` no toca la
  base: la sesión se verifica con el JWT, por eso `/admin/ayuda` funciona con la base caída.
- **El anti-CSRF viene de `checkOrigin: true` de Astro, que sólo se instala si el proyecto tiene un
  middleware.** Borrar `frontend/src/middleware.ts` lo apagaría en silencio.
- **El CSP sólo deja imágenes propias y de Supabase** (`img-src 'self' data: https://*.supabase.co`) y
  video sólo propio. Si el almacenamiento se muda, conviene derivar el origen de `STORAGE_PUBLIC_URL`
  en vez de escribirlo en `netlify.toml`.
- **Los datos de los propietarios (`owners`) no salen nunca al sitio público.** Es un requisito
  escrito, y hay una prueba que escanea el código de las páginas públicas y corre la consulta real.
  No agregues `ownerId` a `camposPublicos` ni un join a `owners` en `lib/datos.ts`.
- **Astro 7, no Astro 5** (la rama 5 tenía XSS en el framework). `sharp` fijado a ≥0.35.3 por
  `overrides`: no bajarlo.
- **Este repositorio es público.** Nada de credenciales, ni comunicaciones sobre la clienta.

---

## Lo que no está hecho

|                                  | Qué falta                                                                                    | Por qué                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Avisos por correo**            | Cuenta de un servicio de correo (Resend). El código está y verificado                        | Sin esto no salen los avisos de consultas **ni hay recuperación de contraseña**                                               |
| **Recuperar la contraseña**      | Depende del correo                                                                           | Hoy se rehace con `npm run db:crear-admin`, que necesita el código. **Es el callejón sin salida más importante**              |
| **Subir el video de la portada** | El campo del panel acepta una ruta, pero el archivo tiene que ir en `frontend/public/video/` | Cambiarlo necesita a alguien con el código                                                                                    |
| **Permisos por rol**             | `admin_users` tiene sólo correo, nombre y contraseña                                         | Se pueden crear varios usuarios, pero **todos ven todo**, incluidos propietarios y consultas. Está fuera del alcance acordado |
| **Docker**                       | Probar `docker compose up`                                                                   | Docker no estaba instalado en el equipo de desarrollo                                                                         |
| **Sitio bilingüe**               | —                                                                                            | Fuera de alcance por decisión: el costo real es obligar a la clienta a cargar todo dos veces, para siempre                    |
| **Integración con EstateWave**   | —                                                                                            | Proyecto aparte. Su especificación tenía tres huecos de seguridad y choca con el modelo de reconstrucción                     |

## Acciones de entrega que no son código

| #    | Acción                                                                                                          | Estado                   |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------ |
| A-03 | Video del hero y retrato de la clienta                                                                          | pendiente de ella        |
| A-04 | Fotos reales de las propiedades — hacen falta para cerrar la auditoría de rendimiento                           | pendiente de ella        |
| A-07 | Confirmar el alcance final por escrito                                                                          | pendiente                |
| A-08 | Transferir dominio y repositorio. **Activar segundo factor en Supabase, Netlify y el correo de la marca antes** | pendiente                |
| A-09 | Definir el nombre de marca: el logo dice una cosa y el pie otra, en la misma página                             | pendiente de ella        |
| A-10 | Que la clienta ponga su propia contraseña (`npm run db:crear-admin`)                                            | pendiente                |
| A-11 | Abrir el sitio a Google                                                                                         | **preparado**: ver abajo |

### ⚠️ Apuntar el dominio: hay que borrar `PUBLIC_SITE_URL` de Netlify

**Esto no avisa y arruinaría la migración.** Hoy la variable `PUBLIC_SITE_URL` del panel de Netlify
vale `https://reyna-de-real-estate.netlify.app`, y de ahí salen **todas las direcciones canónicas, los
`og:url` y el mapa del sitio**. Verificado en vivo: la portada declara
`<link rel="canonical" href="https://reyna-de-real-estate.netlify.app/">`.

Si se apunta `reynaderealestate.com` sin cambiar esa variable, cada página del dominio nuevo le va a
estar diciendo a Google _"la versión de verdad de esta página está en la dirección vieja"_. El día que
se apunte el dominio:

1. **Borrar `PUBLIC_SITE_URL` de Netlify.** Alcanza con borrarla: `astro.config.mjs` ya tiene
   `https://reynaderealestate.com` como respaldo, así que borrar es más seguro que editar — no hay
   dirección que se pueda escribir mal. (Editarla al dominio también sirve.)
2. Volver a desplegar — las direcciones se escriben al construir, no se recalculan.

**Apuntar el dominio no obliga a abrir el sitio a Google.** Son dos cosas separadas: se puede tener el
dominio funcionando y la indexación todavía bloqueada, que es lo correcto mientras el sitio muestre
datos de demostración. Ver A-11.

### A-11 · Abrir el sitio a Google

Hoy el sitio **no se indexa a propósito**: mientras muestre datos de demostración, ocho propiedades
inventadas con precios inventados bajo la marca de la clienta es lo peor que podría aparecer si
alguien la busca.

El `sitemap.xml` ya está hecho (`frontend/src/pages/sitemap.xml.ts`) y se genera al construir, con las
propiedades, las noticias con su paginado y los informes.

**Antes de abrirlo tienen que estar dadas dos condiciones que hoy no lo están:**

- **Contenido real.** Mientras el catálogo sea de demostración, lo que indexaría Google son propiedades
  que no existen con precios que no existen, bajo la marca de la clienta.
- **El nombre de marca decidido** (A-09). Hoy el logo dice una cosa y el pie otra en la misma página.
  Abrir el sitio a los buscadores con dos nombres es enseñarles a no reconocer ninguno.

Cumplidas esas dos, y con el dominio ya apuntado y la variable borrada —indexar la dirección de
Netlify sería enseñarle a Google una dirección que se va a abandonar—, son **tres** pasos:

1. Borrar `frontend/public/robots.txt`.
2. Quitar las tres cabeceras `X-Robots-Tag = "noindex, nofollow"` de `netlify.toml`.
3. Empujar con `[desplegar]` en el mensaje.

La primera sin la segunda no sirve: la cabecera manda sobre el archivo.

## Credenciales

**No están en este repositorio y no tienen que estar** — es público. Se entregan aparte, según el
punto 6 del acuerdo. La lista de lo que hay que pasar:

- Supabase: cuenta del proyecto, `DATABASE_URL`, claves del almacenamiento
- Netlify: cuenta, y las variables de entorno cargadas en su panel
- GitHub: el repositorio
- Don Web: el dominio `reynaderealestate.com`
- El correo de la marca
- `JWT_SECRET` y la contraseña del panel
