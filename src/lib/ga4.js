/* Las visitas reales, desde la GA4 Data API.

   SOLO SERVIDOR. Lleva una clave privada RSA: si este módulo llegara al
   navegador, cualquiera se llevaría el acceso a la analítica del negocio. Por
   eso las variables van sin `PUBLIC_`, igual que `CATALOGO_URL`.

   ponytail: el JWT se firma a mano con Web Crypto en vez de traer `googleapis`.
   Esa librería pesa decenas de megas y arrastra el cliente de todas las APIs de
   Google para usar un endpoint; esto son cincuenta líneas y el runtime ya trae
   la criptografía. Es el caso que la regla R3 pide rechazar.

   La API pide el **ID numérico de propiedad**, no el de medición: `PUBLIC_GA_ID`
   es `G-…` y acá no sirve. Con el equivocado contesta que la propiedad no
   existe, que es un mensaje que no ayuda nada a entender el problema. */

import { aBase64Url } from './sesion.js';

const TEXTO = new TextEncoder();

const ENV = import.meta.env ?? {};
const env = (nombre) => ENV[nombre] || process.env?.[nombre] || '';

const PROPIEDAD = env('GA_PROPIEDAD');
const CORREO = env('GA_CUENTA_CORREO');
const CLAVE = env('GA_CUENTA_CLAVE');

const ALCANCE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TIEMPO_LIMITE = 8000;   // el panel no puede quedar colgado esperando

/** ¿Están las tres variables? Sin alguna, el panel muestra el aviso de siempre. */
export const ga4Listo = () => Boolean(PROPIEDAD && CORREO && CLAVE);

/* El `private_key` del JSON viene como PEM. Se le sacan las líneas BEGIN/END y
   todo el espacio en blanco, y queda el base64 del DER.

   El `replace` de `\\n` es lo que hace que funcione pegado en una variable de
   entorno: dentro del JSON los saltos están escritos como los dos caracteres
   barra-ene, y `vercel env add` corta el valor en el primer salto de línea
   real, así que la clave se carga en una sola línea tal como está en el
   archivo.

   Se exporta para poder probarla: es el punto donde un error no se ve —una
   clave mal parseada da una firma inválida y Google contesta un 400 genérico
   que no dice nada. Ver `pruebas/ga4-clave.mjs`. */
export function derDelPem(pem) {
  const base64 = pem
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/* Google no acepta la clave de la cuenta de servicio directamente: hay que
   firmar un JWT con ella y cambiarlo por un token de acceso que dura una hora.

   ponytail: el token se pide en cada carga del panel en vez de guardarlo.
   Son dos peticiones por visita a una pantalla que abren una o dos personas por
   día. El techo es si el panel se abriera en bucle o lo mirara mucha gente;
   ahí entra cachearlo, aprovechando esa hora de validez. */
async function tokenDeAcceso() {
  const ahora = Math.floor(Date.now() / 1000);

  const cabecera = aBase64Url(TEXTO.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const cuerpo = aBase64Url(TEXTO.encode(JSON.stringify({
    iss: CORREO,
    scope: ALCANCE,
    aud: TOKEN_URL,
    iat: ahora,
    exp: ahora + 3600,
  })));

  const llave = await crypto.subtle.importKey(
    'pkcs8',
    derDelPem(CLAVE),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = aBase64Url(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, TEXTO.encode(`${cabecera}.${cuerpo}`)),
  );

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${cabecera}.${cuerpo}.${firma}`,
    }),
    signal: AbortSignal.timeout(TIEMPO_LIMITE),
  });

  if (!r.ok) {
    throw new Error(`Google rechazó la cuenta de servicio (${r.status})`);
  }
  const { access_token: token } = await r.json();
  if (!token) throw new Error('Google no devolvió token de acceso');
  return token;
}

const HACE_28 = { startDate: '28daysAgo', endDate: 'today' };
const HACE_7 = { startDate: '7daysAgo', endDate: 'today' };

/* Los tres informes van en una sola petición. `batchRunReports` existe justo
   para esto: un viaje, un lugar donde manejar el error. */
const INFORMES = [
  {
    // Visitas y personas, en los dos rangos a la vez.
    dateRanges: [HACE_7, HACE_28],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
  },
  {
    dateRanges: [HACE_28],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5,
  },
  {
    /* Los eventos propios por su nombre. `eventName` y `eventCount` son
       estándar, así que esto funciona sin configurar nada en GA4. Los términos
       buscados serían otra cosa: `searchTerm` es para el buscador por URL, y
       nuestro `search_term` viaja como parámetro propio, que necesita una
       dimensión personalizada registrada. Por eso acá se dice cuántas
       búsquedas hubo, no cuáles. */
    dateRanges: [HACE_28],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['search', 'add_to_cart'] },
      },
    },
  },
];

const numero = (fila, i = 0) => Number(fila?.metricValues?.[i]?.value ?? 0);

/** Devuelve `{ visitas7, personas7, visitas28, personas28, paginas, eventos }`. */
export async function visitas() {
  if (!ga4Listo()) throw new Error('Faltan las variables de GA4');

  const token = await tokenDeAcceso();

  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(PROPIEDAD)}:batchRunReports`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: INFORMES }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE),
    },
  );

  if (r.status === 403) {
    throw new Error('La cuenta de servicio no tiene acceso a la propiedad');
  }
  if (!r.ok) throw new Error(`La Data API respondió ${r.status}`);

  const { reports = [] } = await r.json();
  const [totales, paginas, eventos] = reports;

  /* Con más de un rango, la API agrega sola una dimensión `dateRange` con
     valores `date_range_0`, `date_range_1`… y **las filas NO vuelven en el
     orden en que se pidieron**: medido el 2026-09-07, el rango 1 llegó primero.

     Por eso se buscan por nombre y no por posición. Tomándolas por posición el
     panel mostraba 42 visitas en 7 días y 35 en 28 — un número imposible,
     porque el rango largo contiene al corto. */
  const porRango = (indice) =>
    (totales?.rows ?? []).find((f) => f.dimensionValues?.[0]?.value === `date_range_${indice}`);

  const fila7 = porRango(0);     // el orden acá es el de INFORMES, no el de la respuesta
  const fila28 = porRango(1);

  return {
    visitas7: numero(fila7, 0),
    personas7: numero(fila7, 1),
    visitas28: numero(fila28, 0),
    personas28: numero(fila28, 1),
    paginas: (paginas?.rows ?? []).map((f) => ({
      ruta: f.dimensionValues?.[0]?.value ?? '',
      vistas: numero(f),
    })),
    eventos: Object.fromEntries(
      (eventos?.rows ?? []).map((f) => [f.dimensionValues?.[0]?.value, numero(f)]),
    ),
  };
}
