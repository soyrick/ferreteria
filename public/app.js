/* =========================================================
   Casa Herramientas — demo de interfaz
   Datos de ejemplo + comportamiento de la home.
   ========================================================= */

/* ---------------------------------------------------------
   1. CATÁLOGO DE EJEMPLO
   n = nombre · m = marca · p = precio · pa = precio anterior
   img = archivo en assets/img · et = etiqueta · v = valoración
   --------------------------------------------------------- */
const CATEGORIAS = [
  {
    id: 'hogar',
    nombre: 'Hogar',
    lema: 'Lo que hace falta en la casa: limpieza, cerraduras, organización y esos arreglitos del fin de semana.',
    productos: [
      { n: 'Tobo industrial reforzado 12 litros', m: 'Plastihogar', p: 4.50, img: 'tobo-industrial', v: 4.6 },
      { n: 'Coleto de microfibra con mango de aluminio', m: 'Limpiex', p: 6.90, pa: 8.50, img: 'coleto-microfibra', et: 'oferta', v: 4.8 },
      { n: 'Escalera de aluminio 5 peldaños', m: 'Truper', p: 78.00, img: 'escalera-aluminio', v: 4.9 },
      { n: 'Cerradura de seguridad doble paso', m: 'Yale', p: 24.50, img: 'cerradura-seguridad', et: 'nuevo', v: 4.7 },
      { n: 'Surtido de tornillería 200 piezas', m: 'Stanley', p: 18.90, img: 'organizador-gavetas', v: 4.5 },
      { n: 'Juego de bisagras 3" acero inoxidable (4 pzas)', m: 'Total', p: 5.20, img: 'juego-bisagras', v: 4.4 },
    ],
  },
  {
    id: 'construccion',
    nombre: 'Construcción',
    lema: 'Desde la primera cabilla hasta el último saco. Cotizamos la obra completa y te la despachamos.',
    productos: [
      { n: 'Saco de cemento gris 42,5 kg', m: 'Venezolana de Cementos', p: 9.80, img: 'cemento-gris', v: 4.7 },
      { n: 'Cabilla estriada 3/8" x 12 m', m: 'Sidor', p: 11.40, img: 'cabilla-estriada', v: 4.6 },
      { n: 'Carretilla de obra reforzada 6 pies³', m: 'Truper', p: 62.00, pa: 74.00, img: 'carretilla-obra', et: 'oferta', v: 4.8 },
      { n: 'Cuchara de albañil 8" mango de madera', m: 'Total', p: 7.30, img: 'cuchara-albanil', v: 4.5 },
      { n: 'Nivel de burbuja de aluminio 60 cm', m: 'Stanley', p: 12.80, img: 'nivel-burbuja', v: 4.9 },
      { n: 'Malla truckson electrosoldada 2 x 1 m', m: 'Ferrominera', p: 16.50, img: 'malla-truckson', v: 4.4 },
    ],
  },
  {
    id: 'electricas',
    nombre: 'Herramientas eléctricas',
    lema: 'Marcas que aguantan trabajo pesado, con garantía y repuestos aquí mismo en la tienda.',
    productos: [
      { n: 'Taladro percutor 1/2" 750 W', m: 'Bosch', p: 58.00, pa: 72.00, img: 'taladro-percutor', et: 'oferta', v: 4.9 },
      { n: 'Esmeril angular 4½" 900 W', m: 'DeWalt', p: 46.50, img: 'esmeril-angular', v: 4.8 },
      { n: 'Sierra caladora 650 W velocidad variable', m: 'Black+Decker', p: 52.00, img: 'sierra-caladora', v: 4.6 },
      { n: 'Lijadora orbital 5" con bolsa recolectora', m: 'Ingco', p: 41.00, img: 'lijadora-orbital', v: 4.5 },
      { n: 'Atornillador inalámbrico 20V con 2 baterías', m: 'DeWalt', p: 67.00, img: 'atornillador-bateria', et: 'nuevo', v: 5.0 },
      { n: 'Pistola de calor 2000 W dos temperaturas', m: 'Total', p: 29.90, img: 'pistola-calor', v: 4.4 },
    ],
  },
  {
    id: 'plomeria',
    nombre: 'Plomería',
    lema: 'Tubería, conexiones, grifería y piezas sanitarias. Te decimos exactamente qué medida te sirve.',
    productos: [
      { n: 'Llave de paso PVC 1/2"', m: 'Pavco', p: 2.80, img: 'llave-paso', v: 4.3 },
      { n: 'Tubería PVC 1/2" x 6 m presión', m: 'Pavco', p: 6.40, img: 'tuberia-pvc', v: 4.7 },
      { n: 'Grifería de lavamanos cromada monomando', m: 'Fanaven', p: 28.00, pa: 35.00, img: 'griferia-lavamanos', et: 'oferta', v: 4.6 },
      { n: 'Poceta blanca de losa con tanque', m: 'Fanaven', p: 95.00, img: 'poceta-blanca', v: 4.8 },
      { n: 'Teflón 12 mm rollo (paquete de 10)', m: '3M', p: 3.50, img: 'teflon-rollo', v: 4.5 },
      { n: 'Manguera de jardín reforzada 15 m', m: 'Rotoplas', p: 19.90, img: 'manguera-jardin', v: 4.4 },
    ],
  },
  {
    id: 'electricidad',
    nombre: 'Electricidad',
    lema: 'Iluminación, cableado, protección y medición. Todo con certificación para que no te quedes a oscuras.',
    productos: [
      { n: 'Bombillo LED 12 W luz blanca (rosca E27)', m: 'Philips', p: 2.20, img: 'bombillo-led', v: 4.7 },
      { n: 'Cable THW #12 rollo de 100 m', m: 'Cabel', p: 48.00, pa: 56.00, img: 'cable-thw', et: 'oferta', v: 4.9 },
      { n: 'Breaker monofásico 20 A enchufable', m: 'Schneider', p: 6.80, img: 'breaker-monofasico', v: 4.6 },
      { n: 'Tomacorriente doble con placa', m: 'Levinton', p: 3.90, img: 'tomacorriente-doble', v: 4.5 },
      { n: 'Cinta aislante negra (paquete de 5)', m: '3M', p: 4.60, img: 'cinta-aislante', v: 4.8 },
      { n: 'Linterna LED recargable 800 lúmenes', m: 'Ingco', p: 14.50, img: 'linterna-recargable', et: 'nuevo', v: 4.6 },
    ],
  },
];

