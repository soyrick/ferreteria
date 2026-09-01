/* Un tramo de productos del sitemap.

   Cada archivo cubre 1.000 productos, que son 10 peticiones a la API en tandas
   de cuatro. Google los pide de a uno y espaciados, así que la carga nunca se
   junta: es lo contrario de recorrer las 85 páginas en una sola respuesta, que
   fue lo que nos hizo bloquear.

   Solo entran los productos que se pueden vender. Un agotado o sin precio es
   una ficha sin nada que ofrecer, y ofrecerle miles a Google arrastra hacia
   abajo al resto del sitio. La página existe igual y lleva `noindex`: si el
   producto vuelve, entra al sitemap solo. */
export const prerender = false;

import { productos, apiLista, urlProducto } from '../datos/api.js';
import { POR_SITEMAP, POR_PETICION, escapar, xml, enTandas } from '../lib/sitemap.js';

export async function GET({ params, site, url }) {
  const tramo = Number(params.tramo);
  if (!Number.isInteger(tramo) || tramo < 1) return new Response(null, { status: 404 });
  if (!apiLista()) return new Response(null, { status: 503 });

  const base = (site ?? new URL(url).origin).toString().replace(/\/$/, '');
  const desde = (tramo - 1) * POR_SITEMAP;

  try {
    const tareas = Array.from({ length: POR_SITEMAP / POR_PETICION }, (_, i) => () =>
      productos({ limit: POR_PETICION, offset: desde + i * POR_PETICION }));

    const tandas = await enTandas(tareas);
    const vendibles = tandas
      .flatMap((t) => t.productos)
      .filter((p) => p.disponible && p.precio > 0);

    // Un tramo más allá del final del catálogo no existe.
    if (!tandas[0]?.productos.length) return new Response(null, { status: 404 });

    return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${vendibles.map((p) => `  <url><loc>${escapar(base + urlProducto(p))}</loc></url>`).join('\n')}
</urlset>`);
  } catch (e) {
    console.error('[sitemap-productos] falló:', e.message);
    return new Response(null, { status: 503 });
  }
}
