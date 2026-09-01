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

/* Texto → trozo de URL. El rango de tildes va con \u escapado: el literal se
   corrompe al guardarse. */
const TILDES = new RegExp('[\\u0300-\\u036f]', 'g');
export const ranura = (texto) =>
  String(texto ?? '').toLowerCase().normalize('NFD').replace(TILDES, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Dirección de la ficha: nombre para la gente, código para el sistema.

   El código va al final y es el que manda. Si el negocio le cambia el nombre al
   producto, el enlace viejo sigue llevando al lugar correcto —la página
   redirige al nombre nuevo— en vez de romperse. Y quien pega el enlace en un
   grupo de WhatsApp manda algo que se entiende sin abrirlo.

   Se arma en un solo lugar porque la usan las tarjetas, el buscador, el panel,
   la canónica de la ficha y el sitemap: si cada uno la escribiera a su modo,
   Google vería el mismo producto en cinco direcciones distintas. */
const TOPE_RANURA = 60;   // URLs cortas: lo que sigue no aporta nada

export function urlProducto(p) {
  const codigo = p.codigo ?? p.id;
  const nombre = ranura(p.nombre ?? p.n).slice(0, TOPE_RANURA).replace(/-$/, '');
  return nombre
    ? `/producto/${nombre}/${encodeURIComponent(codigo)}`
    : `/producto/${encodeURIComponent(codigo)}`;
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
  url: urlProducto(p),
});