const ESTRELLAS = [
  { n: 'Set de destornilladores 12 piezas', m: 'Stanley', p: 16.90, pa: 21.00, img: 'set-destornilladores', et: 'oferta', v: 4.9 },
  { n: 'Juego de llaves combinadas 14 piezas', m: 'Truper', p: 34.00, pa: 42.00, img: 'llaves-combinadas', et: 'oferta', v: 4.8 },
  { n: 'Martillo de uña 16 oz mango de fibra', m: 'Stanley', p: 9.80, img: 'martillo-una', v: 4.9 },
  { n: 'Cinta métrica 8 m con freno', m: 'Truper', p: 7.50, img: 'cinta-metrica', v: 4.7 },
  { n: 'Alicate universal 8" aislado', m: 'Total', p: 8.90, img: 'alicate-universal', v: 4.6 },
  { n: 'Juego de cajas de herramientas (3 tamaños)', m: 'Truper', p: 22.00, img: 'caja-herramientas', v: 4.5 },
  { n: 'Pintura de caucho blanca (galón)', m: 'Montana', p: 18.50, pa: 23.00, img: 'pintura-caucho', et: 'oferta', v: 4.7 },
  { n: 'Brocha 4" cerda natural', m: 'Corimon', p: 4.20, img: 'brocha-cerda', v: 4.3 },
  { n: 'Guantes de seguridad reforzados (par)', m: 'Ingco', p: 3.80, img: 'guantes-seguridad', v: 4.4 },
  { n: 'Casco de seguridad con ajuste ratchet', m: '3M', p: 11.00, img: 'casco-seguridad', v: 4.8 },
  { n: 'Candado de bronce 50 mm con 3 llaves', m: 'Yale', p: 8.40, img: 'candado-acero', v: 4.6 },
  { n: 'Extensión eléctrica 10 m con 3 tomas', m: 'Cabel', p: 13.90, img: 'extension-electrica', v: 4.5 },
  { n: 'Silicón transparente + pistola aplicadora', m: 'Sika', p: 10.60, img: 'silicon-pistola', et: 'nuevo', v: 4.6 },
  { n: 'Discos de corte 4½" (paquete de 10)', m: 'Bosch', p: 9.20, img: 'disco-corte', v: 4.9 },
  { n: 'Cepillo de acero mango de madera', m: 'Total', p: 3.60, img: 'cepillo-acero', v: 4.2 },
  { n: 'Multímetro digital con puntas', m: 'Ingco', p: 17.80, pa: 21.50, img: 'multimetro-digital', et: 'oferta', v: 4.7 },
];

/* Índice plano para el buscador */
const TODOS = [
  ...CATEGORIAS.flatMap((c) => c.productos.map((p) => ({ ...p, cat: c.nombre, catId: c.id }))),
  ...ESTRELLAS.map((p) => ({ ...p, cat: 'Estrellas de la semana', catId: 'estrellas' })),
];

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
      <img src="assets/img/${p.img}.jpg" alt="${limpio(p.n)}" loading="lazy">
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
      <button class="producto-agregar" data-agregar="${limpio(p.n)}">
        <svg class="ico"><use href="#i-carrito"/></svg> Agregar
      </button>
    </div>
  </article>`;
}

/* ---------------------------------------------------------
   3. PINTAR CATEGORÍAS Y ESTRELLAS
   --------------------------------------------------------- */
$('#categorias').innerHTML = CATEGORIAS.map(
  (c) => `
  <section class="categoria" id="${c.id}">
    <div class="contenedor">
      <header class="seccion-cabeza revelar">
        <div>
          <span class="mini-etiqueta">Categoría</span>
          <h2>${c.nombre}</h2>
          <p>${c.lema}</p>
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

$('#rejilla-estrellas').innerHTML = ESTRELLAS.map((p, i) => tarjetaProducto(p, i + 1)).join('');

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

/* Desactiva la flecha cuando ya no hay hacia dónde moverse. */
$$('.fila').forEach((fila) => {
  const id = fila.id.replace('fila-', '');
  const izq = $(`[data-mover="-1"][data-fila="${id}"]`);
  const der = $(`[data-mover="1"][data-fila="${id}"]`);
  const revisar = () => {
    izq.disabled = fila.scrollLeft < 8;
    der.disabled = fila.scrollLeft > fila.scrollWidth - fila.clientWidth - 8;
  };
  fila.addEventListener('scroll', revisar, { passive: true });
  addEventListener('resize', revisar);
  revisar();
});

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
            <img src="assets/img/${p.img}.jpg" alt="" loading="lazy">
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
let enCarrito = 0;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-agregar]');
  if (!btn) return;
  enCarrito++;
  const contador = $('#contador-carrito');
  contador.textContent = enCarrito;
  contador.hidden = false;
  avisar(`Agregado al presupuesto: ${btn.dataset.agregar}`);
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
$$('.revelar').forEach((el) => observador.observe(el));

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

/* Año del pie */
$('#anio').textContent = new Date().getFullYear();
