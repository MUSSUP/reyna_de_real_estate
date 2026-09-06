# Imagen de la aplicación.
#
# El despliegue de producción va a Netlify, que construye el sitio por su
# cuenta. Esta imagen existe para levantar el proyecto entero sin depender de
# ningún servicio en la nube (RNF-07), y para poder mudarse a un VPS propio
# el día que haga falta.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# No corre como root: si alguien lograra ejecutar algo dentro del contenedor,
# no tendría permisos de administrador.
RUN addgroup -g 1001 -S nodejs && adduser -S astro -u 1001
COPY --from=build --chown=astro:nodejs /app/dist ./dist
COPY --from=build --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=astro:nodejs /app/package.json ./
USER astro

EXPOSE 4321
ENV HOST=0.0.0.0 PORT=4321
CMD ["node", "./dist/server/entry.mjs"]
