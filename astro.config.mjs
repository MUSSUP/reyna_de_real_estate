// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// El sitio público se genera estático (decisión D-04): las visitas no consultan
// la base. Solo el panel admin y el envío de formularios llegan al servidor.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://reynaderealestate.com',
  srcDir: './frontend/src',
  publicDir: './frontend/public',
  outDir: './dist',
  output: 'static',
  adapter: netlify(),
  integrations: [react()],
  // Solo afecta a `astro dev` y `astro preview`, nunca al sitio construido.
  //
  // Sin `host`, el servidor queda escuchando únicamente en IPv6 (`[::1]`).
  // En este equipo `/etc/hosts` resuelve `localhost` primero a 127.0.0.1, así
  // que el navegador intenta por IPv4, no encuentra a nadie y muestra un error
  // de conexión — con el servidor perfectamente levantado.
  //
  // Fijarlo en la interfaz de bucle IPv4 hace que `localhost` funcione y, a la
  // vez, **no expone el servidor a la red local**: la base y las credenciales
  // de desarrollo quedan donde tienen que quedar.
  server: {
    host: '127.0.0.1',
    port: 4321,
  },

  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Las imágenes remotas vienen del bucket de storage
    remotePatterns: [{ protocol: 'https' }],
  },
});
