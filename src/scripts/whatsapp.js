/* Los mensajes que se abren en WhatsApp.

   Están todos acá porque el número tiene que ser uno solo. Había dos dando
   vueltas: este y un enlace `wa.me/message/CÓDIGO` repartido por la página.
   Ese formato de invitación **no admite texto pre-cargado**, así que para que
   el mensaje llegue escrito hace falta el número en formato internacional. */

/** Atención de la ferretería. Formato internacional sin signos, como pide wa.me. */
export const NUMERO = '584248190490';

/** wa.me se rompe con URLs muy largas. */
const TOPE_URL = 1800;

export const enlace = (texto) =>
  `https://wa.me/${NUMERO}?text=${encodeURIComponent(texto)}`;

/** Recorta el texto si la URL no entra, cortando por renglones. */
export function recortar(lineas, armar) {
  let texto = armar(lineas);
  for (let corte = lineas.length; encodeURIComponent(texto).length > TOPE_URL && corte > 1; corte--) {
    texto = armar(lineas.slice(0, corte - 1), lineas.length - (corte - 1));
  }
  return texto;
}

/* Consulta por un producto agotado. Lleva el código porque es lo que el
   vendedor busca en su sistema: el nombre solo lo obliga a adivinar entre
   variantes que se llaman casi igual. */
export function consultarAgotado({ nombre, marca, codigo }) {
  const identidad = [nombre, marca].filter(Boolean).join(' — ');
  return enlace(
    `¡Hola! Me interesa este producto:\n\n`
    + `• ${identidad}\n`
    + `  Código: ${codigo}\n\n`
    + `Veo que está agotado. ¿Saben si lo tendrán disponible pronto?`,
  );
}

/** Consulta por un producto que sí hay, desde la ficha. */
export function consultarProducto({ nombre, marca, codigo }) {
  const identidad = [nombre, marca].filter(Boolean).join(' — ');
  return enlace(
    `¡Hola! Quisiera información sobre este producto:\n\n`
    + `• ${identidad}\n`
    + `  Código: ${codigo}`,
  );
}
