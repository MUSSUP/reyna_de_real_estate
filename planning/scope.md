# Alcance — Reyna de Real Estate

Versión: 2.0 · 2026-08-20

> v2.0 tras la decisión B5: alcance híbrido acotado, sitio en español.
> Base: Documento de Cierre de Alcance del 29/06/2026.

---

## Dentro del alcance

### Sitio público (español)
- Home con hero en video y segmentación, buscador, carrusel de destacadas, Reyna Insights, Nosotros y contacto
- Catálogo completo con cuatro filtros
- Ficha de propiedad con **galería de fotos** y enlace a la carpeta de Drive para el video
- Informe Reyna Insights en HTML, editable desde el panel
- Listado y detalle de noticias
- Formulario de contacto con aviso por mail
- Botón flotante de WhatsApp
- Footer completo con redes enlazadas
- SEO, sitemap, Open Graph, datos estructurados de inmueble

### Panel de administración
- Login protegido
- ABM de propiedades con imagen principal, **galería** y enlace de Drive
- ABM de noticias e informes
- ABM de catálogos: zonas, tipologías, desarrollistas, amenidades, propietarios
- Marcar y ordenar destacadas
- Edición de textos de secciones fijas y datos de contacto
- Bandeja de leads con filtros y exportación a CSV

### Infraestructura
- Base de datos Postgres con migraciones versionadas
- Almacenamiento de imágenes
- Despliegue en Netlify con dominio propio
- Configuración Docker para portabilidad
- Script de datos de demostración
- Documentación de entrega

---

## Fuera del alcance

| Excluido | Por qué | Cuándo se evaluaría |
|----------|---------|---------------------|
| Integración con CRM (EasyBroker/Tokko/Wasi) | La clienta no tiene sistema todavía | Fase 2, tras presentarle el sitio |
| API de WhatsApp Business | Tiene costo y verificación de Meta | Si crece el volumen de consultas |
| **Sitio bilingüe ES/EN** | Excluido por el acuerdo. El costo no es el código: obliga a la clienta a cargar todo dos veces, para siempre (D-11) | Fase posterior: es cargar contenido, no reprogramar |
| Pagos o reservas online | No es el modelo de negocio | No previsto |
| Cuentas para visitantes | Nadie se registra en el sitio | No previsto |
| Mapa interactivo | No aparece en las referencias | Mejora futura |
| Panel multiusuario con roles | Una sola administradora | Si suma equipo |
| Newsletter | No fue pedido | Mejora futura |
| Analítica | No fue pedida | Se sugiere Plausible o GA4 al entregar |
| Migración de fotos desde Drive | Trabajo manual de contenido, no de desarrollo | Lo hace Musapp al cargar los datos reales |

---

## Límites explícitos

1. **No se rediseña.** El diseño está aprobado. Se replica de `design/referencias/` con las correcciones de bajo costo que ella pidió en julio.
2. **No se reescribe el copy.** Los textos de "Conóceme" y del informe están redactados y aprobados.
3. **El sitio sale en español.** El modelo y el ruteo quedan preparados para inglés, pero no se construye ni se carga contenido en ese idioma.
4. **No se migra la app de Bubble.** Se construye de cero; Bubble queda como referencia visual.

---

## Criterio de "terminado"

La entrega está completa cuando:

- [ ] Un visitante puede buscar una propiedad, filtrarla, abrir su ficha, ver el resto del material en Drive y contactar
- [ ] Un visitante puede recorrer la galería de fotos de una propiedad
- [ ] Un visitante puede leer el informe completo y las noticias
- [ ] La administradora puede publicar una propiedad con sus fotos y verla en el sitio sin ayuda técnica
- [ ] La administradora puede publicar una noticia y verla en el sitio
- [ ] Cada consulta llega por mail y queda en la bandeja
- [ ] La administradora puede ver y exportar los leads recibidos
- [ ] El sitio responde en `reynaderealestate.com` con HTTPS
- [ ] Todas las páginas se ven bien con datos de demostración y también sin datos
- [ ] Ningún dato de propietarios llega al sitio público
- [ ] La auditoría de seguridad final está documentada
- [ ] El código fuente y las credenciales están entregados (acuerdo, punto 6)
