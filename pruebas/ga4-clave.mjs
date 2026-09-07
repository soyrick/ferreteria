/* Comprueba que la clave privada de la cuenta de servicio se lee bien y que la
   firma que se arma con ella es válida.

   Es el único punto de `ga4.js` donde un error no se ve: una clave mal parseada
   produce una firma inválida, y Google contesta un 400 genérico que no dice
   qué pasó. Acá se genera una clave de prueba, se la escribe como viene en el
   JSON de Google —una sola línea con los saltos escapados— y se verifica la
   firma con la clave pública correspondiente.

   No toca la credencial real ni pide red.

       node pruebas/ga4-clave.mjs
*/

import { derDelPem } from '../src/lib/ga4.js';

const TEXTO = new TextEncoder();
let fallos = 0;

const comprobar = (nombre, ok) => {
  if (!ok) fallos++;
  console.log(`  ${ok ? 'OK  ' : 'MAL '} ${nombre}`);
};

/* Una clave RSA de verdad, del mismo tipo que usa Google para las cuentas de
   servicio: RS256 sobre PKCS#8. */
const par = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
);

const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', par.privateKey));
const base64 = btoa(String.fromCharCode(...der));
const lineas = base64.match(/.{1,64}/g).join('\n');

/* Las tres formas en que puede llegar la clave. La primera es la que importa:
   es exactamente como sale del JSON de Google y como hay que pegarla en la
   variable de entorno. */
const formas = {
  'como viene en el JSON (saltos escapados)':
    `-----BEGIN PRIVATE KEY-----\\n${lineas.replace(/\n/g, '\\n')}\\n-----END PRIVATE KEY-----\\n`,
  'con saltos de línea reales':
    `-----BEGIN PRIVATE KEY-----\n${lineas}\n-----END PRIVATE KEY-----\n`,
  'todo en una línea, sin saltos':
    `-----BEGIN PRIVATE KEY-----${base64}-----END PRIVATE KEY-----`,
};

for (const [nombre, pem] of Object.entries(formas)) {
  let ok = false;
  try {
    const salida = derDelPem(pem);
    const iguales = salida.length === der.length && salida.every((b, i) => b === der[i]);

    // No alcanza con que los bytes coincidan: tiene que poder firmar y verificar.
    const llave = await crypto.subtle.importKey(
      'pkcs8', salida, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
    );
    const mensaje = TEXTO.encode('cabecera.cuerpo');
    const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, mensaje);
    const valida = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', par.publicKey, firma, mensaje);

    ok = iguales && valida;
  } catch (e) {
    console.log(`       ${e.message}`);
  }
  comprobar(nombre, ok);
}

/* Una clave rota tiene que fallar, no devolver basura que parezca válida. */
let rompio = false;
try {
  await crypto.subtle.importKey(
    'pkcs8', derDelPem('-----BEGIN PRIVATE KEY-----\\nno-es-base64-valido\\n-----END PRIVATE KEY-----'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
} catch {
  rompio = true;
}
comprobar('una clave inválida falla en vez de pasar', rompio);

console.log(fallos ? `\n  ${fallos} FALLOS` : '\n  Todo bien');
process.exit(fallos ? 1 : 0);
