/* Curaduría: qué producto va en qué vitrina de la página principal.
   Esto es lo único que el panel edita. El nombre, el precio y la foto los va
   a mandar la API de productos (F6); si el panel también los editara, habría
   dos fuentes de verdad peleando por el mismo dato.

   Se guarda en Vercel Blob, no en Global Config: escribir en Global Config
   exige un token de la API REST de Vercel, con permisos sobre toda la cuenta.
   Blob usa credenciales OIDC de corta duración acotadas al store, así que si
   alguien entra al panel se lleva la curaduría y nada más. El documento pesa
   1,4 KB — no necesita una base de datos, necesita dónde escribirse. */

import { put, get } from '@vercel/blob';
import { CATEGORIAS, ESTRELLAS, POR_ID, idDe } from './catalogo.js';

const RUTA = 'curaduria.json';

/** Cupos de la rejilla de "Lo más vendido". */
export const CUPOS_SEMANA = 10;

/* El token hay que buscarlo en los dos lados y pasarlo explícito.
   Astro carga el .env en import.meta.env, NO en process.env — y el SDK de Blob
   lee process.env por dentro. Sin esto, en local el panel diría "solo memoria"
   aunque el token esté bien puesto, y la causa no se vería por ningún lado.
   En Vercel sí existe process.env, así que se prueban los dos. */
const ENV = import.meta.env ?? {};   // undefined fuera de Vite; no explotar por eso
const TOKEN = ENV.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || '';
const STORE = ENV.BLOB_STORE_ID || process.env.BLOB_STORE_ID || '';

/** Opciones comunes: si tenemos token, va explícito. */
const auth = TOKEN ? { token: TOKEN } : {};

/* Tener credenciales configuradas no es lo mismo que que funcionen: puede
   haber un BLOB_STORE_ID sin token usable. En vez de adivinar, se prueba —
   y si la primera operación falla, se marca y el panel lo dice. */
let almacenFalla = false;
const hayCredenciales = () => Boolean(TOKEN || STORE);

/** true solo si hay credenciales Y no nos ha rebotado el almacén. */
export const almacenListo = () => hayCredenciales() && !almacenFalla;

/** Selección de arranque: la que la página muestra hoy. */
function inicial() {
  return {
    destacados: Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.productos.map(idDe)])),
    semana: ESTRELLAS.slice(0, CUPOS_SEMANA).map(idDe),   // la semilla respeta el tope
    /* Ofertas de arranque, explicitas y no deducidas del catalogo: el precio
       de lista es del producto, la rebaja es una decision de la tienda.
       Todas indefinidas hasta que el admin les ponga fecha. */
    ofertas: [
      { id: 'coleto-microfibra', precio: 6.90, vence: '' },
      { id: 'carretilla-obra', precio: 62.00, vence: '' },
      { id: 'taladro-percutor', precio: 58.00, vence: '' },
      { id: 'griferia-lavamanos', precio: 28.00, vence: '' },
      { id: 'cable-thw', precio: 48.00, vence: '' },
      { id: 'set-destornilladores', precio: 16.90, vence: '' },
      { id: 'llaves-combinadas', precio: 34.00, vence: '' },
      { id: 'pintura-caucho', precio: 18.50, vence: '' },
      { id: 'multimetro-digital', precio: 17.80, vence: '' },
      { id: 'esmeril-angular', precio: 46.50, vence: '' },
    ],
  };
}

/* Respaldo en memoria. Sirve en desarrollo; en Vercel cada invocación arranca
   limpia, así que sin Blob configurado el panel no guarda nada de verdad. */
let enMemoria = inicial();

export async function leer() {
  if (!almacenListo()) return enMemoria;   // sin almacén usable, memoria
  try {
    // useCache: false — al volver de guardar hay que ver lo recién escrito.
    const r = await get(RUTA, { access: 'private', useCache: false, ...auth });
    if (!r) return inicial();
    const texto = typeof r.text === 'function' ? await r.text() : await new Response(r.stream).text();
    return { ...inicial(), ...JSON.parse(texto) };
  } catch (e) {
    // La página no se cae: se marca el almacén como caído y se sigue en memoria.
    almacenFalla = true;
    console.error('[curaduria] almacén no disponible, usando memoria:', e.message);
    return enMemoria;
  }
}

/** Valida y guarda. Devuelve los errores encontrados; vacío si salió bien. */
export async function guardar(cambios) {
  const actual = await leer();
  const nuevo = { ...actual, ...cambios };
  const errores = validar(nuevo);
  if (errores.length) return errores;

  if (!almacenListo()) {
    enMemoria = nuevo;
    return [];
  }

  try {
    await put(RUTA, JSON.stringify(nuevo), {
      ...auth,
      access: 'private',
      addRandomSuffix: false,   // siempre el mismo archivo
      allowOverwrite: true,     // sin esto, el segundo guardado tira error
      contentType: 'application/json',
    });
    return [];
  } catch (e) {
    almacenFalla = true;
    enMemoria = nuevo;   // no perder lo que la persona acaba de editar
    console.error('[curaduria] no se pudo guardar:', e.message);
    return ['No se pudo guardar en el almacén; el cambio quedó solo en memoria. Revisá la configuración de Vercel Blob.'];
  }
}

