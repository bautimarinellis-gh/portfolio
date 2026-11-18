// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// TODO: cuando elijamos dónde desplegar, cambiar `site` por el dominio real.
export default defineConfig({
  site: 'https://bautimarinellis-gh.github.io',
  integrations: [react(), mdx(), sitemap()],
  prefetch: true,
});
