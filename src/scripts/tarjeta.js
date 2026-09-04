/* La tarjeta de producto y su formato de precio.

   Vive aparte porque la usan tres pantallas: las vitrinas de la home, la
   rejilla de categoría completa y lo que venga después. Si cada una armara la
   suya, cambiar el precio de lugar significaría acordarse de todas. */

import { consultarAgotado } from './whatsapp.js';

/** Formato venezolano: $1.234,56 */
export const precio = (n) =>
  '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d{2})$/, ',$1');

/** Escapa texto antes de meterlo en innerHTML. */
export const limpio = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* El negocio todavía no cargó fotos: la API devuelve `imagenes: []` en todo el
   catálogo. En vez de dejar el hueco vacío o poner una imagen inventada, se
   dibuja un marcador con el icono de la casa. Ocupa exactamente el mismo
   espacio que tendrá la foto, así el día que lleguen entran sin mover nada. */
const foto = (p) =>
  p.img
    ? `<img src="${limpio(p.img)}" alt="${limpio(p.n)}" loading="lazy">`
    : `<span class="producto-sinfoto" aria-hidden="true">
         <svg class="ico"><use href="#i-herramienta"/></svg>
       </span>`;

/* La tarjeta lleva un enlace de verdad a la ficha. No es decorativo: sin él,
   Google no tendría cómo llegar a los productos, el clic medio y el "abrir en
   pestaña nueva" no funcionarían, y con el JavaScript caído la tienda quedaría
   muerta. El panel que abre sin recargar se monta encima de este enlace. */
export function tarjetaProducto(p, rango) {
  const baja = p.pa ? Math.round((1 - p.p / p.pa) * 100) : 0;
  // La arma el servidor en normalizar(): una sola forma de escribir la dirección.
  const url = p.url;

  /* `disponible` puede no venir —las vitrinas viejas no lo mandaban—, así que
     solo se marca agotado cuando la API lo dice explícitamente. Ante la duda,
     el producto se ofrece: es peor esconder algo que sí hay.

     Precio en cero también cuenta como agotado: no es que valga nada, es que
     el negocio todavía no lo cargó. Un botón de "Agregar" que suma $0,00 al
     pedido termina en un reclamo cuando llega la cuenta de verdad. */
  const agotado = p.disponible === false || !(p.p > 0);

  return `
  <article class="producto${agotado ? ' agotado' : ''}">
    <a class="producto-enlace" href="${limpio(url)}" data-ficha="${limpio(p.id)}">
      <div class="producto-foto${p.img ? '' : ' vacia'}">
        ${agotado
          // Agotado tapa a la oferta: si no se puede comprar, el descuento no
          // es la información que hace falta.
          ? '<span class="sello-agotado">Agotado</span>'
          : baja ? `<span class="sello-oferta" aria-label="${baja}% de descuento"><b>−${baja}%</b></span>` : ''}
        ${rango ? `<span class="producto-rango">${rango}</span>` : ''}
        ${foto(p)}
      </div>
      <div class="producto-cuerpo">
        <span class="producto-marca">${limpio(p.m || p.cat || '')}</span>
        <h3 class="producto-nombre">${limpio(p.n)}</h3>
        <div class="producto-precios">
          <span class="producto-precio">${p.p > 0 ? precio(p.p) : 'Consultar'}</span>
          ${p.pa ? `<span class="producto-antes">${precio(p.pa)}</span>` : ''}
        </div>
      </div>
    </a>
    ${agotado
      // Sin botón de agregar: dejar armar un pedido de algo que no hay termina
      // en una conversación incómoda por WhatsApp. En su lugar se abre el chat
      // con la pregunta ya escrita, que es lo que la persona iba a preguntar.
      ? `<a class="producto-agregar preguntar" target="_blank" rel="noopener"
            href="${limpio(consultarAgotado({ nombre: p.n, marca: p.m, codigo: p.id }))}">
           <svg class="ico"><use href="#i-chat"/></svg> Consultar
         </a>`
      : `<button class="producto-agregar" data-agregar
                 data-id="${limpio(p.id)}" data-nombre="${limpio(p.n)}"
                 data-marca="${limpio(p.m)}" data-precio="${p.p}">
           <svg class="ico"><use href="#i-carrito"/></svg> Agregar
         </button>`}
  </article>`;
}

/* La API devuelve los productos con sus nombres largos (codigo, nombre,
   precio…); las vitrinas ya vienen traducidos por normalizar(). Esto empareja
   los dos para que la tarjeta reciba siempre lo mismo. */
export const desdeApi = (p) => ({
  id: p.codigo,
  n: p.nombre,
  m: p.marca ?? '',
  p: p.precio,
  cat: p.categoria,
  img: p.imagenes?.[0]?.url ?? '',
  url: p.url,
  disponible: p.disponible,
});

/* Trabar el scroll del fondo cuando hay una capa abierta.
   ponytail: cuenta las capas mirando el DOM en vez de llevar un registro. Con
   dos —la rejilla de categoría y la ficha— alcanza; si algún día hay más
   capas encimadas, esto pasa a ser un contador. */
export function trabarFondo() {
  const abiertas = ['#vista-producto', '#panel-carrito']
    .filter((s) => document.querySelector(s)?.hidden === false).length;
  document.body.classList.toggle('sin-scroll', abiertas > 0);
}
