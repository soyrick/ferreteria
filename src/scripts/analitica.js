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

export function iniciarConsentimiento() {
  const banner = document.getElementById('consentimiento');
  if (!banner) return;

  // Sin ID configurado no hay nada que consentir: no molestamos con el banner.
  if (!ID) return;

  const decision = localStorage.getItem(CLAVE);
  if (decision === 'si') { cargarGA(); return; }
  if (decision === 'no') return;

  banner.hidden = false;

  banner.querySelector('#consent-si').addEventListener('click', () => {
    localStorage.setItem(CLAVE, 'si');
    banner.hidden = true;
    cargarGA();
  });

  banner.querySelector('#consent-no').addEventListener('click', () => {
    localStorage.setItem(CLAVE, 'no');
    banner.hidden = true;
  });
}
