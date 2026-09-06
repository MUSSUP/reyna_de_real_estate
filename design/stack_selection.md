# Selección de Stack — Reyna de Real Estate

Versión: 2.0 · 2026-08-21

---

## Decisión

| Capa | Elección | Motivo en una línea |
|------|----------|---------------------|
| Framework web | **Astro 7** | Genera HTML estático por defecto: SEO y velocidad sin esfuerzo, y consumo mínimo del plan gratuito |
| Interactividad | **React 19** como islas | Solo el buscador, la galería y el panel cargan JavaScript |
| Estilos | **Tailwind CSS 4** con tokens de marca | La paleta y tipografías ya están definidas; los tokens las hacen cumplibles |
| Backend | **Netlify Functions** (Node 20) | Incluidas en el plan gratuito, sin servidor que mantener |
| Base de datos | **Postgres** (Supabase gratuito) | Estándar, portable, sin quedar atado al proveedor |
| Acceso a datos | **Drizzle ORM** | SQL tipado y migraciones versionadas, sin dependencias propietarias |
| Almacenamiento | **Supabase Storage** (S3-compatible) | Mismo proveedor que la base y compatible con cualquier S3 |
| Autenticación | **JWT + bcrypt propio** | Default del template; no ata el proyecto a Supabase Auth |
| Validación | **Zod** | Un esquema compartido entre cliente y servidor |
| Imágenes | **Sharp** en build y en carga | Optimización propia, sin depender de transformaciones del proveedor |
| Correo | Punto de integración preparado, sin proveedor | Decisión de la usuaria: leads solo en el panel (R-06) |
| Contenedores | **Docker** | Requisito del template y garantía de portabilidad |

---

## La decisión que sostiene todo: el sitio público es estático

El sitio se **genera en el momento del build**, no en cada visita. Cuando la administradora publica un cambio, un webhook dispara una regeneración de Netlify que reconstruye las páginas afectadas.

Esto se decidió así porque resuelve cuatro problemas de una vez:

1. **La base gratuita se pausa por inactividad (R-01).** Si las visitas no tocan la base, la pausa deja de importar: solo el panel y el formulario la consultan.
2. **Velocidad.** HTML servido desde CDN es lo más rápido que existe. RNF-01 pide Lighthouse ≥ 90 en móvil; con esta arquitectura se cumple sin optimizar nada.
3. **SEO.** El contenido está en el HTML antes de que llegue Google, en ambos idiomas.
4. **Costo.** Casi no consume invocaciones de funciones, que es el recurso escaso del plan gratuito.

**El precio a pagar**: el sitio no refleja los cambios al instante, sino tras la regeneración (uno o dos minutos). Para un catálogo curado de propiedades de lujo que cambia algunas veces por mes, es un precio irrelevante.

**El buscador funciona en el cliente**: con un catálogo del orden de 5 a 10 propiedades, el sitio embebe un índice JSON liviano y filtra en el navegador. Resultado instantáneo, sin llamadas al servidor. Si el catálogo creciera por encima de unas 200 propiedades, se migra a búsqueda en servidor sin rehacer la interfaz.

---

## Alternativas descartadas

| Alternativa | Por qué no |
|-------------|-----------|
| **Next.js** | Excelente framework, pero su modelo de renderizado en servidor consumiría funciones en cada visita y su integración con Netlify es menos directa que con Vercel. Astro entrega más rendimiento con menos piezas para este tipo de sitio |
| **WordPress + tema** | Panel listo, pero pesado, con mantenimiento de seguridad constante, y no hay hosting gratuito serio. Además el diseño a medida terminaría peleando con el tema |
| **Seguir en Bubble** | Ata el proyecto a una plataforma paga, sin control del código, con marca "Built on Bubble" visible y sin portabilidad. Contradice el requisito de independencia |
| **Supabase Auth** | Resolvería el login sin escribirlo, pero ata la autenticación al proveedor y contradice RNF-07 |
| **Cloudinary para imágenes** | Mejores transformaciones, pero suma un tercer servicio con su propio límite. Supabase Storage al ser S3-compatible es más portable |
| **Astro sin islas de React** | Astro solo alcanza para el sitio público, pero el panel admin necesita estado e interactividad reales |

---

## Verificación de portabilidad (RNF-07)

Cada elección se puede reemplazar sin reescribir la aplicación:

- **Postgres** → cualquier Postgres (VPS Hetzner, Neon, RDS). Las migraciones de Drizzle corren igual
- **Supabase Storage** → cualquier S3 (MinIO en el VPS, R2, S3). Es el mismo protocolo
- **Netlify** → contenedor Docker en cualquier lado. Las funciones son handlers de Node estándar
- **Autenticación** → es código propio, no depende de nadie

Mudar el proyecto entero al VPS Hetzner sería levantar un `docker compose`, restaurar la base y apuntar el DNS.

---

## Versiones

Node 22 en producción (24 en desarrollo) · **Astro 7.2** · React 19.2 · Tailwind 4.3 · Drizzle ORM · Zod 4 · Sharp ≥0.35.3 · Postgres 15+

> **Cambio respecto de v1.0**: la planificación fijaba Astro 5 y Node 20. Durante IT-01 se detectó que Astro 5.18 arrastra varios XSS (dos de severidad alta) y que la versión actual es la 7.2. Se actualizó por seguridad. Ver decisión D-12.
>
> **Sharp está fijado por `overrides` a ^0.35.3**: las versiones 0.34.x heredan CVEs de libvips, y sharp procesa imágenes subidas desde el panel, que son entrada no confiable.
