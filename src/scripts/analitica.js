/* Google Analytics 4 + consentimiento.
   Nada de Google se carga hasta que la persona acepta: por eso el banner no
   trae un botón "aceptar" gigante y otro escondido. Rechazar es un clic igual
   de fácil, y es el estado por defecto mientras no responda. */

const ID = import.meta.env.PUBLIC_GA_ID;
const CLAVE = 'ch_consentimiento';

let cargado = false;

function cargarGA() {
  if (cargado || !ID) return;
  cargado = true;

  const etiqueta = document.createElement('script');
  etiqueta.async = true;
  etiqueta.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.append(etiqueta);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID, { anonymize_ip: true });
}

/** Registra un evento. Si no hay consentimiento o no hay ID, no hace nada. */
export function evento(nombre, datos = {}) {
  window.gtag?.('event', nombre, datos);
}

/* El banner se apoya abajo a la derecha, justo donde viven los botones
   flotantes, y va por encima de ellos. Sin correrlos, tocar el carrito
   terminaba pulsando "Aceptar" sin querer. Se publica su alto y el CSS los
   levanta; al responder vuelve a cero y bajan solos. */
function correrFlotantes(banner) {
  const alto = banner && !banner.hidden ? banner.getBoundingClientRect().height + 12 : 0;
  document.documentElement.style.setProperty('--sube-flotantes', `${Math.round(alto)}px`);
}

export function iniciarConsentimiento() {
  // Sin ID configurado no hay nada que consentir: no molestamos con el banner.
  if (!ID) return;

  /* La decisión se mira antes que el banner. El banner solo está en la home,
     pero el permiso vale para todo el sitio: sin esto, quien acepta y después
     entra a un rubro navega sin analítica, y las búsquedas y los "agregar" de
     esa pantalla no se contaban. */
  const decision = localStorage.getItem(CLAVE);
  if (decision === 'si') { cargarGA(); return; }
  if (decision === 'no') return;

  // Todavía no respondió: solo se le puede preguntar donde está el banner.
  const banner = document.getElementById('consentimiento');
  if (!banner) return;

  banner.hidden = false;
  correrFlotantes(banner);
  // El banner cambia de alto al girar el teléfono o al cambiar el ancho.
  addEventListener('resize', () => correrFlotantes(banner), { passive: true });

  const responder = (valor, despues) => {
    localStorage.setItem(CLAVE, valor);
    banner.hidden = true;
    correrFlotantes(banner);
    despues?.();
  };

  banner.querySelector('#consent-si').addEventListener('click', () => responder('si', cargarGA));
  banner.querySelector('#consent-no').addEventListener('click', () => responder('no'));
}
