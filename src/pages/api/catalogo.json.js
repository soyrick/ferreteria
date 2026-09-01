/* Proxy del catálogo.

   Esta ruta existe por una sola razón: que el token no llegue al navegador.
   La API de kafe lo lleva dentro de la URL y tiene CORS abierto, así que
   invita a llamarla desde el cliente — pero eso publicaría la credencial en
   el JavaScript que servimos, y con ella cualquiera se lleva la lista de
   precios completa. Acá la URL se queda del lado del servidor.

   Solo se dejan pasar los parámetros que la tienda necesita: lo que no está
   en esta lista no viaja. */
export const prerender = false;

import { productos, apiLista } from '../../datos/api.js';

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
    return json(datos, 200, 'public, max-age=0, s-maxage=120, stale-while-revalidate=600');
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
