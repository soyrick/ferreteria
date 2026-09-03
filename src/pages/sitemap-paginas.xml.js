/* Las páginas fijas y las categorías. Una sola petición a la API: los rubros
   vienen en el resumen, que ya trae el total de cada uno. */
export const prerender = false;

import { resumen, apiLista, ranura } from '../datos/api.js';
import { escapar, xml } from '../lib/sitemap.js';

export async function GET({ site, url }) {
  const base = (site ?? new URL(url).origin).toString().replace(/\/$/, '');

  const rutas = ['/'];

  if (apiLista()) {
    try {
      const { categorias } = await resumen();
      // Cada rubro tiene su página desde F4; antes eran anclas de la home, que
      // Google no indexa por separado.
      rutas.push(...categorias.map((c) => `/categoria/${ranura(c.nombre)}`));
    } catch (e) {
      console.error('[sitemap-paginas] sin categorías:', e.message);
    }
  }

  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${escapar(base + r)}</loc></url>`).join('\n')}
</urlset>`);
}
