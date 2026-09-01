/* Cliente del catálogo de kafe.agency.

   SOLO SERVIDOR. La URL lleva el token adentro, así que este módulo no puede
   importarse desde nada que termine en el navegador: quien abriera el código
   fuente se llevaría la credencial y con ella el catálogo entero. La tienda
   pide por /api/catalogo, que corre en Vercel y no expone la URL.

   La API devuelve 8.437 productos con precios que cambian durante el día, así
   que acá no se guarda nada: el caché vive en la CDN, donde una sola respuesta
   sirve a todas las visitas. Eso también protege el límite de 120 peticiones
   por minuto, que se cuenta por IP y con proxy lo comparten todos. */

const BASE = (import.meta.env?.CATALOGO_URL || process.env.CATALOGO_URL || '').replace(/\/$/, '');

/** ¿Está configurada la URL del catálogo? */
export const apiLista = () => Boolean(BASE);

const TIEMPO_LIMITE = 8000;   // la home no puede quedar colgada esperando

async function pedir(ruta, params = {}) {
  if (!BASE) throw new Error('Falta CATALOGO_URL en el entorno');

  const url = new URL(BASE + ruta);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const r = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_LIMITE) });

  // 429 es límite de peticiones, no un fallo nuestro: se distingue para poder
  // responder distinto (reintentar tiene sentido; ante un 404 no).
  if (r.status === 429) throw Object.assign(new Error('Límite de peticiones'), { codigo: 429 });
  if (!r.ok) throw Object.assign(new Error(`La API respondió ${r.status}`), { codigo: r.status });

  return r.json();
}

/** Resumen: nombre del negocio, total, y las categorías y marcas reales. */
export const resumen = () => pedir('');

/** Listado con búsqueda, filtros y paginación. Devuelve { productos, total, limit, offset }. */
export function productos({ q, categoria, marca, destacados, limit = 24, offset = 0 } = {}) {
  return pedir('/productos', {
    q, categoria, marca,
    destacados: destacados ? 'true' : undefined,
    limit: Math.min(Math.max(Number(limit) || 24, 1), 100),   // la API rechaza fuera de 1..100
    offset: Math.max(Number(offset) || 0, 0),
  });
}

/** Un producto por su código. Devuelve null si no existe. */
export async function producto(codigo) {
  try {
    const { producto: p } = await pedir(`/productos/${encodeURIComponent(codigo)}`);
    return p ?? null;
  } catch (e) {
    if (e.codigo === 404) return null;
    throw e;
  }
}

/* La tienda pinta con la forma del catálogo viejo (n, m, p, img…). Traducir acá
   y no en cada pantalla deja un solo lugar que tocar si la API cambia.
   ponytail: `img` queda vacío hasta que el negocio cargue fotos — hoy la API
   devuelve `imagenes: []` en todo el catálogo. La tarjeta ya reserva el hueco. */
export const normalizar = (p) => ({
  id: p.codigo,
  n: p.nombre,
  m: p.marca ?? '',
  p: p.precio,
  cat: p.categoria,
  img: p.imagenes?.[0]?.url ?? '',
  disponible: p.disponible,
});
