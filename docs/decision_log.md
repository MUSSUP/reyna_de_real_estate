# Registro de Decisiones — Reyna de Real Estate

Formato: contexto → decisión → consecuencia.

---

## D-01 · Reyna de Real Estate es la marca madre

**2026-08-20**

**Contexto**: el material alternaba dos identidades — el logo dice "Laura Cabral", el footer y el dominio dicen "Reyna de Real Estate", y el informe llevaba `lauracabralrealestate.com`.

**Decisión**: **Reyna de Real Estate** es la marca; **Laura Cabral** es la persona. Los logos actuales se mantienen: el logo funciona como firma personal. Todos los datos de contacto son los de Reyna.

**Consecuencia**: hay que corregir la pieza del informe, que lleva el dominio y el instagram viejos.

---

## D-02 · Hosting en Netlify gratuito, no en el VPS propio

**2026-08-20**

**Contexto**: Musapp tiene un VPS Hetzner pago. La recomendación técnica inicial fue usarlo: sin límites y camino nativo del template.

**Decisión**: **Netlify gratuito** con base y almacenamiento externos. El VPS queda como red de emergencia.

**Motivo de la usuaria**, que resultó mejor que el argumento de costo: alojar el sitio en su propio servidor la convertiría en la infraestructura permanente de su clienta. El día que quisiera dar de baja el VPS, se caería el sitio de otra persona.

**Consecuencia**: se aceptan los límites del plan gratuito y el riesgo de pausa por inactividad (R-01), mitigado por la arquitectura estática. Se descarta Vercel: su plan gratuito prohíbe el uso comercial.

---

## D-03 · Independencia de la infraestructura como requisito

**2026-08-20**

**Contexto**: elegir servicios gratuitos no desata a Musapp si las cuentas están a su nombre.

**Decisión**: todas las cuentas se crean con `reynaderealestate@gmail.com`. El dominio ya lo administra la clienta. La arquitectura se diseña portable: Postgres estándar, almacenamiento S3, autenticación propia, Docker.

**Consecuencia**: se descarta Supabase Auth pese a que ahorraría trabajo, porque ata el proyecto al proveedor. Salir del proyecto es quitarse como colaboradora, no migrar cuentas.

---

## D-04 · El sitio público se genera estático

**2026-08-20**

**Contexto**: la base gratuita se pausa por inactividad y el plan gratuito limita las invocaciones de funciones.

**Decisión**: el sitio se genera en el build. Las visitas no consultan la base. Al publicar, un webhook regenera el sitio.

**Consecuencia**: resuelve de una vez rendimiento, SEO, costo y el riesgo de pausa de la base. El precio es que los cambios tardan uno o dos minutos en verse, irrelevante para un catálogo curado. El buscador filtra en el navegador; si el catálogo superara unas 200 propiedades habría que migrarlo a servidor.

---

## D-05 · Astro en lugar de Next.js

**2026-08-20**

**Decisión**: Astro 5 con islas de React.

**Motivo**: el sitio es mayormente contenido con SEO crítico. Astro genera HTML estático por defecto y carga JavaScript solo donde hace falta. Next.js consumiría funciones en cada visita y su integración con Netlify es menos directa.

---

## D-06 · ⭐ Alcance híbrido acotado, y el sitio sale en español

**2026-08-20 — la decisión más importante de la planificación**

**Contexto**: con la planificación casi terminada, la exploración de MCPs encontró en Drive el **"Documento de Cierre de Alcance V1"** del 29 de junio de 2026, un acuerdo formal entre Musapp y la clienta que declara reemplazar toda conversación anterior. **Contradecía el plan en nueve puntos**, incluido que el sitio bilingüe estaba explícitamente fuera de alcance.

Dos hechos agravaban el cuadro: la clienta **nunca completó el documento** —toda la sección de definiciones quedó en blanco— y **la carpeta de material que se le pidió está vacía**. El acuerdo condicionaba el inicio de la construcción a recibirlo completo.

**Decisión**: **híbrido acotado**. Base en el Documento de Cierre; se suman solo las correcciones de julio de costo bajo (badge de país, cuarto filtro, terrenos, textos, footer, segmentación del hero, informe en HTML). Queda fuera lo que la clienta agregó después y encarece: bilingüe, CMS de noticias, galería con carga múltiple.

**Consecuencia**: el plan se reescribió de v1.0 a v2.0. Cayeron 2 journeys y se simplificaron 3. Se incorporaron entidades que el acuerdo ya daba por modeladas y el plan de v1 había omitido: desarrollistas, zonas, propietarios y amenidades. El sitio sale en español, con la base preparada para sumar inglés sin migración.

