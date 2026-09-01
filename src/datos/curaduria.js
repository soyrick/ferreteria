/* Curaduría: qué sale en la página principal.

   El catálogo real vive en la API del negocio (8.437 productos): nombre,
   precio, disponibilidad y fotos los manda ella. Acá solo se guarda lo que
   la API no sabe — qué mostrar primero y qué está rebajado.

   El reparto es así, y viene impuesto por la escala:
   - Categorías: se eligen las categorías, no los productos. Curar a mano una
     categoría de 1.608 artículos con casillas no es trabajo de nadie.
   - Lo más vendido y Ofertas: sí producto por producto, por código, porque
     son pocos y son decisiones de la tienda.

   Se guarda en Vercel Blob, no en Global Config: escribir en Global Config
   exige un token de la API REST de Vercel con permisos sobre toda la cuenta.
   Blob usa credenciales acotadas al store: si alguien entra al panel se lleva
   la curaduría y nada más. El documento pesa menos de 2 KB — no necesita una
   base de datos, necesita dónde escribirse. */

import { put, get } from '@vercel/blob';
import { resumen, productos, producto, normalizar, ranura } from './api.js';

const RUTA = 'curaduria.json';

/** Cupos de la rejilla de "Lo más vendido". */
export const CUPOS_TOPVENTAS = 10;

/** Cuántas categorías salen en la home, y cuántos productos trae cada fila. */
export const CUPOS_CATEGORIAS = 8;
const POR_FILA = 10;

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

/* Documento vacío. No se siembra nada: sin categorías elegidas, la home usa
   las más grandes de la API sola. Sembrar exigiría llamar a la API desde una
   función síncrona, y encima quedaría viejo apenas cambie el catálogo. */
const inicial = () => ({ categorias: [], topventas: [], ofertas: [] });

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
    return ['No se pudo guardar en el almacén; el cambio quedó solo en memoria. Revisa la configuración de Vercel Blob.'];
  }
}

/* Validación de forma, no de existencia: comprobar que cada código exista
   costaría una llamada a la API por producto, y ya se comprueba al agregarlo
   desde el panel. Un código que desaparezca del catálogo se descarta al pintar. */
