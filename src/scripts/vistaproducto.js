/* Ficha rápida: abre el producto en un panel lateral sin recargar la página.

   Es un agregado encima de un enlace que ya funciona. Cada tarjeta apunta de
   verdad a /producto/CODIGO; acá solo se intercepta el clic para no perder el
   scroll ni volver a pedir la home. Si este archivo no cargara, o el navegador
   no soportara algo, el enlace navega y el visitante ve la misma ficha
   completa. Google, por su lado, sigue el href y nunca pasa por acá.

   La URL se actualiza con pushState, así que copiar la barra de direcciones,
   compartir el enlace o volver con el botón "atrás" hacen lo esperado. */

import { agregar } from './carrito.js';

const $ = (s, c = document) => c.querySelector(s);

const panel = $('#vista-producto');
if (panel) {
  const cuerpo = $('#vista-cuerpo');
  const enlaceCompleto = $('#vista-completa');
  let urlPrevia = location.pathname + location.search;
  let ultimoFoco = null;
  let pidiendo;

  const limpio = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const precio = (n) =>
    '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d{2})$/, ',$1');

  function pintar(p) {
    const vendible = p.disponible && p.precio > 0;
    const ficha = [
      p.marca && ['Marca', p.marca],
      ['Código', p.codigo],
      p.categoria && ['Categoría', p.categoria],
      ...Object.entries(p.atributos ?? {}).map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v]),
    ].filter(Boolean);

    cuerpo.innerHTML = `
      <div class="vista-foto${p.imagenes?.length ? '' : ' vacia'}">
        ${p.imagenes?.[0]?.url
          ? `<img src="${limpio(p.imagenes[0].url)}" alt="${limpio(p.nombre)}">`
          : '<span class="producto-sinfoto" aria-hidden="true"><svg class="ico"><use href="#i-herramienta"/></svg></span>'}
      </div>
      ${p.marca ? `<span class="ficha-marca">${limpio(p.marca)}</span>` : ''}
      <h2 id="vista-titulo">${limpio(p.nombre)}</h2>
      <p class="ficha-precio">
        ${p.precio > 0 ? precio(p.precio) : 'Precio a consultar'}
        ${p.precio > 0 ? '<small>IVA incluido</small>' : ''}
      </p>
      <p class="ficha-estado ${vendible ? 'hay' : 'no-hay'}">
        ${vendible ? 'Disponible en tienda' : 'Sin existencia por ahora'}
      </p>
      ${vendible
        ? `<button class="btn btn-amarillo btn-ancho" data-agregar-ficha
                   data-id="${limpio(p.codigo)}" data-nombre="${limpio(p.nombre)}"
                   data-marca="${limpio(p.marca ?? '')}" data-precio="${p.precio}">
             <svg class="ico"><use href="#i-carrito"/></svg> Agregar al pedido
           </button>`
        : `<a class="btn btn-negro btn-ancho" href="https://wa.me/message/N5EYYCMCKHH2M1" target="_blank" rel="noopener">
             <svg class="ico"><use href="#i-chat"/></svg> Preguntar por este producto
           </a>`}
      <table class="ficha-tabla"><tbody>
        ${ficha.map(([k, v]) => `<tr><th>${limpio(k)}</th><td>${limpio(v)}</td></tr>`).join('')}
      </tbody></table>`;

    enlaceCompleto.href = `/producto/${encodeURIComponent(p.codigo)}`;
  }

  async function abrir(codigo) {
    ultimoFoco = document.activeElement;
    urlPrevia = location.pathname + location.search;

    panel.hidden = false;
    document.body.classList.add('sin-scroll');
    cuerpo.innerHTML = '<p class="vista-cargando">Cargando…</p>';
    $('#vista-cerrar').focus();

    history.pushState({ ficha: codigo }, '', `/producto/${encodeURIComponent(codigo)}`);

    pidiendo?.abort();
    pidiendo = new AbortController();

    try {
      const r = await fetch(`/api/catalogo.json?codigo=${encodeURIComponent(codigo)}`,
                            { signal: pidiendo.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      pintar((await r.json()).producto);
    } catch (e) {
      if (e.name === 'AbortError') return;
      /* Si no se pudo traer, se manda a la página real en vez de dejar el panel
         a medias: allá el servidor arma la ficha o devuelve un 404 honesto. */
      location.href = `/producto/${encodeURIComponent(codigo)}`;
    }
  }

  function cerrar({ volviendo = false } = {}) {
    panel.hidden = true;
    document.body.classList.remove('sin-scroll');
    pidiendo?.abort();
    // Al cerrar a mano se devuelve la URL de antes; si el cierre vino del botón
    // "atrás", el navegador ya la cambió y tocarla otra vez rompería el historial.
    if (!volviendo) history.pushState({}, '', urlPrevia);
    ultimoFoco?.focus();
  }

  // Un clic con Ctrl, Cmd o el botón del medio quiere una pestaña nueva: no se toca.
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest('[data-ficha]');
    if (!enlace || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    abrir(enlace.dataset.ficha);
  });

  cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-agregar-ficha]');
    if (!b) return;
    agregar({ id: b.dataset.id, n: b.dataset.nombre, m: b.dataset.marca, p: Number(b.dataset.precio) });
    b.textContent = 'Agregado al pedido';
    b.disabled = true;
  });

  $('#vista-cerrar').addEventListener('click', () => cerrar());
  $('#vista-fondo').addEventListener('click', () => cerrar());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) cerrar();
  });

  addEventListener('popstate', (e) => {
    if (e.state?.ficha) abrir(e.state.ficha);
    else if (!panel.hidden) cerrar({ volviendo: true });
  });
}