**Riesgo asumido**: la clienta pidió en julio cosas que ahora no van a estar. Queda como acción A-07 decidir si se actualiza el documento de cierre y se le pide firma antes de entregar.

---

## D-07 · Imagen principal más enlace a Drive, en lugar de galería

**2026-08-20**

**Contexto**: el acuerdo define una sola imagen cargada en el panel y un enlace a la carpeta de Drive con el resto del material. El plan v1 había diseñado una galería completa.

**Decisión**: se respeta el acuerdo.

**Consecuencia**: desaparece la tabla `property_images` y la carga múltiple. Baja mucho el consumo de almacenamiento —unos 15 MB en lugar de 90— porque el material pesado vive en el Drive de la clienta. La ficha gana un bloque destacado que enlaza a la carpeta, con `rel="noopener noreferrer"`.

---

## D-08 · Los leads se avisan por mail

**2026-08-20**

**Contexto**: en la conversación se había decidido guardarlos solo en el panel. El Documento de Cierre, en cambio, preguntaba a qué mail debían llegar las consultas.

**Decisión**: se envía aviso por mail con Resend (plan gratuito), como preveía el acuerdo. **Si el envío falla, el lead ya quedó guardado.**

**Consecuencia**: elimina el riesgo R-06, que era el más severo del proyecto: en este negocio la velocidad de respuesta define la venta. Queda pendiente que la clienta confirme el mail de destino (acción A-05).

---

## D-09 · Los datos de propietarios nunca llegan al sitio público

**2026-08-20**

**Contexto**: el acuerdo incluye una entidad de propietarios con teléfono y mail. Son datos de contacto de terceros que no dieron consentimiento para publicarse.

**Decisión**: `owners` es estrictamente interna. Ningún endpoint público la devuelve y ningún dato suyo llega al HTML generado. Se eleva a requisito no funcional (RNF-10) y se verifica explícitamente en la auditoría final.

**Consecuencia**: el panel muestra un aviso visible en ese campo. La auditoría busca esos datos en todo el HTML generado y debe encontrar cero coincidencias.

---

## D-10 · Assets provisorios y reemplazables sin código

**2026-08-20**

**Contexto**: la clienta tiene pendientes el video del hero y su foto de perfil. Se revisó el material disponible en `~/Desktop/Musapp/REINA DEL REALESTATE/`:

- El `.mp4` es una pieza de Instagram Stories en formato vertical 9:16, con contenido sobre cambio climático. **No sirve** para un hero horizontal.
- El `.JPEG` es una foto personal de playa en Tulum, cuadrada, con una persona identificable en traje de baño en primer plano. **No sirve** como retrato profesional y su uso comercial es dudoso.

**Decisión**:

1. **Video del hero**: se usa material de stock gratuito de uso comercial libre (Pexels, Coverr) con tomas aéreas del Caribe, hasta que llegue el definitivo.
2. **Retrato de Laura**: **no se reemplaza por una imagen genérica.** La sección "Conóceme" se diseña para funcionar sin foto — tarjeta de texto con corona y claim — de modo que se vea intencional y no incompleta. La foto se suma cuando llegue.
3. Ambos assets viven en `site_settings` (`hero.video_url`, `nosotros.photo`): se reemplazan **desde el panel, sin tocar código ni redesplegar**.

**Consecuencia**: el proyecto puede avanzar y presentarse sin esperar material de la clienta. El hero siempre tiene imagen de respaldo, así que un video ausente o lento nunca deja la sección vacía.

**Por qué no un retrato genérico**: poner una modelo de stock en una sección titulada "Conóceme", junto a un texto en primera persona, es presentar a otra persona como si fuera la clienta. Si alguien lo detecta, daña la credibilidad de la marca.

---

## D-11 · Se suman galería y contenido editorial; el bilingüe queda afuera

**2026-08-21**

**Contexto**: la usuaria quiere que la clienta quede conforme, pero teme que los pedidos no terminen nunca. Preguntó si lo que ella pide desvía el proyecto. Se evaluó el costo real de los cuatro puntos que la decisión D-06 había dejado fuera.

**Análisis**:

