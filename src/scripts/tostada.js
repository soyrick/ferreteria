/* El aviso corto de abajo: "Agregado: taladro".

   Estaba escrito tres veces —home, ficha y ahora las categorías— con tres
   comportamientos apenas distintos. Es el mismo elemento con el mismo id en
   las tres, así que es una función, no tres.

   Dura tres segundos y después se desvanece, no desaparece de golpe: un corte
   seco parece un parpadeo y deja dudando si de verdad decía algo. */

import { limpio } from './tarjeta.js';

const VISIBLE = 3000;
const DESVANECIDO = 400;

let relojTostada;
let relojSalida;

export function avisar(texto) {
  const t = document.getElementById('tostada');
  if (!t) return;

  clearTimeout(relojTostada);
  clearTimeout(relojSalida);

  t.classList.remove('saliendo');
  t.innerHTML = `<svg class="ico"><use href="#i-check"/></svg> ${limpio(texto)}`;
  t.hidden = false;

  relojTostada = setTimeout(() => {
    t.classList.add('saliendo');
    // Se esconde recién cuando terminó de desvanecerse; si no, el elemento
    // desaparecería a mitad de la transición y el efecto no se vería.
    relojSalida = setTimeout(() => {
      t.hidden = true;
      t.classList.remove('saliendo');
    }, DESVANECIDO);
  }, VISIBLE);
}
