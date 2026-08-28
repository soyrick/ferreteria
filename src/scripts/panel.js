/* Buscador de las pantallas de curaduría.
   Filtra en el cliente lo que ya está en la página: con cientos de productos,
   ir al servidor por cada tecla sería lento y no haría falta. */

const buscador = document.querySelector('#buscar-producto');

if (buscador) {
  const fichas = [...document.querySelectorAll('[data-busca]')];
  const secciones = [...document.querySelectorAll('[data-grupo]')];
  const vacio = document.querySelector('#sin-coincidencias');

  const normalizar = (s) =>
    s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');

  function filtrar() {
    const t = normalizar(buscador.value.trim());
    let visibles = 0;

    for (const f of fichas) {
      const coincide = !t || normalizar(f.dataset.busca).includes(t);
      f.hidden = !coincide;
      if (coincide) visibles++;
    }

    // Una categoría sin resultados se esconde entera, para no dejar títulos huérfanos.
    for (const s of secciones) {
      s.hidden = ![...s.querySelectorAll('[data-busca]')].some((f) => !f.hidden);
    }

    vacio.hidden = visibles > 0;
    vacio.querySelector('[data-termino]').textContent = buscador.value.trim();
  }

  buscador.addEventListener('input', filtrar);
  buscador.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { buscador.value = ''; filtrar(); }
  });

  // Un menú abierto se cierra al abrir otro.
  document.addEventListener('click', (e) => {
    const abierto = e.target.closest('details.menu-prod');
    document.querySelectorAll('details.menu-prod[open]').forEach((d) => {
      if (d !== abierto) d.open = false;
    });
  });
}

/* Descuento en vivo: al escribir el precio de oferta se muestra el porcentaje.
   Se calcula acá y también en el servidor al pintar la tienda — el cliente
   solo adelanta el número para no hacer escribir a ciegas. */
for (const campo of document.querySelectorAll('[data-lista]')) {
  const caja = campo.closest('.oferta-fila')?.querySelector('[data-descuento] strong');
  if (!caja) continue;

  const calcular = () => {
    const lista = Number(campo.dataset.lista);
    const oferta = Number(String(campo.value).replace(',', '.'));
    if (!(oferta > 0) || !(lista > 0) || oferta >= lista) {
      caja.textContent = '—';
      caja.classList.remove('valido');
      return;
    }
    caja.textContent = '−' + Math.round((1 - oferta / lista) * 100) + '%';
    caja.classList.add('valido');
  };

  campo.addEventListener('input', calcular);
  calcular();
}

/* "Indefinida" apaga el campo de fecha. Sin JS igual funciona: al guardar,
   el servidor ignora la fecha si la casilla vino marcada. */
for (const casilla of document.querySelectorAll('[data-indefinida]')) {
  const fecha = casilla.closest('.oferta-vence')?.querySelector('input[type="date"]');
  if (!fecha) continue;
  const sincronizar = () => { fecha.disabled = casilla.checked; if (casilla.checked) fecha.value = ''; };
  casilla.addEventListener('change', sincronizar);
}