| Punto                            | Costo         | Razón                                                                                                                                                                                                                                        |
| -------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Galería de fotos                 | **Bajo**      | La infraestructura de imágenes ya existe para la portada. Sumar la tabla y el visor es incremental. Además, un enlace a Drive es pobre para propiedades de lujo: saca al visitante del sitio hacia una carpeta con nombres de archivo crudos |
| Noticias administrables          | **Medio**     | Es un ABM más, pero reusa autenticación, panel, almacenamiento y publicación                                                                                                                                                                 |
| Publicar informes desde el panel | **Casi nulo** | Es la misma tabla `articles` con un campo que distingue el tipo. Sale gratis si se hace lo anterior                                                                                                                                          |
| Sitio bilingüe                   | **Alto**      | En código es abordable, pero obliga a la clienta a cargar cada propiedad y cada noticia dos veces, **de forma permanente**. Si abandona el inglés, el sitio queda a medias, que es peor que no tenerlo                                       |

**Decisión**: se suman **galería**, **noticias** e **informes administrables**. El **bilingüe queda fuera**.

**Consecuencia**: de 26 a 28 tareas; la estimación pasa de 8 a 9 o 10 sesiones. Vuelven al modelo `property_images` y `articles`. El informe Reyna Insights deja de ser página estática y pasa a ser un artículo destacado, editable. Se conserva el `drive_url`, ahora destinado al **video y material pesado**, no a las fotos.

**Sobre el control del alcance**: se dejó explícito que lo que frena los pedidos infinitos no es un alcance chico sino un alcance **cerrado por escrito**. La usuaria optó por un aviso escrito sin firma; el borrador quedó en `docs/aviso_alcance_clienta.md` y debe enviarse **antes de construir** (acción A-07).

---

## D-12 · Astro 7 en lugar de Astro 5, por seguridad

**2026-08-21 — durante IT-01**

**Contexto**: la planificación fijó Astro 5. Al instalarlo y correr la auditoría de dependencias, la versión 5.18.2 —la última de esa rama— arrastraba **12 vulnerabilidades**, entre ellas varios XSS del propio framework:

- XSS por nombre de slot sin escapar _(alta)_
- SSRF por cabecera Host en páginas de error prerenderizadas _(alta)_
- XSS en `define:vars` por saneo incompleto de `</script>` _(media)_
- XSS por nombres de atributo sin escapar en props extendidas _(media, con corrección incompleta de un CVE previo)_

Un framework que renderiza HTML con XSS conocidos es inaceptable en un proyecto cuya regla 3 es aplicar checklist de seguridad por tarea.

**Decisión**: actualizar a **Astro 7.2.4**, con `@astrojs/react` 6 y `@astrojs/netlify` 8. React 19 y Tailwind 4 se mantienen sin cambios.

**Además**: se fijó **`sharp` por `overrides` a ^0.35.3**. Las versiones 0.34.x heredan CVEs de libvips, y sharp va a procesar imágenes subidas desde el panel en IT-03 — entrada no confiable.

**Consecuencia**: las vulnerabilidades bajaron de **12 a 7**. Se verificó que el build sigue generando el sitio estático correctamente, que los tipos y el lint pasan limpios, y que la página renderiza igual.

**Riesgo residual aceptado**: las 7 restantes están en la cadena de herramientas de desarrollo de Netlify (`@netlify/dev`, `extract-zip`, `image-size`, `ipx`). **No corren en el sitio desplegado** — son el emulador local del Image CDN y del entorno de funciones. Para `image-size` y `extract-zip` no hay versión parcheada publicada, así que no hay acción disponible.

Se reverifica en **IT-10**, la auditoría de seguridad final. Si para entonces hay versiones corregidas, se aplican.

---

## D-13 · El límite de intentos vive en la base, no en memoria

**2026-08-21 — durante IT-04**

**Contexto**: `api_contracts.md` pide 5 intentos por IP cada 15 minutos. La forma habitual de contarlos es un mapa en memoria del proceso.

**Problema**: no funciona en este despliegue. Cada invocación de una Netlify Function puede correr en una instancia nueva, así que un contador en memoria se reiniciaría constantemente. El límite existiría en el código pero no frenaría a nadie — peor que no tenerlo, porque da una sensación falsa de protección.

**Decisión**: se agregó la tabla **`login_attempts`** (migración `0001`), que el modelo de datos no preveía. Guarda un **hash de la IP con sal**, no la dirección en claro: alcanza para contar intentos del mismo origen sin conservar un dato personal. Solo se registran los fallos.

**Detalles**: la ventana es deslizante — se libera cuando caduca el intento más viejo, no de golpe. Un acceso correcto limpia el historial de esa IP. Los registros vencidos se borran desde el propio login, en lugar de montar una tarea programada que sería otra pieza más para mantener.

**Desviación del diseño**: se agrega una tabla no prevista en `data_model.md`. Se documenta acá y el modelo queda actualizado.

---

## D-14 · La aparición al hacer scroll es CSS puro, sin JavaScript

**2026-08-21 — durante IT-05**

