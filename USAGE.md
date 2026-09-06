# La MaquinarIA — Guía de uso para alumnos

> Bienvenido a **La MaquinarIA**. Acá la regla es simple: la IA no es tu herramienta, es tu empleada. Vos dirigís, ella ejecuta como un ingeniero senior — planifica, decompone, audita seguridad, entrega producto terminado con admin panel y deploy en Docker.

---

## Cómo arrancar en 4 pasos

1. **Duplicá esta carpeta** y renombrala con el nombre de tu proyecto.
2. **Abrí `START_PROJECT_PROMPT.md`** y completá los placeholders: nombre, tipo, descripción, features, usuarios, integraciones, constraints.
3. **Ejecutá `/init-project`** en Claude Code. El sistema entra en **Planning Mode** — te va a hacer preguntas, diseñar arquitectura y presentarte un plan. **No va a escribir una línea de código** hasta que apruebes.
4. Cuando estés conforme con el plan, ejecutá **`/start-execution`**. Recién ahí arranca a construir.

---

## Las dos unidades de trabajo

- **IT (Infrastructure Task)** — fundacional, sin UI (DB, auth, setup). Se hacen primero.
- **UJ (User Journey)** — acción completa del usuario, end-to-end. Backend + frontend + verificación. Una UJ **no está terminada** hasta que el usuario puede ejecutarla de punta a punta en el navegador.

---

## Los 5 comandos slash

| Comando | Cuándo |
|---|---|
| `/init-project` | Una sola vez, al arrancar el proyecto. Activa Planning Mode. |
| `/start-execution` | Una vez, después de aprobar el plan. Arranca la construcción. |
| `/session-start` | Al principio de cada nueva sesión. Claude te dice dónde retoma. |
| `/review` | Después de cada milestone. Lanza un subagente con contexto limpio que audita. |
| `/iterate` | Después de entregar, cuando pidas cambios. |

---

## Reglas de oro (no las rompas)

1. **No hay código antes del plan aprobado.** Ni una línea. Si Claude empieza a tipear sin que aprobaras, frenalo.
2. **Una cosa a la vez.** Una tarea o un journey — nunca dos en paralelo. Ahí te perdés.
3. **Documentá mientras hacés.** No al final, no por lotes — en el momento. Si no, perdés el hilo.
4. **Feature terminada = probada end-to-end en el navegador.** Si no la podés usar como usuario real, no está hecha. Punto.
5. **Checklist de seguridad después de cada tarea.** Audit holístico antes de entregar. Sin excepción.
6. **Admin panel obligatorio.** Todo proyecto lo lleva, con credenciales en 3 niveles. No negociable.

---

## Decisiones técnicas por default

- **Auth**: JWT + bcrypt
- **IA**: OpenAI SDK (cambiable)
- **UI**: Glassmorphism con dark/light mode, responsive, accesible
- **Deploy**: Docker, listo para EasyPanel
- **Credenciales**: 3 niveles → `.env` / deployment config / admin panel encriptado

El stack y la base de datos se eligen durante el planning según tu proyecto.

---

## Filosofía del sistema

> *"Speed is never a priority over correctness or quality."*

La MaquinarIA está construida bajo la filosofía **AI First**: la IA no es una herramienta — es el empleado. Tu rol como dueño del proyecto es dirigir, validar y aprobar. El de Claude es ejecutar como ingeniero senior, no como generador de código.

---

*Creado por **Yami Gala** para los alumnos del programa **AI First** de [AI Biz School](https://aibizschool.com).*
*Inspirado en **Prometeo**, el sistema multi-agente que opera el negocio de Yami 24/7.*

---

**Dale, vamos.** Cualquier duda, al canal de AI First. Publicar > perfeccionar — empezá.
