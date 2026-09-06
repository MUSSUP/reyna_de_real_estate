# Entorno local sin servicios en la nube

Sirve para trabajar sin internet, para no tocar los datos reales de Supabase, y
como plan B si hay que mudarse a un VPS propio.

## Levantarlo

```bash
docker compose up -d
```

Deja andando:

| Servicio | Dónde | Para qué |
|----------|-------|----------|
| Postgres | `localhost:5432` | Base de datos |
| MinIO | `localhost:9000` | Almacenamiento compatible con S3 |
| Panel de MinIO | `localhost:9001` | Ver los archivos subidos |

El bucket `reyna-media` se crea solo la primera vez, con lectura pública, igual
que en Supabase.

## Apuntar el proyecto al entorno local

En `.env`, reemplazá estas cinco líneas:

```
DATABASE_URL=postgresql://reyna:reyna_local@localhost:5432/reyna
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=reyna_local
STORAGE_SECRET_KEY=reyna_local_secret
STORAGE_PUBLIC_URL=http://localhost:9000/reyna-media
```

> Guardá tus valores de Supabase antes de reemplazarlos.

Después:

```bash
npm run db:migrate
npm run seed -- --limpiar
npm run dev
```

## Apagarlo

```bash
docker compose down
```

Los datos sobreviven. Para borrarlos también: `docker compose down -v`.

## Por qué existe esto

El proyecto vive en Supabase y Netlify, ambos en plan gratuito. Este entorno
garantiza que **nada quede atado a esos proveedores**: si mañana cambian sus
condiciones, o la clienta quiere su propia infraestructura, el mismo proyecto
levanta en cualquier servidor con Docker.