**Contexto**: `style_guide.md` pide que las secciones aparezcan al entrar en pantalla. La forma habitual es un `IntersectionObserver` que agrega una clase.

**Qué pasó**: se implementó así y al verificarlo el contenido quedaba invisible. La causa resultó ser que el navegador **congela el observador y las animaciones en pestañas en segundo plano** — comportamiento correcto y deliberado de los navegadores, no un error.

En un navegador de usuario real la pestaña está a la vista y esto no ocurriría. Pero dejó a la vista el modo de fallo: **una animación de entrada esconde contenido hasta que algo lo revela, y cualquier cosa que impida ese "algo" deja secciones invisibles**. Un script bloqueado por una extensión, un error de JavaScript, un navegador viejo.

**Decisión**: la animación se hace con **CSS puro**, usando `animation-timeline: view()` detrás de `@supports`.

- El contenido está **siempre visible por defecto**
- La animación se aplica solo donde el navegador la soporta de forma nativa
- Donde no hay soporte, no hay animación y no pasa nada
- `@media (prefers-reduced-motion: no-preference)` la desactiva entera para quien pidió menos movimiento

**Consecuencia**: se eliminó el componente `AparecerAlScroll.astro`. **La página no carga nada de JavaScript.** El efecto es idéntico donde hay soporte, y donde no lo hay el contenido simplemente se ve.

**El principio, para las próximas secciones**: ningún efecto decorativo debe poder esconder contenido. Si la animación falla, se ve el contenido sin animar — nunca al revés.

---

## D-15 · El logo real entra completo, pero solo con la corona rosa

**2026-08-22 — corrección posterior a UJ-05**

**Contexto**: hasta hoy el sitio usaba un logo provisorio que dibujé yo — una corona simplificada con la marca escrita al lado. La clienta tenía sus propios logos desde siempre; nunca habían llegado al proyecto.

**Qué llegó**: ocho variantes, todas del mismo lockup. Dos isotipos sueltos (corona rosa y corona turquesa) y seis combinaciones de corona × color de texto.

**El conflicto**: **el turquesa (`#81DCD2`) no existe en la paleta del sitio.** Curiosamente es el mismo tono que el verde de la marca (`#1E4F4C`), solo que muy aclarado — encaja de manera natural sobre la barra verde. Y había un segundo desajuste: el rosa del logo (`#FFA6BF`) es bastante más suave que el rosa del sitio (`#FB5696`), así que los dos rosas iban a convivir en la misma pantalla.

**Decisión de la usuaria**: **corona rosa en todas las superficies y la paleta intacta.** El turquesa queda archivado, sin usar.

**Consecuencia sobre el isotipo**: la corona dibujada a mano se reemplazó por la real, **vectorizada del PNG original** en vez de incrustada como imagen. Tres razones:

1. Sigue pintándose con `currentColor`, así que hereda el `#FB5696` de la paleta en lugar de arrastrar el degradé del archivo. Eso es exactamente lo que se pidió: la forma real, el color del sitio.
2. Se mantiene nítida a cualquier tamaño — aparece entre 20 y 64 px.
3. Pesa 2 KB y no suma un pedido más al servidor.

Los lockups sí van como imagen: son corona **más** tipografía, y la tipografía del logo no está entre las fuentes del sitio.

**Lo que queda sin usar**: las cinco variantes restantes viven en `design/marca/` con nombres que describen su contenido. Si algún día se decide sumar el turquesa, están ahí y el script las convierte.

**Regla para adelante**: los originales de la marca son irreemplazables y ahora viven **dentro del repositorio**, no en una carpeta suelta del escritorio. Todo lo que está en `frontend/public/logos/` es derivado: se regenera con `node design/marca/generar-assets.mjs`. Nadie debería editar esos archivos a mano.

---

## D-16 · El formulario de consulta funciona sin JavaScript

**2026-08-22 — durante UJ-06**

**Contexto**: lo habitual es un formulario que se envía con `fetch` y muestra el agradecimiento sin recargar. Si el script no carga, no pasa nada al apretar el botón.

**Por qué acá no alcanza**: el formulario **es** la conversión del sitio. Que dependa de que un archivo cargue significa aceptar que, algunos días, no entre ningún contacto y nadie se entere. No hay error visible, no hay registro, no hay síntoma: solo silencio. Es el modo de fallo más caro que puede tener este proyecto.

**Decisión**: es un formulario de verdad, con `action` y `method`.

- Sin JavaScript se envía solo y el servidor responde **303 a `/gracias`**
- Con JavaScript se envía sin recargar y los errores salen al lado de cada campo
- El endpoint distingue por el tipo de contenido: quien manda JSON recibe JSON, quien manda un formulario recibe una redirección

