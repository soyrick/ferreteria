/* =========================================================
   Casa Herramientas — comportamiento de la home.
   ========================================================= */

import { iniciarConsentimiento, evento } from './analitica.js';
import { agregar, iniciar as iniciarCarrito } from './carrito.js';
import { tarjetaProducto, precio, limpio } from './tarjeta.js';
import { avisar } from './tostada.js';
import './vistaproducto.js';

/* ---------------------------------------------------------
   1. CATÁLOGO
   Ya no hay datos en el código: los 8.437 productos vienen de la API del
   negocio, que se consulta a través de /api/catalogo.json y
   /api/vitrinas.json. Esas rutas corren en nuestro servidor porque la URL
   de la API lleva el token adentro y no puede llegar al navegador.
   --------------------------------------------------------- */


/* ---------------------------------------------------------
   2. UTILIDADES
   --------------------------------------------------------- */
/* Marca que el JS corre: habilita los estados que el CSS esconde a propósito. */
document.documentElement.classList.add('js');

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ---------------------------------------------------------
   3. PINTAR LAS VITRINAS
   Los datos vienen de /api/vitrinas.json: el catálogo real del negocio, con
   la selección que el panel haya guardado encima.
   --------------------------------------------------------- */
/* Ya no hay catálogo de respaldo dentro del JavaScript: son 8.437 productos con
   precios que cambian durante el día, no se pueden empaquetar. Si la API no
   contesta, la página lo dice; mostrar precios viejos sería peor que no
   mostrar nada. */
const VACIO = { categorias: [], topventas: [], ofertas: [] };

/* La sección "En oferta" se esconde cuando no hay ninguna vigente, así que los
   enlaces que apuntan a ella se quedarían sin destino: el clic no haría nada y
   parecería que la página está rota. Cuando eso pasa, avisan en voz alta. */
let hayOfertas = false;

