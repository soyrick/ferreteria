/* Piezas compartidas de los sitemaps. */

/** Productos por archivo. 1.000 son 10 peticiones a la API por tramo. */
export const POR_SITEMAP = 1000;

/** Cuántos trae cada petición. Es el máximo que acepta la API. */
export const POR_PETICION = 100;

/* Peticiones simultáneas. Cuatro y no ocho: acá cada una arrastra 100
   productos, mucho más pesadas que las de las vitrinas, y el objetivo es no
   volver a chocar contra el límite de 120 por minuto. */
export const A_LA_VEZ = 4;

/* Un día de caché. El sitemap no lleva precios —solo direcciones—, así que no
   le aplica el "no lo caches más de unos minutos" del proveedor: lo que cambia
   a diario es qué productos hay, no cuánto valen. Con esto, cada tramo se
   arma una vez al día en vez de en cada visita del robot. */
export const CACHE_SITEMAP = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';

/** Los cinco caracteres que XML no admite sueltos dentro de una URL. */
export const escapar = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const xml = (cuerpo, status = 200) =>
  new Response(cuerpo, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': CACHE_SITEMAP,
    },
  });

/** Ejecuta las tareas de a A_LA_VEZ, para no saturar la API. */
export async function enTandas(tareas) {
  const salida = [];
  for (let i = 0; i < tareas.length; i += A_LA_VEZ) {
    salida.push(...await Promise.all(tareas.slice(i, i + A_LA_VEZ).map((t) => t())));
  }
  return salida;
}