**Consecuencia**: existe `/gracias`, que con el script nadie ve nunca. Es el precio de que el camino sin script termine en algo con sentido y no en un JSON en pantalla.

Es el mismo principio de D-14 aplicado a la captación: ninguna mejora puede esconder lo que ya funcionaba.

---

## D-17 · La lógica de la consulta vive fuera del endpoint

**2026-08-22 — durante UJ-06**

**Contexto**: lo natural era escribir todo dentro de `frontend/src/pages/api/leads.ts`.

**El problema**: los caminos que hay que sostener con pruebas son justo los que no ocurren nunca en una demostración — el correo caído, el robot, el sexto envío en diez minutos. Con la base y el correo tomados de adentro, ninguno de esos casos se puede provocar sin simular a medias o depender de que Resend responda.

**Decisión**: `procesarConsulta` vive en `backend/lib/consultas.ts` y **recibe la base y el correo como parámetros**. El endpoint quedó como adaptador: lee el cuerpo, delega y traduce el resultado a una respuesta HTTP.

**Consecuencia**: 21 pruebas que corren contra un Postgres de verdad (PGlite) con las migraciones reales aplicadas, y contra correos falsos que devuelven error o revientan a pedido. La primera corrida falló por una restricción `NOT NULL` que una base simulada habría dejado pasar.

**El criterio, para los próximos endpoints**: si un camino solo se puede probar simulándolo, la dependencia va por parámetro.

---

## D-18 · El límite por IP se separa por ámbito

**2026-08-22 — durante UJ-06**

**Contexto**: D-13 creó `login_attempts` para frenar los intentos de acceso al panel. El formulario de consulta necesita lo mismo, con otros números: 5 envíos cada 10 minutos.

**Por qué no se reusó tal cual**: los dos usos **cuentan distinto**. En el acceso solo se anotan los fallos y un acierto borra el historial; en las consultas se anota cada envío. Compartir el contador habría dejado que un visitante que consulta cinco veces se quede sin intentos de acceso al panel, o al revés.

**Decisión**: una columna `scope` separa los dos usos, y las funciones reciben el ámbito y el límite como parámetros.

**Desviación**: la tabla **sigue llamándose `login_attempts`**, que ya no describe lo que guarda. Renombrarla exige que `drizzle-kit` pregunte si es un renombre o un borrar-y-crear, y esa pregunta necesita una terminal interactiva que en esta sesión no hay. Se intentó, colgó, se revirtió.

El nombre del código (`rateLimitHits`) sí dice lo que la tabla es hoy, y en `schema.ts` está anotado por qué difieren. Si alguna vez se corre `drizzle-kit generate` desde una terminal de verdad, vale renombrarla: los datos duran quince minutos, así que no hay nada que preservar.

---

## D-19 · Lo que necesita el navegador no comparte archivo con lo que solo corre en el servidor

**2026-09-06 — durante el primer despliegue**

**Qué pasó**: el primer despliegue a Netlify dejó el panel devolviendo 500. En los registros: `Could not load the "sharp" module using the linux-x64 runtime`.

**La causa inmediata** era que el despliegue se hizo construyendo en una Mac, así que subió el binario de macOS de `sharp` a un servidor Linux.

**La causa de fondo era otra, y peor**: `frontend/src/lib/datos.ts` importaba `ANCHOS` y `anchosPara` desde `backend/lib/images.ts`. Son dos funciones de aritmética pura sobre un número — pero vivían en el mismo archivo que el procesador de imágenes, así que importarlas **arrastraba `sharp` entero a todas las páginas del sitio**.

Una librería nativa de procesamiento de imágenes terminaba en el paquete de páginas que solo querían calcular anchos para un `srcset`.

**Decisión**: los anchos viven en `backend/lib/anchosImagen.ts`, **sin ninguna dependencia**. `images.ts` los importa y los reexporta para quien ya los pedía de ahí.

**Consecuencia comprobada**: en el paquete construido, el módulo con `sharp` ahora lo importan únicamente `cover.ts` e `images.ts` — los dos endpoints de subida, que sí lo necesitan. Ninguna pantalla del panel ni del sitio lo toca.

**La regla que deja**: antes de importar algo de `backend/lib` desde el frontend, mirar qué arrastra ese archivo. Un `import` de dos funciones puede traer una librería nativa entera, y eso no se nota hasta que el servidor de producción es de otro sistema operativo que el de desarrollo.

> El despliegue local seguirá subiendo binarios de macOS. Se resuelve construyendo del lado de Netlify, con el repositorio conectado.