function validar(doc) {
  const errores = [];
  const existe = (id) => POR_ID.has(id);

  for (const [cat, ids] of Object.entries(doc.destacados ?? {})) {
    if (!CATEGORIAS.some((c) => c.id === cat)) errores.push(`Categoría desconocida: ${cat}`);
    ids.filter((id) => !existe(id)).forEach((id) => errores.push(`Producto desconocido: ${id}`));
  }
  (doc.semana ?? []).filter((id) => !existe(id)).forEach((id) => errores.push(`Producto desconocido: ${id}`));
  for (const o of doc.ofertas ?? []) {
    if (!existe(o.id)) { errores.push(`Producto desconocido: ${o.id}`); continue; }
    const base = POR_ID.get(o.id);
    if (!(o.precio > 0)) errores.push(`Precio inválido en ${base.n}`);
    else if (o.precio >= base.p) errores.push(`La oferta de ${base.n} (lista $${base.p.toFixed(2)}) no baja el precio`);
  }
  return errores;
}

/** ¿La oferta sigue viva?
    Sin fecha = indefinida: dura hasta que el admin la saque.
    Con fecha, vale todo ese día completo; se apaga sola al día siguiente. */
export function ofertaVigente(oferta, ahora = new Date()) {
  if (!oferta?.vence) return true;
  const fin = new Date(`${oferta.vence}T23:59:59`);
  return !Number.isNaN(fin.getTime()) && fin >= ahora;
}

/* Acciones de un solo producto, las del menú "⋯".
   Devuelven un texto para mostrarle a la persona, o null si no hubo cambio. */
export async function accionProducto(accion, id) {
  const p = POR_ID.get(id);
  if (!p) return { error: 'Ese producto no existe.' };
  const s = await leer();

  if (accion === 'a-estrella') {
    if (s.semana.includes(id)) return { aviso: `${p.n} ya estaba en Productos estrella.` };
    if (s.semana.length >= CUPOS_SEMANA) {
      return { error: `Productos estrella está lleno (${CUPOS_SEMANA}). Quitá uno antes de agregar otro.` };
    }
    const errores = await guardar({ semana: [...s.semana, id] });
    return errores.length ? { error: errores[0] } : { ok: `${p.n} pasó a Productos estrella.` };
  }

  if (accion === 'a-oferta') {
    if (s.ofertas.some((o) => o.id === id)) return { aviso: `${p.n} ya estaba en oferta.` };
    // Precio inicial: 10 % menos que el de lista. Se ajusta en la pantalla de Ofertas.
    const precio = Math.round(p.p * 0.9 * 100) / 100;
    const errores = await guardar({ ofertas: [...s.ofertas, { id, precio, vence: '' }] });
    return errores.length ? { error: errores[0] } : { ok: `${p.n} pasó a Ofertas con 10 % de descuento. Ajustá el precio si hace falta.` };
  }

  if (accion === 'quitar-estrella') {
    const errores = await guardar({ semana: s.semana.filter((x) => x !== id) });
    return errores.length ? { error: errores[0] } : { ok: `${p.n} salió de Productos estrella.` };
  }

  if (accion === 'quitar-oferta') {
    const errores = await guardar({ ofertas: s.ofertas.filter((o) => o.id !== id) });
    return errores.length ? { error: errores[0] } : { ok: `${p.n} salió de Ofertas.` };
  }

  return { error: 'Acción desconocida.' };
}

/** Las vitrinas ya resueltas a productos completos, listas para pintar. */
export async function vitrinas() {
  const s = await leer();
  // Las vencidas quedan guardadas —el panel las muestra para poder revivirlas—
  // pero desaparecen de la tienda: ni sello, ni precio tachado, ni vitrina.
  const vigentes = s.ofertas.filter((o) => ofertaVigente(o));
  const conOferta = new Map(vigentes.map((o) => [o.id, o]));

  const resolver = (id) => {
    const p = POR_ID.get(id);
    if (!p) return null;
    const o = conOferta.get(id);
    if (o) {
      // El precio de oferta pisa al de lista, y el de lista pasa a ser "antes".
      return { ...p, p: o.precio, pa: p.p, et: 'oferta' };
    }
    // Sin oferta vigente queda a precio de lista limpio: sin tachado ni sello.
    // Hace falta porque los datos de ejemplo traen el descuento incrustado en
    // `pa`; el estado de oferta lo decide la curaduría, no el catálogo.
    return { ...p, p: p.p, pa: undefined, et: p.et === 'oferta' ? undefined : p.et };
  };

  return {
    categorias: CATEGORIAS.map((c) => ({ ...c, productos: (s.destacados[c.id] ?? []).map(resolver).filter(Boolean) })),
    semana: s.semana.slice(0, CUPOS_SEMANA).map(resolver).filter(Boolean),
    ofertas: vigentes.map((o) => resolver(o.id)).filter(Boolean),
  };
}
