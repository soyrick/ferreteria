/* Índice de sitemaps.

   Google no descubre los productos navegando la tienda: las tarjetas las pinta
   el JavaScript, así que en el HTML de la home no hay un solo enlace a un
   producto. Sin esta lista, indexar 8.437 fichas quedaría a merced de que el
   robot ejecute scripts, que lo hace tarde y sin garantías.

   Va partido en varios archivos por una razón concreta: recorrer el catálogo
   entero son 85 peticiones a la API (8.437 productos, 100 por página), y el
   límite es de 120 por minuto por IP. Dispararlas todas en una sola respuesta
   nos hizo bloquear una vez. Partido, Google pide un tramo por vez y cada uno
   cuesta 10 peticiones. */
export const prerender = false;

import { resumen, apiLista } from '../datos/api.js';
import { POR_SITEMAP, CACHE_SITEMAP, xml } from '../lib/sitemap.js';

export async function GET({ site, url }) {
  const base = (site ?? new URL(url).origin).toString().replace(/\/$/, '');

  let paginas = 0;
  if (apiLista()) {
    try {
      const { totalProductos } = await resumen();
      paginas = Math.ceil(totalProductos / POR_SITEMAP);
    } catch (e) {
      // Sin la API igual se publica el sitemap de las páginas fijas.
      console.error('[sitemap] no pude contar los productos:', e.message);
    }
  }

  const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${base}/sitemap-paginas.xml</loc></sitemap>
${Array.from({ length: paginas }, (_, i) =>
  `  <sitemap><loc>${base}/sitemap-productos-${i + 1}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>`;

  return xml(cuerpo);
}
