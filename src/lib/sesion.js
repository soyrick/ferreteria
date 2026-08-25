/* Sesión del panel admin: cookie firmada con HMAC-SHA256.
   Sin dependencias — Web Crypto está en el runtime de Vercel y en Node 24.
   ponytail: una sola clave compartida, sin usuarios ni roles. Alcanza para un
   dueño y su encargado. Si hacen falta varios usuarios con permisos distintos,
   esto se reemplaza por un proveedor de identidad, no se le agregan parches. */

const TEXTO = new TextEncoder();

const aBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const deBase64Url = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
};

const clave = (secreto) =>
  crypto.subtle.importKey('raw', TEXTO.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/** Firma un objeto y devuelve "cuerpo.firma". */
export async function firmar(datos, secreto) {
  const cuerpo = aBase64Url(TEXTO.encode(JSON.stringify(datos)));
  const firma = aBase64Url(await crypto.subtle.sign('HMAC', await clave(secreto), TEXTO.encode(cuerpo)));
  return `${cuerpo}.${firma}`;
}

/** Devuelve los datos si la firma es válida y no venció; si no, null. */
export async function verificar(token, secreto) {
  if (typeof token !== 'string') return null;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return null;

  try {
    // subtle.verify compara en tiempo constante: no filtra por cuánto tarda.
    const valida = await crypto.subtle.verify('HMAC', await clave(secreto), deBase64Url(firma), TEXTO.encode(cuerpo));
    if (!valida) return null;

    const datos = JSON.parse(new TextDecoder().decode(deBase64Url(cuerpo)));
    if (!datos?.vence || Date.now() > datos.vence) return null;
    return datos;
  } catch {
    return null;   // token manipulado o ilegible
  }
}

/** Compara claves por su hash: dos cadenas del mismo largo, sin filtrar el original. */
export async function claveCorrecta(entrada, esperada) {
  if (!esperada) return false;
  const resumen = async (s) =>
    aBase64Url(await crypto.subtle.digest('SHA-256', TEXTO.encode(s)));
  return (await resumen(entrada)) === (await resumen(esperada));
}

/** Evita el redirect abierto: solo se vuelve a rutas internas de /admin. */
export function destinoSeguro(ruta) {
  return typeof ruta === 'string' && /^\/admin(\/[^/\\]|$)/.test(ruta) ? ruta : '/admin';
}
