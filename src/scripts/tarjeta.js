/* La tarjeta de producto y su formato de precio.

   Vive aparte porque la usan tres pantallas: las vitrinas de la home, la
   rejilla de categoría completa y lo que venga después. Si cada una armara la
   suya, cambiar el precio de lugar significaría acordarse de todas. */

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
  return `
  <article class="producto">
    <a class="producto-enlace" href="${limpio(url)}" data-ficha="${limpio(p.id)}">
      <div class="producto-foto${p.img ? '' : ' vacia'}">
        ${baja ? `<span class="sello-oferta" aria-label="${baja}% de descuento"><b>−${baja}%</b></span>` : ''}
        ${rango ? `<span class="producto-rango">${rango}</span>` : ''}
        ${foto(p)}
      </div>
      <div class="producto-cuerpo">
        <span class="producto-marca">${limpio(p.m || p.cat || '')}</span>
        <h3 class="producto-nombre">${limpio(p.n)}</h3>
        <div class="producto-precios">
          <span class="producto-precio">${precio(p.p)}</span>
          ${p.pa ? `<span class="producto-antes">${precio(p.pa)}</span>` : ''}
        </div>
      </div>
    </a>
    <button class="producto-agregar" data-agregar
            data-id="${limpio(p.id)}" data-nombre="${limpio(p.n)}"
            data-marca="${limpio(p.m)}" data-precio="${p.p}">
      <svg class="ico"><use href="#i-carrito"/></svg> Agregar
    </button>
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
});

/* Trabar el scroll del fondo cuando hay una capa abierta.
   ponytail: cuenta las capas mirando el DOM en vez de llevar un registro. Con
   dos —la rejilla de categoría y la ficha— alcanza; si algún día hay más
   capas encimadas, esto pasa a ser un contador. */
export function trabarFondo() {
  const abiertas = ['#vista-categoria', '#vista-producto', '#panel-carrito']
    .filter((s) => document.querySelector(s)?.hidden === false).length;
  document.body.classList.toggle('sin-scroll', abiertas > 0);
}
