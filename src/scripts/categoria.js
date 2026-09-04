/* Página de un rubro: buscador, filtro de disponibles y "ver más".

   El primer lote ya llegó pintado desde el servidor —eso es lo que lee Google
   y lo que se ve con el JavaScript apagado—. Esto se monta encima: busca
   dentro del rubro, filtra por disponibilidad y va sumando tandas sin recargar.

   Los tres van contra /api/catalogo.json y no contra una copia en memoria: un
   rubro puede tener 1.608 productos y traerlos todos para filtrarlos acá sería
   descargar el catálogo entero en el teléfono de alguien. */

import { tarjetaProducto, desdeApi } from './tarjeta.js';
import { agregar, iniciar as iniciarCarrito } from './carrito.js';
import { avisar } from './tostada.js';
import { evento, iniciarConsentimiento } from './analitica.js';

const $ = (s) => document.querySelector(s);

const rejilla = $('#cat-rejilla');
if (rejilla) {
  const { categoria, offsetInicial, totalRubro } = window.__categoria ?? {};

  const forma = $('#cat-herramientas');
  const entrada = $('#cat-q');
  const filtro = $('#cat-solo-hay');
  const cuenta = $('#cat-cuenta');
  const vacio = $('#cat-vacio');
  const estado = $('#cat-estado');
  const paginas = $('#cat-paginas');

  const POR_TANDA = 24;
  const ESPERA_TECLA = 350;

  /* Lo que ya está en pantalla vino del servidor. Se arranca contando desde
     ahí para que la primera tanda no repita lo que ya se ve. */
  let termino = '';
  let soloHay = false;
  let traidos = offsetInicial ?? rejilla.children.length;
  let mostrados = rejilla.children.length;
  let total = totalRubro ?? mostrados;
  let cargando = false;
  let pidiendo;
  let relojBusca;

  /* Los enlaces de página siguen en el HTML que sirve el servidor —son los que
     recorre Google para llegar a todo el rubro— pero con JavaScript estorban:
     habría dos maneras distintas de avanzar en la misma pantalla. */
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-negro cat-mas';
  boton.textContent = 'Ver más productos';
  boton.addEventListener('click', () => traerMas());
  if (paginas) paginas.replaceWith(boton);
  else estado.after(boton);

  /* El botón de enviar el formulario tampoco hace falta ya: acá se busca solo
     mientras se escribe. Se esconde desde el JavaScript y no desde el CSS
     porque es justamente su ausencia la que lo hace necesario. */
  $('.cat-aplicar').hidden = true;

  const contar = () => {
    if (soloHay || termino) {
      cuenta.textContent = `${mostrados.toLocaleString('es-VE')} de ${total.toLocaleString('es-VE')}`;
      return;
    }
    cuenta.textContent = total === 1 ? '1 producto' : `${total.toLocaleString('es-VE')} productos`;
  };

  async function traerMas() {
    if (cargando || (traidos && traidos >= total)) return;
    cargando = true;
    boton.disabled = true;
    boton.textContent = 'Cargando…';

    pidiendo?.abort();
    const mio = (pidiendo = new AbortController());

    const params = new URLSearchParams({
      categoria,
      limit: String(POR_TANDA),
      offset: String(traidos),
    });
    if (termino) params.set('q', termino);

    try {
      const r = await fetch(`/api/catalogo.json?${params}`, { signal: mio.signal });
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

      contar();
      estado.hidden = true;
      vacio.hidden = mostrados > 0 || traidos < total;
      boton.hidden = traidos >= total;
    } catch (e) {
      if (e.name === 'AbortError') return;
      estado.textContent = 'No pudimos cargar más productos. Intenta de nuevo en un momento.';
      estado.hidden = false;
      boton.hidden = false;
    } finally {
      /* Solo el pedido vigente suelta la traba. Si la soltara uno cancelado
         —y su `finally` corre después de que el nuevo la tomó— quedaría en
         falso "libre" con una tanda en vuelo, y la siguiente entraría encima:
         productos repetidos y el contador sumando de a dos. */
      if (pidiendo === mio) {
        cargando = false;
        boton.disabled = false;
        boton.textContent = 'Ver más productos';
      }
    }

    /* Se encadena la tanda siguiente cuando el filtro descartó todo lo que
       entró: si no, la rejilla quedaría vacía habiendo más adelante. */
    if (traidos < total && mostrados === 0) traerMas();
  }

  function reiniciar() {
    pidiendo?.abort();
    rejilla.innerHTML = '';
    traidos = 0;
    mostrados = 0;
    total = 0;
    cargando = false;
    vacio.hidden = true;
    boton.hidden = false;
    traerMas();
  }

  /* Sin JavaScript el formulario recarga con ?q=… ; con él se queda acá. */
  forma.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(relojBusca);
    buscar();
  });

  function buscar() {
    const t = entrada.value.trim();
    if (t === termino) return;
    termino = t;
    reiniciar();
    if (t) evento('search', { search_term: t });
  }

  entrada.addEventListener('input', () => {
    clearTimeout(relojBusca);
    relojBusca = setTimeout(buscar, ESPERA_TECLA);
  });

  /* Solo disponibles. Vuelve a pedir desde cero en vez de esconder lo que ya
     está: si solo se ocultaran las tarjetas agotadas, una tanda de 24 podría
     dejar tres visibles y parecería que el rubro casi no tiene nada. */
  filtro.addEventListener('change', () => {
    soloHay = filtro.checked;
    reiniciar();
  });

  /* Agregar al pedido. Delegado, porque las tarjetas nuevas entran después. */
  rejilla.addEventListener('click', (e) => {
    const b = e.target.closest('[data-agregar]');
    if (!b) return;
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
  contar();
  boton.hidden = traidos >= total;
}
