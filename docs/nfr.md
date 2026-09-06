# Requisitos No Funcionales — Reyna de Real Estate

Versión: 2.0 · 2026-08-20

Cada requisito tiene un criterio verificable. Se comprueban en la auditoría previa a la entrega.

---

## Rendimiento

| Métrica | Objetivo | Cómo se verifica |
|---------|----------|------------------|
| Lighthouse Performance (móvil) | ≥ 90 | Lighthouse sobre la home y una ficha |
| Primer contenido visible | < 1.5s en 4G | Lighthouse |
| Contenido principal visible | < 2.5s en 4G | Lighthouse |
| Salto de diseño acumulado | < 0.1 | Lighthouse |
| Peso de la home | < 1.2 MB total | Panel de red del navegador |
| Respuesta del buscador | < 100ms | Filtrado en el navegador |
| Respuesta de la API | < 500ms en percentil 95 | Registro de las funciones |

**Presupuesto de imágenes**: portada de propiedad ≤ 150 KB, imagen de galería ≤ 250 KB, hero ≤ 300 KB. Todo en WebP.

---

## Disponibilidad

- El sitio público es estático en CDN: sigue en línea aunque la base esté pausada o caída.
- Si la base no responde, el formulario muestra un mensaje claro y ofrece WhatsApp como alternativa. **Nunca se pierde un contacto en silencio.**
- El panel puede estar caído sin afectar al visitante.

---

## Seguridad

Checklist de CLAUDE.md aplicado después de cada tarea, más auditoría holística antes de entregar.

| Control | Verificación |
|---------|--------------|
| Sin secretos en el código | Búsqueda de patrones de credenciales en todo el repositorio |
| Rutas de admin protegidas | Cada endpoint `/api/admin/*` probado sin token → 401 |
| Contraseñas con bcrypt coste 12 | Revisión de código |
| Consultas parametrizadas | Sin SQL concatenado en ningún punto |
| Contenido escapado | Prueba de XSS en el mensaje de un lead |
| Privacidad de terceros | Buscar datos de `owners` en todo el HTML generado: cero coincidencias |
| Carga de archivos validada | Intento de subir un archivo no permitido renombrado a `.jpg` |
| Límite de intentos activo | 6 intentos seguidos de login → 429 |
| Errores sin detalle interno | Provocar un fallo y revisar la respuesta |
| Cabeceras de seguridad | Inspección de respuesta HTTP |
| HTTPS obligatorio | Redirección desde HTTP verificada |

---

## Accesibilidad

Objetivo: **WCAG 2.1 nivel AA**.

Contraste AA en todo texto · navegación por teclado completa con foco visible · alt en todas las imágenes · formularios con etiquetas y errores anunciados · área táctil ≥ 44px · `prefers-reduced-motion` respetado · jerarquía de encabezados sin saltos · atributo `lang` correcto por idioma.

Verificación: axe DevTools sin errores críticos, más un recorrido completo usando solo el teclado.

---

## SEO

Título y descripción únicos por página · Open Graph con imagen · `canonical` por página · sitemap XML · `robots.txt` · datos estructurados de tipo inmueble en las fichas · URLs legibles y estables.

---

## Compatibilidad

Chrome, Safari, Firefox y Edge en sus dos últimas versiones. Safari iOS y Chrome Android. Desde 360px de ancho. Sin soporte para Internet Explorer.

---

## Mantenibilidad

Código en TypeScript con tipado estricto · migraciones de base versionadas y reversibles · variables de entorno documentadas en `.env.example` · README con instrucciones de instalación y despliegue · pruebas automatizadas de los caminos críticos: autenticación, envío de leads, publicación de propiedad y carga de la imagen principal.

---

## Portabilidad

Requisito estructural del proyecto (RNF-07, RNF-09).

- Postgres estándar, sin extensiones ni funciones propietarias
- Almacenamiento por protocolo S3, intercambiable
- Autenticación propia, sin proveedor externo
- `docker compose up` levanta el proyecto entero sin depender de ningún servicio en la nube
- Verificación: el proyecto debe correr completo en local con Docker antes de la entrega

---

## Costo

Operable dentro de los planes gratuitos: Netlify (100 GB de tráfico, 300 minutos de build, 125.000 invocaciones mensuales) y Supabase (500 MB de base, 1 GB de almacenamiento).

**Consumo estimado**: 8 propiedades con una imagen principal cada una, en tres tamaños, rondan 15 MB de almacenamiento — el resto del material vive en el Drive de la clienta, sin costo para el proyecto. La base no llega a 10 MB. Margen amplísimo.

**Umbral de revisión**: si el tráfico supera 50 GB mensuales o el almacenamiento llega a 800 MB, se evalúa migrar al VPS.
