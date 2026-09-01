/* Carrito. Vive en localStorage y se cierra por WhatsApp: no hay pasarela de
   pago ni cuenta de usuario detrás, la venta se termina conversando.

   ponytail: sin backend. El pedido no queda registrado en ningún lado más que
   en el chat. Si algún día hace falta historial de pedidos, ahí sí entra una
   tabla — hoy sería una tabla que nadie lee. */

import { trabarFondo, precio, limpio } from './tarjeta.js';
import { enlace, recortar } from './whatsapp.js';

const CLAVE = 'ch_carrito';

const $ = (s, c = document) => c.querySelector(s);

/** [{ id, n, m, p, cant }] */
let items = cargar();

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(guardado) ? guardado.filter((i) => i?.id && i?.cant > 0) : [];
  } catch {
    return [];   // storage corrupto o bloqueado: se arranca vacío
  }
}

function persistir() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Modo privado o storage lleno: el carrito sigue vivo en memoria.
  }
}

export const unidades = () => items.reduce((n, i) => n + i.cant, 0);
export const total = () => items.reduce((n, i) => n + i.p * i.cant, 0);

export function agregar({ id, n, m, p }) {
  const ya = items.find((i) => i.id === id);
  if (ya) ya.cant++;
  else items.push({ id, n, m, p, cant: 1 });
  persistir();
  pintar();
}

function cambiar(id, delta) {
  const i = items.find((x) => x.id === id);
  if (!i) return;
  i.cant += delta;
  if (i.cant < 1) items = items.filter((x) => x.id !== id);
  persistir();
  pintar();
}

function vaciar() {
  items = [];
  persistir();
  pintar();
}

/** Arma el texto del pedido. Recorta si se pasa del largo que aguanta wa.me. */
export function mensaje() {
  const lineas = items.map((i) => `• ${i.cant} × ${i.n} — ${precio(i.p * i.cant)}`);
  return recortar(lineas, (ls, cortadas = 0) =>
    ['¡Hola! Quiero hacer este pedido:', '', ...ls,
      ...(cortadas ? [`…y ${cortadas} producto${cortadas > 1 ? 's' : ''} más.`] : []),
      '', `Total: ${precio(total())}`].join('\n'));
}

export const enlaceWhatsapp = () => enlace(mensaje());

/* ---------- Interfaz ---------- */

function pintar() {
  const contador = $('#contador-carrito');
  // La ficha de producto reusa agregar() pero no monta el panel: sin contador
  // no hay nada que repintar, y el pedido igual quedó guardado.
  if (!contador) return;

  const n = unidades();
  contador.textContent = n;
  contador.hidden = n === 0;

  const lista = $('#carrito-items');
  const vacio = $('#carrito-vacio');
  const pie = $('#carrito-pie');

  vacio.hidden = items.length > 0;
  pie.hidden = items.length === 0;

  lista.innerHTML = items.map((i) => `
    <li class="carrito-item">
      <div class="carrito-datos">
        <strong>${limpio(i.n)}</strong>
        <small>${limpio(i.m ?? '')} · ${precio(i.p)} c/u</small>
      </div>
      <div class="carrito-cant">
        <button data-menos="${i.id}" aria-label="Quitar uno de ${limpio(i.n)}">−</button>
        <span aria-label="Cantidad">${i.cant}</span>
        <button data-mas="${i.id}" aria-label="Agregar uno de ${limpio(i.n)}">+</button>
      </div>
      <span class="carrito-linea">${precio(i.p * i.cant)}</span>
    </li>`).join('');

  $('#carrito-total').textContent = precio(total());
  $('#carrito-enviar').href = enlaceWhatsapp();
}

export function abrir() {
  $('#panel-carrito').hidden = false;
  trabarFondo();
  $('#carrito-cerrar').focus();
}

export function cerrar() {
  $('#panel-carrito').hidden = true;
  // trabarFondo mira todas las capas: si quedó otra abierta, el fondo no se suelta.
  trabarFondo();
  $('#btn-carrito').focus();
}

export function iniciar() {
  pintar();

  $('#btn-carrito').addEventListener('click', abrir);
  $('#carrito-cerrar').addEventListener('click', cerrar);
  $('#carrito-fondo').addEventListener('click', cerrar);
  $('#carrito-vaciar').addEventListener('click', vaciar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#panel-carrito').hidden) cerrar();
  });

  // Delegado: las filas se repintan enteras en cada cambio.
  $('#carrito-items').addEventListener('click', (e) => {
    const mas = e.target.closest('[data-mas]');
    const menos = e.target.closest('[data-menos]');
    if (mas) cambiar(mas.dataset.mas, +1);
    if (menos) cambiar(menos.dataset.menos, -1);
  });
}
