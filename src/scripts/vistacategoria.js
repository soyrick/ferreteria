/* Rejilla de categoría completa: la pantalla que abre "Ver todo".

   Una categoría puede tener 1.608 productos, así que no se traen todos de
   golpe: entran de a 24 y se pide la tanda siguiente cuando el visitante se
   acerca al final. El buscador de arriba filtra dentro de la categoría, contra
   el servidor, porque tampoco están todos acá para filtrarlos en memoria.

   No cambia la dirección del navegador. Las páginas de categoría todavía no
   existen —son deuda anotada—, así que poner /categoria/algo en la barra
   dejaría un 404 esperando a quien recargara. La ficha que abre encima sí
   cambia la URL, y al cerrarla esta rejilla sigue abierta detrás. */

import { tarjetaProducto, desdeApi, limpio, trabarFondo } from './tarjeta.js';

const $ = (s, c = document) => c.querySelector(s);

const panel = $('#vista-categoria');
if (panel) {
  const rejilla = $('#categoria-rejilla');
  const titulo = $('#categoria-titulo');
  const cuenta = $('#categoria-cuenta');
  const buscador = $('#categoria-buscar');
  const centinela = $('#categoria-mas');
  const aviso = $('#categoria-aviso');

  const POR_TANDA = 24;
  const ESPERA_TECLA = 300;

  let categoria = '';
  let termino = '';
  let traidos = 0;
  let total = 0;
  let cargando = false;
  let pidiendo;
  let relojBusca;

  /* Cuando el centinela del final entra en pantalla, se pide la tanda
     siguiente. rootMargin adelanta la carga para que el visitante no llegue a
     ver el hueco. */
  const vigia = new IntersectionObserver(
    (entradas) => { if (entradas[0].isIntersecting) traerMas(); },
    { root: $('#categoria-cuerpo'), rootMargin: '400px' },
  );

  async function traerMas() {
    if (cargando || (traidos && traidos >= total)) return;
    cargando = true;
    centinela.textContent = 'Cargando…';

    pidiendo?.abort();
    pidiendo = new AbortController();

    const params = new URLSearchParams({
      categoria,
      limit: String(POR_TANDA),
      offset: String(traidos),
    });
    if (termino) params.set('q', termino);

    try {
      const r = await fetch(`/api/catalogo.json?${params}`, { signal: pidiendo.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const datos = await r.json();

      total = datos.total ?? 0;
      traidos += datos.productos.length;

      rejilla.insertAdjacentHTML('beforeend',
        datos.productos.map((p) => tarjetaProducto(desdeApi(p))).join(''));

      cuenta.textContent = total === 1 ? '1 producto' : `${total.toLocaleString('es-VE')} productos`;
      aviso.hidden = total > 0;
      centinela.textContent = traidos >= total ? '' : ' ';
    } catch (e) {
      if (e.name === 'AbortError') return;
      centinela.textContent = 'No pudimos cargar más productos.';
    } finally {
      cargando = false;
    }
  }

  function reiniciar() {
    pidiendo?.abort();
    rejilla.innerHTML = '';
    traidos = 0;
    total = 0;
    cargando = false;
    traerMas();
  }

  function abrir(nombre) {
    categoria = nombre;
    termino = '';
    buscador.value = '';
    titulo.textContent = nombre;
    cuenta.textContent = '';
    aviso.hidden = true;

    panel.hidden = false;
    trabarFondo();
    $('#categoria-cerrar').focus();

    reiniciar();
    vigia.observe(centinela);
  }

  function cerrar() {
    panel.hidden = true;
    trabarFondo();
    vigia.unobserve(centinela);
    pidiendo?.abort();
  }

  // "Ver todo" de cada fila de la home.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver-todo]');
    if (!b) return;
    e.preventDefault();
    abrir(b.dataset.verTodo);
  });

  buscador.addEventListener('input', () => {
    clearTimeout(relojBusca);
    relojBusca = setTimeout(() => {
      const t = buscador.value.trim();
      if (t === termino) return;
      termino = t;
      reiniciar();
    }, ESPERA_TECLA);
  });

  $('#categoria-cerrar').addEventListener('click', cerrar);
  $('#categoria-fondo').addEventListener('click', cerrar);

  /* Escape cierra la ficha primero, si está abierta: se cierra la capa de
     arriba, no las dos juntas. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || panel.hidden) return;
    if ($('#vista-producto')?.hidden === false) return;
    cerrar();
  });
}
