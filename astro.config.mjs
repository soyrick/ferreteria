// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// La tienda sigue estática (SEO y velocidad). Solo /admin se renderiza en el
// servidor, declarándolo con `export const prerender = false` en esas páginas.
export default defineConfig({
  site: 'https://casaherramientas.vercel.app',
  output: 'static',
  adapter: vercel(),
});
