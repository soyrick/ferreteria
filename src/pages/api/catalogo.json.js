/* Proxy del catálogo.

   Esta ruta existe por una sola razón: que el token no llegue al navegador.
   La API de kafe lo lleva dentro de la URL y tiene CORS abierto, así que
   invita a llamarla desde el cliente — pero eso publicaría la credencial en
   el JavaScript que servimos, y con ella cualquiera se lleva la lista de
   precios completa. Acá la URL se queda del lado del servidor.

   Solo se dejan pasar los parámetros que la tienda necesita: lo que no está
   en esta lista no viaja. */
export const prerender = false;

import { productos, producto, apiLista, urlProducto } from '../../datos/api.js';

/* La dirección de la ficha se calcula acá y no en el navegador: es la misma
   que usan el sitemap y la canónica de la página, y tiene que salir del mismo
   lugar o Google terminaría viendo variantes del mismo producto. */
const conUrl = (p) => ({ ...p, url: urlProducto(p) });

const json = (cuerpo, status, cache) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
    },
  });

export async function GET({ url }) {
  if (!apiLista()) {
    return json({ error: 'catálogo no configurado' }, 503, 'no-store');
  }

  const q = url.searchParams;

  try {
    /* Un solo producto por código: lo usa el panel de la ficha, que abre sin
       recargar. Va acá y no en una ruta aparte porque es la misma fuente, el
       mismo caché y la misma razón de existir: que el token no salga de acá. */
    const codigo = q.get('codigo');
    if (codigo) {
      const p = await producto(codigo);
      if (!p) return json({ error: 'no existe' }, 404, 'no-store');
      return json({ producto: conUrl(p) }, 200, 'public, max-age=0, s-maxage=120, stale-while-revalidate=600');
    }

    const datos = await productos({
      q: q.get('q'),
      categoria: q.get('categoria'),
      marca: q.get('marca'),
      destacados: q.get('destacados') === 'true',
      limit: q.get('limit'),
      offset: q.get('offset'),
    });

    /* Dos minutos de caché compartido. El proveedor pide no guardar precios
       más de unos minutos, y esto además hace que mil visitas cuesten una sola
       petición: el límite de 120 por minuto es por IP, y detrás del proxy
       todas comparten la de Vercel. */
    return json(
      { ...datos, productos: datos.productos.map(conUrl) },
      200,
      'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
    );
  } catch (e) {
    console.error('[api/catalogo] falló:', e.message);
    const limite = e.codigo === 429;
    return json(
      { error: limite ? 'demasiadas consultas' : 'catálogo no disponible' },
      limite ? 429 : 502,
      'no-store',
    );
  }
}
