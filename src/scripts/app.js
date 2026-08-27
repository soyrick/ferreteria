/* =========================================================
   Casa Herramientas — demo de interfaz
   Datos de ejemplo + comportamiento de la home.
   ========================================================= */

import { iniciarConsentimiento, evento } from './analitica.js';
import { agregar, iniciar as iniciarCarrito } from './carrito.js';

/* ---------------------------------------------------------
   1. CATÁLOGO
   Los datos viven en src/datos/catalogo.js: los comparten la tienda y el
   panel. Una sola fuente, o el admin curaría un catálogo distinto al que
   la página muestra.
   --------------------------------------------------------- */
import { CATEGORIAS, ESTRELLAS, TODOS } from '../datos/catalogo.js';


/* ---------------------------------------------------------
   2. UTILIDADES
   --------------------------------------------------------- */
/* Marca que el JS corre: habilita los estados que el CSS esconde a propósito. */
document.documentElement.classList.add('js');

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Formato de precio venezolano: $1.234,56 */
const precio = (n) =>
  '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/\.(\d{2})$/, ',$1');

/** Escapa texto antes de meterlo en innerHTML. */
const limpio = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ETIQUETAS = { oferta: 'Oferta', nuevo: 'Nuevo', top: 'Top ventas' };

function tarjetaProducto(p, rango) {
  const baja = p.pa ? Math.round((1 - p.p / p.pa) * 100) : 0;
  return `
  <article class="producto">
    <div class="producto-foto">
      ${p.et ? `<span class="producto-etiqueta ${p.et}">${ETIQUETAS[p.et]}</span>` : ''}
      ${rango ? `<span class="producto-rango">${rango}</span>` : ''}
      <img src="/assets/img/${p.img}.jpg" alt="${limpio(p.n)}" loading="lazy">
    </div>
    <div class="producto-cuerpo">
      <span class="producto-marca">${limpio(p.m)}</span>
      <h3 class="producto-nombre">${limpio(p.n)}</h3>
      <div class="producto-estrellas">
        <svg class="ico"><use href="#i-estrella"/></svg>
        <strong>${p.v.toFixed(1)}</strong><span>· En existencia</span>
      </div>
      <div class="producto-precios">
        <span class="producto-precio">${precio(p.p)}</span>
        ${p.pa ? `<span class="producto-antes">${precio(p.pa)}</span><span class="producto-baja">−${baja}%</span>` : ''}
      </div>
      <button class="producto-agregar" data-agregar
              data-id="${p.img}" data-nombre="${limpio(p.n)}"
              data-marca="${limpio(p.m)}" data-precio="${p.p}">
        <svg class="ico"><use href="#i-carrito"/></svg> Agregar
      </button>
    </div>
  </article>`;
}

/* ---------------------------------------------------------
   3. PINTAR LAS VITRINAS
   Los datos vienen de /api/vitrinas.json, que devuelve lo que el panel
   guardó. Si esa ruta falla, se pinta el catálogo empaquetado: la tienda
   nunca queda vacía por un problema del almacén.
   --------------------------------------------------------- */
const RESPALDO = {
  categorias: CATEGORIAS,
  semana: ESTRELLAS,
  ofertas: TODOS.filter((p) => p.pa),
};

async function traerVitrinas() {
  try {
    const r = await fetch('/api/vitrinas.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const v = await r.json();
    if (!Array.isArray(v.categorias)) throw new Error('respuesta inesperada');
    return v;
  } catch (e) {
    console.warn('[vitrinas] usando el catálogo empaquetado:', e.message);
    return RESPALDO;
  }
}

function pintar(v) {
  $('#categorias').innerHTML = v.categorias.map(
    (c) => `
  <section class="categoria" id="${c.id}">
    <div class="contenedor">
      <header class="seccion-cabeza revelar">
        <div>
          <span class="mini-etiqueta">Categoría</span>
          <h2>${limpio(c.nombre)}</h2>
          <p>${limpio(c.lema)}</p>
        </div>
        <div class="seccion-acciones">
          <a class="enlace-todo" href="#${c.id}">Ver todo <svg class="ico"><use href="#i-der"/></svg></a>
          <button class="flecha-carrusel" data-mover="-1" data-fila="${c.id}" aria-label="Anterior"><svg class="ico"><use href="#i-izq"/></svg></button>
          <button class="flecha-carrusel" data-mover="1" data-fila="${c.id}" aria-label="Siguiente"><svg class="ico"><use href="#i-der"/></svg></button>
        </div>
      </header>
      <div class="carrusel">
        <div class="fila revelar" id="fila-${c.id}">
          ${c.productos.map((p) => tarjetaProducto(p)).join('')}
        </div>
      </div>
    </div>
  </section>`
  ).join('');

  $('#rejilla-estrellas').innerHTML = v.semana.map((p, i) => tarjetaProducto(p, i + 1)).join('');
  $('#rejilla-ofertas').innerHTML = v.ofertas.map((p) => tarjetaProducto(p)).join('');
  $('#cuenta-ofertas').textContent = v.ofertas.length;

  // Estos dos dependen de que las grillas ya existan en el DOM.
  prepararCarruseles();
  observarRevelado();
}

/* Imagen que no cargue: se marca como fondo neutro en vez de icono roto. */
$$('.producto-foto img, .hero-lamina img').forEach((img) => {
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true });
});

