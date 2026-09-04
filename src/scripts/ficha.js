/* Página de producto. Lo único que hace falta acá es poder agregar al pedido:
   el resto de la ficha es HTML servido, para que funcione con el JavaScript
   apagado y para que Google lo lea. */

import { agregar } from './carrito.js';
import { avisar } from './tostada.js';

document.querySelector('[data-agregar]')?.addEventListener('click', (e) => {
  const b = e.currentTarget;
  agregar({
    id: b.dataset.id,
    n: b.dataset.nombre,
    m: b.dataset.marca,
    p: Number(b.dataset.precio),
  });
  avisar(`Agregado: ${b.dataset.nombre}`);
});
