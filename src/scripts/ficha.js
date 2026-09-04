/* Página de producto. La ficha es HTML servido —funciona con el JavaScript
   apagado y Google la lee—; esto agrega encima el pedido: agregar, ver lo que
   se lleva y mandarlo por WhatsApp.

   Hasta el 2026-09-03 acá solo se podía agregar. El producto quedaba guardado y
   salía el aviso, pero no había dónde ver el pedido ni cómo mandarlo: había que
   volver al rubro para eso. */

import { agregar, iniciar as iniciarCarrito } from './carrito.js';
import { avisar } from './tostada.js';
import { evento, iniciarConsentimiento } from './analitica.js';

document.querySelector('[data-agregar]')?.addEventListener('click', (e) => {
  const b = e.currentTarget;
  agregar({
    id: b.dataset.id,
    n: b.dataset.nombre,
    m: b.dataset.marca,
    p: Number(b.dataset.precio),
  });
  avisar(`Agregado: ${b.dataset.nombre}`);
  evento('add_to_cart', { item_name: b.dataset.nombre });
});

/* No hay banner acá: esto solo carga GA si ya dijo que sí en la home. */
iniciarConsentimiento();
iniciarCarrito();

/* "Volver al rubro" es un enlace normal a /categoria/…, sin interceptar: así
   funciona desde Google, desde un enlace pegado en WhatsApp y con el
   JavaScript apagado. De devolver la pantalla como estaba —las tandas que se
   habían cargado y la posición— se encarga el rubro al recibirla, en
   categoria.js.

   Se probó antes con history.back(), que sale gratis y deja que el navegador
   restaure todo. No sirvió: el navegador rehízo la página igual y volvió a
   quedar en 24 productos. */
