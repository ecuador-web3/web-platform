// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ecuadorweb3.org', // Dominio temporal para generar sitemap y canonicals
  integrations: [sitemap()],
  image: {
    /* Event cover art lives on Luma's CDN, which serves the originals at up to
       1254px and 2 MB and ignores every resize parameter it is asked for.
       Authorising the host lets the build download and re-encode them into the
       site's own assets, so visitors get a few KB of WebP from this origin
       rather than megabytes from someone else's. */
    domains: ['images.lumacdn.com'],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