function validar(doc) {
  const errores = [];

  if ((doc.categorias ?? []).length > CUPOS_CATEGORIAS) {
    errores.push(`No entran más de ${CUPOS_CATEGORIAS} categorías en la página principal.`);
  }
  if ((doc.topventas ?? []).length > CUPOS_TOPVENTAS) {
    errores.push(`Lo más vendido admite ${CUPOS_TOPVENTAS} productos como máximo.`);
  }
  for (const o of doc.ofertas ?? []) {
    if (!o.codigo) { errores.push('Hay una oferta sin producto.'); continue; }
    if (!(o.precio > 0)) errores.push(`Precio inválido en la oferta de ${o.codigo}.`);
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
export async function accionProducto(accion, codigo) {
  const p = await producto(codigo);
  if (!p) return { error: 'Ese producto ya no está en el catálogo.' };
  const s = await leer();

  if (accion === 'a-topventas') {
    if (s.topventas.includes(codigo)) return { aviso: `${p.nombre} ya estaba en Lo más vendido.` };
    if (s.topventas.length >= CUPOS_TOPVENTAS) {
      return { error: `Lo más vendido está lleno (${CUPOS_TOPVENTAS}). Quita uno antes de agregar otro.` };
    }
    const errores = await guardar({ topventas: [...s.topventas, codigo] });
    return errores.length ? { error: errores[0] } : { ok: `${p.nombre} pasó a Lo más vendido.` };
  }

  if (accion === 'a-oferta') {
    if (s.ofertas.some((o) => o.codigo === codigo)) return { aviso: `${p.nombre} ya estaba en oferta.` };
    if (!(p.precio > 0)) return { error: `${p.nombre} no tiene precio publicado: no se le puede poner oferta.` };
    // Precio inicial: 10 % menos que el de lista. Se ajusta en la pantalla de Ofertas.
    const precio = Math.round(p.precio * 0.9 * 100) / 100;
    const errores = await guardar({ ofertas: [...s.ofertas, { codigo, precio, vence: '' }] });
    return errores.length ? { error: errores[0] } : { ok: `${p.nombre} pasó a Ofertas con 10 % de descuento. Ajusta el precio si hace falta.` };
  }

  if (accion === 'quitar-topventas') {
    const errores = await guardar({ topventas: s.topventas.filter((x) => x !== codigo) });
    return errores.length ? { error: errores[0] } : { ok: `${p.nombre} salió de Lo más vendido.` };
  }

  if (accion === 'quitar-oferta') {
    const errores = await guardar({ ofertas: s.ofertas.filter((o) => o.codigo !== codigo) });
    return errores.length ? { error: errores[0] } : { ok: `${p.nombre} salió de Ofertas.` };
  }

  return { error: 'Acción desconocida.' };
}

/** Aplica la rebaja: el precio de oferta pisa al de lista, que queda como "antes". */
const conRebaja = (p, precio) =>
  precio ? { ...p, p: precio, pa: p.p, et: 'oferta' } : p;

/** Las vitrinas ya resueltas a productos completos, listas para pintar. */
export async function vitrinas() {
  const s = await leer();
  const info = await resumen();

  /* Sin categorías elegidas se usan las que más productos tienen. La API ya
     las devuelve ordenadas por total, así que alcanza con cortar. */
  const elegidas = s.categorias.length
    ? info.categorias.filter((c) => s.categorias.includes(c.nombre))
    : info.categorias.slice(0, CUPOS_CATEGORIAS);

  // Las vencidas quedan guardadas —el panel las muestra para poder revivirlas—
  // pero desaparecen de la tienda: ni sello, ni precio tachado, ni vitrina.
  const vigentes = s.ofertas.filter((o) => ofertaVigente(o));
  const rebaja = new Map(vigentes.map((o) => [o.codigo, o.precio]));

  /* Las peticiones de las ocho filas van aplanadas en una sola cola: si cada
     categoría lanzara las suyas por su cuenta saldrían 24 a la vez, que es
     justo lo que la API no aguanta. El caché de /api/vitrinas.json hace que
     todo esto corra una vez por minuto, no una vez por visita. */
  const trabajos = elegidas.flatMap(({ nombre, total }) =>
    offsetsDe(total).map((offset) => () =>
      productos({ categoria: nombre, limit: POR_TRAMO, offset })
        .then((r) => ({ nombre, productos: r.productos }))),
  );

  const tandas = await enLotes(trabajos);

  const filas = elegidas.map(({ nombre }) => {
    const listos = tandas
      .filter((t) => t.nombre === nombre)
      .flatMap((t) => t.productos)
      .map(normalizar)
      .filter((p) => p.disponible && p.p > 0);
    return {
      id: ranura(nombre),
      nombre,
      productos: repartir(listos).map((p) => conRebaja(p, rebaja.get(p.id))),
    };
  });

  const [top, ofertas] = await Promise.all([
    traerPorCodigo(s.topventas.slice(0, CUPOS_TOPVENTAS), rebaja),
    traerPorCodigo(vigentes.map((o) => o.codigo), rebaja),
  ]);

  return {
    categorias: filas,
    topventas: top,
    ofertas,
    // Los 32 rubros del negocio, para el menú. Las filas de la home son ocho.
    rubros: info.categorias.map((c) => ({ ...c, id: ranura(c.nombre) })),
  };
}

/* Una fila de categoría.

   Dos cosas hay que arreglar sobre lo que devuelve la API:

   1. El 44 % del catálogo no está disponible. Poner en la portada algo que no
      se puede vender hoy termina en un cliente molesto, así que se filtra.
   2. La API ordena alfabéticamente y no acepta otro orden. Pidiendo los diez
      primeros, las ocho filas de la home empezarían todas en "ABRAZADERA".

   Por eso se pide una muestra grande y se toman productos espaciados a lo
   largo del abecedario. Es determinista: la misma fila sale igual en cada
   carga, no baila entre recargas.
   ponytail: si algún día la API acepta ordenar (por venta, por novedad), esto
   se reemplaza por ese parámetro y la muestra grande deja de hacer falta. */
const TRAMOS = 3;        // cuántos puntos del abecedario se visitan
const POR_TRAMO = 20;    // cuántos se traen de cada punto
const LOTE = 8;          // peticiones simultáneas

/* La API se degrada con mucha concurrencia: medido, 8 peticiones a la vez
   responden en 470 ms y 24 tardan 7,5 s (el cliente cortaba por tiempo).
   Por eso se despacha de a lotes en vez de soltarlas todas juntas. */
async function enLotes(tareas) {
  const salida = [];
  for (let i = 0; i < tareas.length; i += LOTE) {
    salida.push(...await Promise.all(tareas.slice(i, i + LOTE).map((t) => t())));
  }
  return salida;
}

/** Puntos del catálogo de una categoría de donde sacar muestra. */
const offsetsDe = (total) =>
  total > TRAMOS * POR_TRAMO
    ? Array.from({ length: TRAMOS }, (_, i) => Math.floor((total * i) / TRAMOS))
    : [0];

/** Elige POR_FILA productos repartidos parejo, en vez de los primeros. */
function repartir(listos) {
  if (listos.length <= POR_FILA) return listos;
  const paso = listos.length / POR_FILA;
  return Array.from({ length: POR_FILA }, (_, i) => listos[Math.floor(i * paso)]);
}

/** Trae varios productos por código. Los que ya no existan se descartan. */
async function traerPorCodigo(codigos, rebaja) {
  const traidos = await enLotes(codigos.map((c) => () => producto(c).catch(() => null)));
  return traidos
    .filter(Boolean)
    .map(normalizar)
    .map((p) => conRebaja(p, rebaja.get(p.id)));
}

/* `ranura` vive en el catálogo, junto a urlProducto, porque las direcciones se
   arman todas ahí. Se re-exporta para que las pantallas la sigan pidiendo donde
   ya la pedían. */
export { ranura };
