# Reyna de Real Estate

Sitio de captación para **Laura Cabral**, broker de propiedades de lujo en Riviera Maya.
Marca: **Reyna de Real Estate** · Dominio: `reynaderealestate.com`

---

## Cómo levantarlo

```bash
npm install
cp .env.example .env    # completá los valores
npm run dev             # http://localhost:4321
```

> `.env` nunca se versiona. `.env.example` sí, y va siempre sin valores reales.

### Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm run check` | Verifica tipos de Astro y TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Cómo está armado

**El sitio público es estático.** Se genera en el build; las visitas no consultan la base de datos. Cuando la administradora publica un cambio, un webhook regenera el sitio. La única excepción es el formulario de contacto, que escribe directo.

Esto resuelve de una vez rendimiento, SEO, costo y el hecho de que la base gratuita se pausa por inactividad.

```
frontend/src/
  pages/         Rutas públicas y del panel
  components/    public/ · admin/
  layouts/       Base.astro
  i18n/          Textos de interfaz (es.json) y pickLocale()
  styles/        global.css con los tokens de marca
  lib/

backend/
  functions/     Netlify Functions
  db/            Esquema Drizzle, migraciones, semilla
  lib/           auth · validation · storage · mailer · rateLimit

deployment/      Docker y configuración de Netlify
design/          Documentos de diseño y referencias visuales
```

**Stack**: Astro 5 · React 19 (islas) · Tailwind 4 · Netlify Functions · Postgres con Drizzle · almacenamiento S3-compatible

---

## Antes de tocar código

Leé `design/design_summary.md`. Es la referencia compacta del proyecto: entidades, patrones, marca y credenciales.

Para el detalle, `design/data_model.md` y `design/api_contracts.md`.
Las decisiones y su porqué están en `docs/decision_log.md`.

---

## Tres reglas que no se rompen

1. **Ningún secreto en el código.** Todo por variables de entorno.
2. **Los datos de propietarios nunca llegan al sitio público.** Son datos de contacto de terceros.
3. **Si el aviso por mail de una consulta falla, la consulta ya quedó guardada.** Nunca se pierde un lead.