/* ---------------------------------------------------------
   4. INTRO: logo aparece 2 s y la cortina sube
   --------------------------------------------------------- */
(function intro() {
  const cortina = $('#intro');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducido) { cortina.remove(); return; }

  /* La animación vive en el CSS. Aquí solo trancamos el scroll mientras
     la cortina está arriba y borramos el nodo cuando termina de subir. */
  document.body.classList.add('sin-scroll');
  window.scrollTo(0, 0);

  setTimeout(() => document.body.classList.remove('sin-scroll'), 2400);
  cortina.addEventListener('animationend', (e) => {
    if (e.animationName === 'intro-cortina') cortina.remove();
  });
  setTimeout(() => cortina.remove(), 6000); // red por si la pestaña arranca en segundo plano
})();

/* ---------------------------------------------------------
   5. HERO SLIDER (cambio cada 5 s)
   --------------------------------------------------------- */
(function hero() {
  const laminas = $$('.hero-lamina');
  const puntos = $('#hero-puntos');
  const ESPERA = 5000;
  let actual = 0;
  let reloj;

  puntos.innerHTML = laminas
    .map((_, i) => `<button class="hero-punto${i === 0 ? ' activo' : ''}" data-ir="${i}" role="tab" aria-label="Lámina ${i + 1}"></button>`)
    .join('');

  function ir(i) {
    actual = (i + laminas.length) % laminas.length;
    laminas.forEach((l, k) => l.classList.toggle('activa', k === actual));
    $$('.hero-punto', puntos).forEach((p, k) => p.classList.toggle('activo', k === actual));
  }

  const arrancar = () => { reloj = setInterval(() => ir(actual + 1), ESPERA); };
  const parar = () => clearInterval(reloj);
  const reiniciar = () => { parar(); arrancar(); };

  $('#hero-siguiente').addEventListener('click', () => { ir(actual + 1); reiniciar(); });
  $('#hero-anterior').addEventListener('click', () => { ir(actual - 1); reiniciar(); });
  puntos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]');
    if (b) { ir(Number(b.dataset.ir)); reiniciar(); }
  });

  const seccion = $('#hero');
  seccion.addEventListener('mouseenter', parar);
  seccion.addEventListener('mouseleave', arrancar);
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));

  arrancar();
})();

/* ---------------------------------------------------------
   6. CARRUSELES DE CATEGORÍA
   --------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-mover]');
  if (!btn) return;
  const fila = $(`#fila-${btn.dataset.fila}`);
  const paso = fila.firstElementChild?.offsetWidth ?? 240;
  fila.scrollBy({ left: Number(btn.dataset.mover) * (paso + 18) * 2, behavior: 'smooth' });
});

/* Desactiva la flecha cuando ya no hay hacia dónde moverse.
   Se llama después de pintar: antes las filas no existen. */
function prepararCarruseles() {
  $$('.fila').forEach((fila) => {
    const id = fila.id.replace('fila-', '');
    const izq = $(`[data-mover="-1"][data-fila="${id}"]`);
    const der = $(`[data-mover="1"][data-fila="${id}"]`);
    if (!izq || !der) return;
    const revisar = () => {
      izq.disabled = fila.scrollLeft < 8;
      der.disabled = fila.scrollLeft > fila.scrollWidth - fila.clientWidth - 8;
    };
    fila.addEventListener('scroll', revisar, { passive: true });
    addEventListener('resize', revisar);
    revisar();
  });
}

/* ---------------------------------------------------------
   7. BUSCADOR
   --------------------------------------------------------- */
