# Inventario de MCPs — Reyna de Real Estate

Versión: 1.0 · 2026-08-20

## Exploración realizada

| Fuente | Consulta | Resultado |
|--------|----------|-----------|
| Registro de MCPs | `postgres`, `database`, `netlify`, `supabase`, `deployment`, `astro`, `storage`, `drive` | **Sin resultados** |
| Registro de MCPs | `database` | **Sin resultados** |
| Entorno local | Servidores conectados | 6 disponibles, evaluados abajo |

El registro remoto no devolvió nada para este stack. Se trabaja con lo conectado en el entorno.

---

## Seleccionados

### 🟢 Google Drive — **verificado y en uso**
`mcp__bd99e2e6-1536-49a2-b4cf-4867bb4e9464__*`

**Por qué**: es central en este proyecto. Las fotos de las propiedades viven en Drive, la ficha de cada propiedad enlaza a una carpeta de Drive, y la documentación del proyecto está ahí.

**Verificación**: se ejecutaron `search_files` y `read_file_content` con éxito. **Encontró el Documento de Cierre de Alcance que cambió el plan entero** (decisión B5) y confirmó que la carpeta de material de la clienta está vacía.

**Uso previsto**: verificar que las carpetas de Drive enlazadas existan y sean accesibles antes de publicar cada propiedad; recuperar documentación del proyecto.

⚠️ **Cuidado**: da acceso a todo el Drive de la usuaria. Se usa solo para archivos de este proyecto.

---

### 🟢 Navegador — **para verificación visual**
`mcp__Claude_Browser__*`

**Por qué**: la regla 7 de CLAUDE.md exige que un journey se verifique de punta a punta. Este MCP permite levantar el sitio, navegarlo, sacar capturas y comprobar el diseño responsive con `resize_window`.

**Uso previsto**: verificación obligatoria al cerrar cada journey — comparar contra `design/referencias/`, probar en 360px y 1280px, revisar la consola en busca de errores.

---

## Evaluados y descartados

| MCP | Por qué no |
|-----|-----------|
| Notion | La documentación del proyecto vive en el repositorio y en Drive |
| Chrome (`claude-in-chrome`) | Requiere el navegador real con sesiones iniciadas. El navegador integrado alcanza |
| Uso de computadora | No hay tareas de escritorio en este proyecto |
| Terminal | La herramienta Bash cubre la necesidad |
| Tareas programadas | No hay automatizaciones recurrentes en el alcance |

---

## Para evaluar en fases posteriores

| Necesidad | Candidato |
|-----------|-----------|
| Integración con CRM inmobiliario | API de EasyBroker (sin MCP conocido; integración directa) |
| Analítica | Plausible o GA4, si se suman al alcance |
