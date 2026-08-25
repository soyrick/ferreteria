/* Sirve la curaduría guardada para que lo que el panel edita se vea en la
   tienda sin reconstruir el sitio.

   La home sigue siendo estática — no la pasamos a servidor por esto. Las
   grillas de productos ya se pintaban en el cliente, así que cambiarles la
   fuente de datos no empeora nada: solo deja de estar congelada al momento
   de compilar. El render en servidor de los productos llega en F6, junto con
   las páginas de categoría y el dato estructurado. */
export const prerender = false;

import { vitrinas } from '../../datos/curaduria.js';

export async function GET() {
  try {
    const datos = await vitrinas();
    return new Response(JSON.stringify(datos), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // 60 s en la CDN y hasta 5 min sirviendo lo viejo mientras revalida:
        // una edición tarda a lo sumo un minuto en verse, y las visitas no
        // pegan al almacén en cada carga.
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (e) {
    console.error('[api/vitrinas] falló:', e.message);
    return new Response(JSON.stringify({ error: 'no disponible' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
