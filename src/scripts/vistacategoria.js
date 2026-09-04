/* Rejilla de categoría completa: la pantalla que abre "Ver todo".

   Una categoría puede tener 1.608 productos, así que no se traen todos de
   golpe: entran de a 24 y se pide la tanda siguiente cuando el visitante se
   acerca al final. El buscador de arriba filtra dentro de la categoría, contra
   el servidor, porque tampoco están todos acá para filtrarlos en memoria.

   Es un atajo sobre /categoria/…, que desde F4 existe como página propia: los
   enlaces apuntan ahí de verdad y esto solo evita perder el scroll. La ficha
   que abre encima sí cambia la URL, y al cerrarla la rejilla sigue detrás.

   El filtro de disponibles se aplica acá porque la API no sabe hacerlo: hay
   que pedir tandas y descartar, no preguntar por los que hay. */

import { tarjetaProducto, desdeApi, limpio, trabarFondo } from './tarjeta.js';

const $ = (s, c = document) => c.querySelector(s);

const panel = $('#vista-categoria');
if (panel) {
  const cuerpo = $('#categoria-cuerpo');
  const rejilla = $('#categoria-rejilla');
  const titulo = $('#categoria-titulo');
  const cuenta = $('#categoria-cuenta');
  const buscador = $('#categoria-buscar');
  const filtro = $('#categoria-solo-hay');
  const centinela = $('#categoria-mas');
  const aviso = $('#categoria-aviso');

  const POR_TANDA = 24;
  const ESPERA_TECLA = 300;

  let categoria = '';
  let termino = '';
  let traidos = 0;     // cuántos se le pidieron a la API
  let mostrados = 0;   // cuántos quedaron después del filtro
  let total = 0;
  let soloHay = false;
  let cargando = false;
  let pidiendo;
  let relojBusca;

  /* Se pide la tanda siguiente cuando faltan 400px para el final, para que el
     visitante no llegue a ver el hueco.

     ponytail: un listener de scroll y no un IntersectionObserver. Hace lo
     mismo con menos piezas —hay un solo punto que vigilar, el fondo de un
     contenedor propio— y sobre todo se puede comprobar: el observer depende de
     que el navegador esté componiendo la página, y en un entorno sin pintado
     no dispara nunca, ni siquiera para avisar que algo NO se ve. */
  const MARGEN = 400;

  const cerca = () =>
    cuerpo.scrollTop + cuerpo.clientHeight >= cuerpo.scrollHeight - MARGEN;

  function vigilar() {
    if (cerca()) traerMas();
  }

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

      /* La API no sabe filtrar por disponibilidad, así que se filtra acá. Por
         eso el contador dice cuántos se están viendo y no cuántos hay: con el
         filtro puesto, de una tanda de 24 pueden entrar 13. */
      const entran = soloHay
        ? datos.productos.filter((p) => p.disponible && p.precio > 0)
        : datos.productos;
      mostrados += entran.length;

      rejilla.insertAdjacentHTML('beforeend',
        entran.map((p) => tarjetaProducto(desdeApi(p))).join(''));

      cuenta.textContent = soloHay
        ? `${mostrados.toLocaleString('es-VE')} disponibles de ${total.toLocaleString('es-VE')}`
        : (total === 1 ? '1 producto' : `${total.toLocaleString('es-VE')} productos`);

      const fin = traidos >= total;
      aviso.hidden = mostrados > 0 || !fin;
      centinela.textContent = fin ? '' : ' ';
    } catch (e) {
      if (e.name === 'AbortError') return;
      centinela.textContent = 'No pudimos cargar más productos.';
    } finally {
      cargando = false;
    }

    /* Se encadena la siguiente tanda en dos casos: cuando lo que entró no llenó
       la pantalla —no habría scroll que la dispare— y cuando el filtro descartó
       toda la tanda, que si no dejaría la rejilla vacía habiendo más adelante. */
    if (traidos < total && (cerca() || mostrados === 0)) traerMas();
  }

  function reiniciar() {
    pidiendo?.abort();
    rejilla.innerHTML = '';
    // Al buscar de nuevo, volver arriba: si no, los resultados nuevos entran
    // con la vista a mitad de camino de la lista anterior.
    cuerpo.scrollTop = 0;
    traidos = 0;
    mostrados = 0;
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
    cuerpo.addEventListener('scroll', vigilar, { passive: true });
  }

  function cerrar() {
    panel.hidden = true;
    trabarFondo();
    cuerpo.removeEventListener('scroll', vigilar);
    pidiendo?.abort();
  }

  /* "Ver todo" y los rubros del menú son enlaces de verdad a /categoria/…, así
     que Google los sigue y el clic medio abre pestaña. Se interceptan solo
     para abrir la rejilla sin perder el scroll; con cualquier modificador se
     deja pasar la navegación. */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver-todo]');
    if (!b || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
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

  /* Solo disponibles. Vuelve a pedir desde cero en vez de esconder lo que ya
     está: si solo se ocultaran las tarjetas agotadas, una tanda de 24 podría
     dejar tres visibles y parecería que la categoría casi no tiene nada. */
  filtro.addEventListener('change', () => {
    soloHay = filtro.checked;
    reiniciar();
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