async function traerVitrinas() {
  try {
    const r = await fetch('/api/vitrinas.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const v = await r.json();
    if (!Array.isArray(v.categorias)) throw new Error('respuesta inesperada');
    return v;
  } catch (e) {
    console.warn('[vitrinas] catálogo no disponible:', e.message);
    return VACIO;
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
        </div>
        <div class="seccion-acciones">
          <a class="enlace-todo" href="/categoria/${limpio(c.id)}">Ver todo <svg class="ico"><use href="#i-der"/></svg></a>
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

  $('#rejilla-estrellas').innerHTML = v.topventas.map((p, i) => tarjetaProducto(p, i + 1)).join('');
  $('#rejilla-ofertas').innerHTML = v.ofertas.map((p) => tarjetaProducto(p)).join('');
  // Con una sola oferta el texto decía "1 productos".
  $('#cuenta-ofertas').textContent = v.ofertas.length;
  $('#cuenta-ofertas-palabra').textContent = v.ofertas.length === 1 ? 'producto' : 'productos';

  /* Una vitrina sin nada no se deja como un hueco mudo: o el panel todavía no
     eligió, o la API no contestó. En ambos casos conviene decirlo. */
  const sinNada = !v.categorias.length && !v.topventas.length && !v.ofertas.length;
  $('#catalogo-caido').hidden = !sinNada;
  $('#estrellas').hidden = !v.topventas.length;
  $('#ofertas').hidden = !v.ofertas.length;
  hayOfertas = v.ofertas.length > 0;

  /* El menú lista las categorías completas del negocio, no solo las ocho que
     salen en la portada: son los 32 rubros reales que maneja la tienda.
     Llevan a la página del rubro y no a un ancla de la home, porque
     veinticuatro de los treinta y dos no tienen fila propia. */
  $('#megamenu-lista').innerHTML = (v.rubros ?? []).map((r) => `
    <a class="megamenu-rubro" href="/categoria/${limpio(r.id)}">
      <strong>${limpio(r.nombre)}</strong>
      <span>${r.total}</span>
    </a>`).join('');

  /* Las cifras de "Somos Casa Herramientas": salen del catálogo, no escritas a
     mano. Si la API no contestó, el bloque no se muestra. */
  if (v.cifras) {
    const mil = (n) => n.toLocaleString('es-VE');
    $('#cifra-productos').textContent = mil(v.cifras.productos);
    $('#cifra-rubros').textContent = mil(v.cifras.rubros);
    $('#cifra-marcas').textContent = mil(v.cifras.marcas);
    $('#info-numeros').hidden = false;
  }

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

  /* Pausa explícita. El hover ya paraba el carrusel, pero con teclado o en un
     teléfono no hay hover: quien necesite tiempo para leer una lámina no tenía
     forma de detenerla.

     `detenido` manda sobre el hover: si alguien pausó a propósito, salir con el
     mouse no lo vuelve a arrancar. */
  const botonPausa = $('#hero-pausa');
  let detenido = false;

  const original = { arrancar, parar };
  const arrancarSiCorresponde = () => { if (!detenido) original.arrancar(); };
  seccion.removeEventListener('mouseleave', arrancar);
  seccion.addEventListener('mouseleave', arrancarSiCorresponde);

  botonPausa.addEventListener('click', () => {
    detenido = !detenido;
    if (detenido) original.parar(); else original.arrancar();
    botonPausa.classList.toggle('pausado', detenido);
    botonPausa.setAttribute('aria-label', detenido ? 'Reanudar el carrusel' : 'Pausar el carrusel');
  });

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
  const campo = $('.buscador-campo');
  const boton = $('#btn-buscar');

  /* Se mide el campo en vez de mirar la clase: en el teléfono el CSS lo deja
     desplegado sin que nadie toque nada, y ahí el primer envío tiene que
     buscar, no "abrir" algo que ya está abierto.

     Se mide el contenedor, no el input: el input mide 4px aun plegado, por los
     2px de relleno que le pone el navegador por su cuenta. Midiéndolo a él,
     esto daba «abierto» siempre y en el escritorio el botón no abría nada. */
  const desplegado = () =>
    zona.classList.contains('abierto') || campo.getBoundingClientRect().width > 0;

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

  /* La búsqueda va al servidor: son 8.437 productos, no se pueden traer todos
     al navegador para filtrarlos acá. Se espera a que la persona deje de
     escribir y se cancela la consulta anterior, así tipear rápido no dispara
     una petición por tecla ni deja que una respuesta vieja pise a la nueva. */
  const ESPERA_TECLA = 300;
  let relojBusca;
  let enCurso;

  async function pintar(termino) {
    const t = termino.trim();
    if (t.length < 2) { cerrar(); return; }

    enCurso?.abort();
    enCurso = new AbortController();

    try {
      const r = await fetch(`/api/catalogo.json?q=${encodeURIComponent(t)}&limit=8`,
                            { signal: enCurso.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { productos: hallados = [], total = 0 } = await r.json();

      caja.innerHTML = hallados.length
        ? hallados.map((p) => `
            <a class="resultado" href="${limpio(p.url)}"
               data-ficha="${limpio(p.codigo)}">
              <span class="resultado-datos">
                <strong>${limpio(p.nombre)}</strong>
                <span>${limpio(p.marca || p.categoria)}${p.disponible ? '' : ' · agotado'}</span>
              </span>
              <span class="resultado-precio">${p.precio ? precio(p.precio) : 'Consultar'}</span>
            </a>`).join('')
          + (total > hallados.length
              ? `<p class="resultado-mas">y ${total - hallados.length} más</p>` : '')
        : `<p class="sin-resultados">No conseguimos nada con “${limpio(t)}”.<br>Escríbenos por WhatsApp y te lo buscamos.</p>`;

      caja.hidden = false;
      entrada.setAttribute('aria-expanded', 'true');
    } catch (e) {
      if (e.name === 'AbortError') return;   // la reemplazó una búsqueda nueva
      caja.innerHTML = '<p class="sin-resultados">No pudimos buscar ahora mismo. Intenta de nuevo en un momento.</p>';
      caja.hidden = false;
    }
  }

  function cerrar() {
    caja.hidden = true;
    entrada.setAttribute('aria-expanded', 'false');
  }

  entrada.addEventListener('input', () => {
    limpiar.hidden = !entrada.value;
    clearTimeout(relojBusca);
    relojBusca = setTimeout(() => pintar(entrada.value), ESPERA_TECLA);
  });
  entrada.addEventListener('focus', () => entrada.value && pintar(entrada.value));

  limpiar.addEventListener('click', () => {
    entrada.value = '';
    limpiar.hidden = true;
    cerrar();
    entrada.focus();
  });

  /* El resultado es un enlace a la ficha; vistaproducto.js lo intercepta para
     abrir el panel. Acá solo hay que cerrar la lista. */
  caja.addEventListener('click', (e) => {
    if (e.target.closest('[data-ficha]')) cerrar();
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

/* Cualquier enlace que apunte a las ofertas: el botón del menú y el del hero.
   Sin ofertas publicadas la sección está escondida, así que el clic no llevaría
   a ningún lado y parecería que la página no responde.

   Se mira el destino y no una clase: el del hero no la tiene, y era la razón
   de que ese botón no hiciera nada. */
document.addEventListener('click', (e) => {
  const enlace = e.target.closest('a[href="#ofertas"]');
  if (!enlace || hayOfertas) return;
  e.preventDefault();
  avisar('Por ahora no hay ofertas activas.');
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

iniciarConsentimiento();
iniciarCarrito();

/* Arranque de las vitrinas. Va al final: para acá ya están declaradas todas
   las funciones que pintar() necesita. */
traerVitrinas().then(pintar);

/* Año del pie */
$('#anio').textContent = new Date().getFullYear();
