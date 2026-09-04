/* Freno de fuerza bruta para el acceso al panel.

   El problema con serverless: cada petición puede caer en una instancia nueva,
   así que un contador en memoria se reinicia solo y no frena nada. El registro
   tiene que vivir fuera del proceso, y el Blob que ya guarda la curaduría sirve
   —es el mismo almacén, cero infraestructura nueva.

   Se cuenta por IP y en ventanas de 15 minutos. A los 5 fallos, esa IP queda
   fuera hasta que la ventana cierre. Sin esto, alguien con un script prueba
   miles de claves por minuto contra un panel que tiene una sola.

   ponytail: una ventana fija y no un algoritmo de goteo. Con un solo usuario
   legítimo, la diferencia no se nota; si algún día hay varios, esto se cambia
   por el rate limiting de la plataforma. */

import { put, get } from '@vercel/blob';

const RUTA = 'intentos.json';
const TOPE = 5;
const VENTANA = 15 * 60 * 1000;

const ENV = import.meta.env ?? {};
const TOKEN = ENV.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || '';
const auth = TOKEN ? { token: TOKEN } : {};

/* Sin Blob no hay dónde anotar. Se avisa en consola y se deja pasar: dejar a
   Ricardo afuera de su propio panel sería peor que no tener el freno, y en
   local el panel ya advierte que no está guardando nada. */
const hayAlmacen = () => Boolean(TOKEN);

/** La IP de quien pide, según las cabeceras que pone Vercel. */
export function ipDe(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'desconocida';
}

async function leer() {
  try {
    const r = await get(RUTA, { access: 'private', useCache: false, ...auth });
    if (!r) return {};
    const texto = typeof r.text === 'function' ? await r.text() : await new Response(r.stream).text();
    return JSON.parse(texto);
  } catch {
    return {};
  }
}

async function guardar(registro) {
  try {
    await put(RUTA, JSON.stringify(registro), {
      ...auth,
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch (e) {
    console.error('[intentos] no se pudo anotar:', e.message);
  }
}

/** Descarta las ventanas vencidas para que el archivo no crezca sin fin. */
export const vigentes = (registro, ahora) =>
  Object.fromEntries(Object.entries(registro).filter(([, v]) => ahora - v.desde < VENTANA));

/* La decisión, aparte del almacén, para poder probarla sin Blob: es donde
   está el riesgo de equivocarse —contar mal, no dejar salir de la ventana— y
   donde un error deja el panel abierto o a Ricardo afuera. */
export function decidir(entrada, ahora) {
  if (!entrada || ahora - entrada.desde >= VENTANA) return { permitido: true };
  if (entrada.fallos < TOPE) return { permitido: true };
  return {
    permitido: false,
    minutos: Math.ceil((VENTANA - (ahora - entrada.desde)) / 60000),
  };
}

/** Suma un fallo a la entrada, abriendo ventana nueva si la anterior venció. */
export const sumar = (entrada, ahora) =>
  (!entrada || ahora - entrada.desde >= VENTANA)
    ? { desde: ahora, fallos: 1 }
    : { desde: entrada.desde, fallos: entrada.fallos + 1 };

/** ¿Esta IP puede intentar? Devuelve los minutos que faltan si está frenada. */
export async function puedeIntentar(ip) {
  if (!hayAlmacen()) return { permitido: true };
  return decidir((await leer())[ip], Date.now());
}

/** Anota un intento fallido. */
export async function anotarFallo(ip) {
  if (!hayAlmacen()) return;
  const ahora = Date.now();
  const registro = vigentes(await leer(), ahora);
  registro[ip] = sumar(registro[ip], ahora);
  await guardar(registro);
}

/** Entró bien: se le limpia el historial a esa IP. */
export async function limpiar(ip) {
  if (!hayAlmacen()) return;
  const registro = vigentes(await leer(), Date.now());
  if (!registro[ip]) return;
  delete registro[ip];
  await guardar(registro);
}
