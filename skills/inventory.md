# Inventario de Skills — Reyna de Real Estate

Versión: 1.0 · 2026-08-20

## Exploración realizada

| Fuente | Consulta | Resultado |
|--------|----------|-----------|
| Registro de skills | `astro`, `web development`, `postgres`, `accessibility audit`, `seo`, `real estate`, `frontend testing` | **Sin resultados** |
| Entorno local | Skills habilitadas | Evaluadas abajo |

No hay skills publicadas para este stack. Se trabaja con las habilitadas en el entorno.

---

## Seleccionadas

### 🟢 `security-review`
**Cuándo**: en IT-10, la auditoría de seguridad final, y ante cualquier journey que toque autenticación, carga de archivos o datos de terceros.
**Por qué**: CLAUDE.md exige auditoría de seguridad por tarea y una holística antes de entregar. Esta skill la ejecuta de forma sistemática.

### 🟢 `code-review`
**Cuándo**: al cerrar cada hito, antes de `/review`.
**Por qué**: detecta errores de corrección y oportunidades de simplificación sobre el diff acumulado.

### 🟢 `run`
**Cuándo**: en cada verificación de journey.
**Por qué**: levanta el proyecto para comprobar que la funcionalidad existe de verdad en el navegador, no solo en el código. Regla 7 de CLAUDE.md.

### 🟡 `artifact-design` + `artifact-diagramming`
**Cuándo**: al preparar la presentación del Hito 1 para la clienta.
**Por qué**: el punto de presentación del plan sugiere mostrarle algo tangible a Laura. Un artefacto publicado es más presentable que una URL de desarrollo.

### 🟡 `presupuesto-musapp`
**Cuándo**: si hace falta formalizar el alcance v2 con la clienta (acción A-07).
**Por qué**: genera documentos comerciales con la marca Musapp. El Documento de Cierre quedó desactualizado respecto del alcance acordado hoy.

---

## Evaluadas y descartadas

| Skill | Por qué no |
|-------|-----------|
| `dataviz` | No hay gráficos en el alcance. Los contadores del tablero son números sueltos |
| `xlsx` | La exportación a CSV se genera en el propio endpoint |
| `docx` / `pdf` | La documentación de entrega va en Markdown, dentro del repositorio |
| `skill-creator` | No hay una tarea repetitiva que amerite una skill propia |
| `schedule` / `loop` | No hay tareas recurrentes en el alcance |
| `design` (canvas) | El diseño ya está aprobado. No hay que crear pantallas nuevas |

---

## Comandos del template

`/session-start` al abrir cada sesión · `/review` en cada hito · `/iterate` después de entregar.