(function buscador() {
  const entrada = $('#input-buscar');
  const caja = $('#resultados-buscar');
  const limpiar = $('#btn-limpiar');
  const zona = $('.buscador');
  const boton = $('#btn-buscar');

  const desplegado = () => zona.classList.contains('abierto');

  function desplegar() {
    zona.classList.add('abierto');
    boton.setAttribute('aria-expanded', 'true');
    entrada.focus();
  }

  /** Solo se repliega si no quedó texto escrito. */
  function replegar(forzar = false) {
    if (!forzar && entrada.value.trim()) return;
    zona.classList.remove('abierto');
    boton.setAttribute('aria-expanded', 'false');
  }

  /* Sin acentos ni mayúsculas: "plomeria" consigue "Plomería". */
  const TILDES = new RegExp('[\\u0300-\\u036f]', 'g');
  const normalizar = (s) =>
    s.toLowerCase().normalize('NFD').replace(TILDES, '');

  function pintar(termino) {
    const t = normalizar(termino.trim());
    if (t.length < 2) { cerrar(); return; }

    const hallados = TODOS.filter((p) =>
      normalizar(`${p.n} ${p.m} ${p.cat}`).includes(t)
    ).slice(0, 8);

    caja.innerHTML = hallados.length
      ? hallados.map((p) => `
          <button class="resultado" data-ir-cat="${p.catId}">
            <img src="/assets/img/${p.img}.jpg" alt="" loading="lazy">
            <span class="resultado-datos">
              <strong>${limpio(p.n)}</strong>
              <span>${limpio(p.m)} · ${limpio(p.cat)}</span>
            </span>
            <span class="resultado-precio">${precio(p.p)}</span>
          </button>`).join('')
      : `<p class="sin-resultados">No conseguimos nada con “${limpio(termino)}”.<br>Escríbenos por WhatsApp y te lo buscamos.</p>`;

    caja.hidden = false;
    entrada.setAttribute('aria-expanded', 'true');
  }

  function cerrar() {
    caja.hidden = true;
    entrada.setAttribute('aria-expanded', 'false');
  }

  entrada.addEventListener('input', () => {
    limpiar.hidden = !entrada.value;
    pintar(entrada.value);
  });
  entrada.addEventListener('focus', () => entrada.value && pintar(entrada.value));

  limpiar.addEventListener('click', () => {
    entrada.value = '';
    limpiar.hidden = true;
    cerrar();
    entrada.focus();
  });

  caja.addEventListener('click', (e) => {
    const r = e.target.closest('[data-ir-cat]');
    if (!r) return;
    cerrar();
    $(`#${r.dataset.irCat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#form-buscar').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!desplegado()) return desplegar();          // primer clic: abre la barra
    if (!entrada.value.trim()) return entrada.focus();
    pintar(entrada.value);
    evento('search', { search_term: entrada.value.trim() });
    avisar(`Buscando “${entrada.value.trim()}” en el catálogo…`);
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.buscador')) return;
    cerrar();
    replegar();
  });

  entrada.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    cerrar();
    if (entrada.value) { entrada.value = ''; limpiar.hidden = true; }
    else { replegar(true); entrada.blur(); }
  });
})();

/* ---------------------------------------------------------
   8. MEGAMENÚ DE PRODUCTOS
   --------------------------------------------------------- */
(function megamenu() {
  const boton = $('#btn-productos');
  const menu = $('#megamenu');

  const abrir = (si) => {
    menu.hidden = !si;
    boton.setAttribute('aria-expanded', String(si));
  };

  boton.addEventListener('click', (e) => {
    e.stopPropagation();
    abrir(menu.hidden);
  });
  menu.addEventListener('click', (e) => e.target.closest('a') && abrir(false));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#desplegable-productos')) abrir(false);
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && abrir(false));
})();

/* Menú de secciones en móvil: solo enfoca la barra desplazable. */
$('#btn-menu').addEventListener('click', () => {
  $('#nav-secundaria').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('#btn-productos').click();
});

/* ---------------------------------------------------------
   9. MODAL DE SESIÓN
   --------------------------------------------------------- */
(function sesion() {
  const modal = $('#modal-sesion');
  let ultimoFoco = null;

  const abrir = () => {
    ultimoFoco = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('sin-scroll');
    $('input', modal).focus();
  };
  const cerrar = () => {
    modal.hidden = true;
    document.body.classList.remove('sin-scroll');
    ultimoFoco?.focus();
  };

  $('#btn-sesion').addEventListener('click', abrir);
  modal.addEventListener('click', (e) => e.target.closest('[data-cerrar-modal]') && cerrar());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !modal.hidden && cerrar());

  $('#form-sesion').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    cerrar();
    avisar('Este es un demo: el inicio de sesión todavía no está conectado.');
  });
})();

/* ---------------------------------------------------------
   10. PRESUPUESTO (contador) Y TOSTADA
   --------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-agregar]');
  if (!btn) return;
  agregar({
    id: btn.dataset.id,
    n: btn.dataset.nombre,
    m: btn.dataset.marca,
    p: Number(btn.dataset.precio),
  });
  avisar(`Agregado: ${btn.dataset.nombre}`);
  evento('add_to_cart', { item_name: btn.dataset.nombre });
});

let relojTostada;
function avisar(texto) {
  const t = $('#tostada');
  t.innerHTML = `<svg class="ico"><use href="#i-check"/></svg> ${limpio(texto)}`;
  t.hidden = false;
  clearTimeout(relojTostada);
  relojTostada = setTimeout(() => (t.hidden = true), 3200);
}

/* ---------------------------------------------------------
   11. BOLETÍN
   --------------------------------------------------------- */
$('#form-boletin').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  avisar('Listo, te avisamos apenas salgan las ofertas.');
});

/* ---------------------------------------------------------
   12. REVELADO AL SCROLL + BOTÓN "ARRIBA"
   --------------------------------------------------------- */
const observador = new IntersectionObserver(
  (entradas) => entradas.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      observador.unobserve(en.target);
    }
  }),
  { rootMargin: '0px 0px -60px 0px', threshold: 0.05 }
);
/* Se llama al pintar y también acá, para lo que ya está en el HTML fijo. */
function observarRevelado() {
  $$('.revelar:not(.visible)').forEach((el) => observador.observe(el));
}
observarRevelado();

const btnArriba = $('#btn-arriba');
addEventListener('scroll', () => {
  btnArriba.hidden = scrollY < 700;
}, { passive: true });
btnArriba.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* Marca vuelve al inicio */
$('[data-inicio]').addEventListener('click', (e) => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------------------------------------------------------
   13. VENTANA DE CHAT
   La interfaz ya es la definitiva. El bot todavía no existe: hasta F7
   contesta una plantilla fija que deriva a WhatsApp. Cuando llegue la API,
   lo único que cambia es el cuerpo de responder().
   --------------------------------------------------------- */
(function chat() {
  const panel = $('#panel-chat');
  const boton = $('#btn-chat');
  const lista = $('#chat-mensajes');
  const entrada = $('#chat-entrada');
  const WHATSAPP = 'https://wa.me/message/N5EYYCMCKHH2M1';

  /** Agrega una burbuja. `crudo` solo para HTML nuestro, nunca del usuario. */
  function burbuja(texto, quien, crudo = false) {
    const el = document.createElement('div');
    el.className = `chat-msg de-${quien}`;
    el[crudo ? 'innerHTML' : 'textContent'] = texto;
    lista.append(el);
    lista.scrollTop = lista.scrollHeight;
    return el;
  }

  function abrir() {
    panel.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    evento('abrir_chat');
    if (!lista.children.length) {
      burbuja('¡Hola! Soy el asistente de Casa Herramientas. Decime qué estás buscando y te ayudo a encontrarlo.', 'bot');
    }
    entrada.focus();
  }

  function cerrar() {
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    boton.focus();
  }

  // ponytail: respuesta fija con retardo simulado. En F7 esto pasa a ser
  // un fetch a la API del bot; la burbuja de "escribiendo" ya queda lista
  // para la espera real.
  function responder() {
    const pensando = burbuja('<span class="chat-escribiendo"><i></i><i></i><i></i></span>', 'bot', true);
    setTimeout(() => {
      pensando.remove();
      burbuja(
        'Todavía no estoy conectado — el asistente entra en línea muy pronto. '
        + `Mientras tanto te atendemos por <a href="${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>.`,
        'bot', true
      );
    }, 900);
  }

  boton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar()));
  $('#chat-cerrar').addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !panel.hidden && cerrar());

  $('#chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = entrada.value.trim();
    if (!texto) return;
    burbuja(texto, 'usuario');          // textContent: nada de HTML del usuario
    entrada.value = '';
    responder();
  });
})();

iniciarConsentimiento();
iniciarCarrito();

/* Arranque de las vitrinas. Va al final: para acá ya están declaradas todas
   las funciones que pintar() necesita. */
traerVitrinas().then(pintar);

/* Año del pie */
$('#anio').textContent = new Date().getFullYear();
