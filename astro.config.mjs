// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Publicado en Vercel. Si algún día hay dominio propio, cambiarlo acá.
export default defineConfig({
  site: 'https://bautista-marinelli.vercel.app',
  integrations: [react(), mdx(), sitemap()],
  prefetch: true,
  // secciones que cambiaron de nombre: los links viejos siguen funcionando
  redirects: {
    '/cosas-aburridas': '/trabajo',
    // viajes, movimiento y notas ahora son todos posts del blog
    '/bitacora': '/blog',
    '/viajes': '/blog',
    '/movimiento': '/blog',
    '/sobre-mi': '/',
    '/work': '/en/work',
  },
});
