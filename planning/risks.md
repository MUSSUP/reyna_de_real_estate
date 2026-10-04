# Riesgos — Reyna de Real Estate

Versión: 2.0 · 2026-08-20

> v2.0 tras la decisión B5.

Escala: Probabilidad (P) y Severidad (S) en Alta / Media / Baja.

---

## R-01 · La base de datos gratuita se pausa por inactividad
**P: Alta · S: Media**

Supabase suspende proyectos gratuitos tras aproximadamente una semana sin actividad. En un sitio de bajo tráfico inicial, esto puede hacer que la primera visita del día falle o demore.

**Mitigación**: el sitio público se genera **estático**, de modo que las visitas no consultan la base — solo el panel admin y el envío de formularios lo hacen. Un chequeo programado semanal mantiene el proyecto activo. Si aun así molesta, se migra al VPS Hetzner sin reescribir.

**Señal de alerta**: errores de conexión al entrar al panel después de varios días sin uso.

---

## R-02 · Se agotan los minutos de build de Netlify
**P: Baja · S: Media**

El plan gratuito da 300 minutos de build por mes. Cada publicación desde el panel dispara una regeneración del sitio.

**Mitigación**: con un catálogo de 5 a 10 propiedades, cada build ronda 1 o 2 minutos — margen para más de 100 publicaciones mensuales. Se agrupan cambios múltiples en un solo build con un retardo, en lugar de reconstruir por cada guardado.

---

## R-03 · ✅ CERRADO — La carga bilingüe duplicaba el trabajo
**Cerrado por la decisión B5/D-06**: el sitio sale en español. La base queda preparada para sumar inglés sin migración, pero no se carga contenido en ese idioma.

---

## R-04 · El apuntado de DNS — resuelto para la entrega, pendiente de transferir
**2026-08-21**: el dominio está en **Don Web, en la cuenta de Musapp**. El apuntado a Netlify y la verificación de correo **no dependen de la clienta**: no bloquean la entrega.

**Queda pendiente**: transferir el dominio a una cuenta de la clienta después de entregar. Mientras no ocurra, el activo más importante de la marca está a nombre de Musapp — lo contrario de lo que busca la decisión D-05 sobre independencia. No es urgente, pero no debe olvidarse.

---

## R-05 · Faltan los contenidos reales
**P: Alta · S: Alta** ⬆️ *severidad elevada tras verificar el Drive*

Las fotos están dispersas en Google Drive. **La carpeta que se le pidió a la clienta el 29 de junio sigue vacía**: no subió el video del hero ni el material de las propiedades. El acuerdo condicionaba el inicio de la construcción a recibir ese material.

**Mitigación**: se construye con datos de demostración realistas desde el principio, de modo que el sitio sea presentable aunque el contenido definitivo llegue después. La carga real es tarea separada del desarrollo. Para el video del hero hay un `.mp4` en los assets locales que podría servir provisoriamente, y siempre existe la imagen de respaldo.

---

## R-06 · ✅ CERRADO — Leads sin responder
**Cerrado por la decisión D-08**: se envía aviso por mail con Resend, como preveía el Documento de Cierre. Si el envío falla, el lead ya quedó guardado y el fallo se registra.

*Pendiente operativo*: la clienta debe confirmar a qué mail llegan las consultas (acción A-05).

---

## R-07 · Fotos de terceros sin derechos claros
**P: Media · S: Media**

La clienta comparte cartera con otros brokers y las fotos en Drive son de propiedades ajenas. Publicarlas puede tener implicancias de derechos de uso.

**Mitigación**: señalarlo a la clienta antes de publicar. Registrar en cada propiedad si es cartera propia o compartida. No es una decisión técnica.

---

## R-08 · Deriva de alcance hacia un portal inmobiliario
**P: Media · S: Media**

El proyecto empezó como landing y ya incluye buscador, catálogo, CMS y panel. La pendiente natural sigue hacia mapas, favoritos, comparador, alertas.

**Mitigación**: `scope.md` fija el límite. Todo lo que aparezca fuera de esa lista se registra como mejora futura y se decide con la usuaria, no se agrega sobre la marcha.

---

## R-10 · La clienta pidió cosas que no van a estar
**P: Baja · S: Media** ⬇️ *reducido por la decisión D-11*

En julio pidió noticias administrables, un cuarto filtro y galería de fotos. **Los tres entraron al alcance.** Lo único que queda afuera de lo que pidió es el sitio bilingüe.

**Mitigación**: confirmar el **alcance final por escrito antes de construir** (acción A-07), dejando claro qué incluye la entrega y que cierra el proyecto. Borrador en `docs/aviso_alcance_clienta.md`.

---

## R-09 · Proyecto con historia de demoras
**P: Media · S: Media**

El acuerdo tiene aproximadamente un año de antigüedad y ya sufrió interrupciones.

**Mitigación**: el trabajo se organiza en hitos que producen algo mostrable en cada uno. El primer hito ya deja un sitio presentable con datos de demostración, de modo que haya algo que enseñar temprano y no se dependa de terminar todo para mostrar avance.

---

## Resumen

| ID | Riesgo | P | S | Estado |
|----|--------|---|---|--------|
| R-01 | Base gratuita se pausa | Alta | Media | Mitigado por diseño estático |
| R-02 | Minutos de build | Baja | Media | Mitigado |
| R-03 | Carga bilingüe duplicada | — | — | ✅ Cerrado por D-06 |
| R-04 | DNS depende de la clienta | — | — | ✅ Cerrado: Don Web, con acceso |
| R-05 | Falta contenido real | Alta | **Alta** | Carpeta de Drive vacía. Mitigado con datos de demostración |
| R-06 | Leads sin responder | — | — | ✅ Cerrado por D-08 |
| R-07 | Derechos de fotos | Media | Media | A conversar con la clienta |
| R-08 | Deriva de alcance | Media | Media | Controlado por scope.md |
| R-09 | Historia de demoras | Media | Media | Mitigado por hitos mostrables |
| R-10 | La clienta pidió cosas que no van a estar | **Baja** | Media | Reducido por D-11. Aviso escrito antes de construir (A-07) |
