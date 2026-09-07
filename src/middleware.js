/* Dos cosas pasan por acá: la puerta de /admin y las cabeceras de seguridad.

   OJO con las cabeceras: **esto no alcanza en producción**. El middleware solo
   corre en las rutas que se renderizan por petición. La home está
   prerenderizada, así que Vercel la sirve como archivo estático desde la CDN y
   nunca pasa por acá — se comprobó el 2026-09-07 contra el dominio real: la
   home venía sin CSP y las rutas dinámicas con todo puesto.

   Por eso las mismas seis cabeceras están declaradas en `vercel.json`, que sí
   las aplica en el borde a todo, estático incluido. Los valores de los dos
   lados son idénticos —si difieren, el navegador aplica la intersección de las
   dos CSP y algo se rompe sin avisar—, así que si tocás una, tocá la otra.

   Esta duplicación es temporal: una vez medido en producción que el borde las
   pone en todas las rutas, se van de acá y el middleware vuelve a hacer una
   sola cosa, que es cuidar /admin. */
import { verificar } from './lib/sesion.js';

const ENTRAR = '/admin/entrar';

/* Política de contenido. Dice de dónde puede cargar cosas la página; si algo
   logra inyectar un <script> ajeno, el navegador se niega a ejecutarlo.

   Cada permiso está por una razón concreta:
   - 'unsafe-inline' en script y style: Astro pone los estilos y algún script
     en línea. Sacarlo pide nonces por respuesta, y la home es estática.
   - fonts.googleapis / gstatic: la tipografía de la marca.
   - maps.google / *.googleapis: el mapa del pie.
   - googletagmanager y google-analytics: solo se cargan si el visitante
     acepta, pero la política tiene que permitirlos por adelantado.
   - frame-ancestors 'none': nadie puede meter la tienda en un iframe, que es
     como se arman las estafas de clics.
   - form-action 'self': un formulario no puede enviarse a otro dominio. */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src https://maps.google.com https://www.google.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const CABECERAS = {
  'Content-Security-Policy': CSP,
  // Un año de HTTPS obligatorio. Sin esto, la primera visita puede ir por HTTP
  // y ahí es donde alguien en la misma red se mete en el medio.
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // El navegador respeta el Content-Type y no adivina: un .txt con HTML
  // adentro deja de ejecutarse como página.
  'X-Content-Type-Options': 'nosniff',
  // Al salir del sitio se manda el dominio, nunca la dirección completa: si
  // alguien comparte una ficha, el destino no ve qué producto miraba.
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // La tienda no usa cámara, micrófono ni ubicación. Se apagan de entrada.
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  // Para navegadores viejos que no entienden frame-ancestors.
  'X-Frame-Options': 'DENY',
};

export async function onRequest(contexto, siguiente) {
  const { pathname } = contexto.url;

  const conCabeceras = (respuesta) => {
    for (const [nombre, valor] of Object.entries(CABECERAS)) {
      respuesta.headers.set(nombre, valor);
    }
    return respuesta;
  };

  if (pathname.startsWith('/admin') && pathname !== ENTRAR) {
    // import.meta.env solo existe dentro de Vite; el fallback deja este archivo
    // ejecutable desde Node suelto, que es como se lo prueba.
    const secreto = (import.meta.env ?? process.env).ADMIN_SECRETO;
    const token = contexto.cookies.get('ch_sesion')?.value;
    const sesion = secreto && token ? await verificar(token, secreto) : null;

    if (!sesion) {
      return conCabeceras(
        contexto.redirect(`${ENTRAR}?volver=${encodeURIComponent(pathname)}`, 302),
      );
    }
    contexto.locals.sesion = sesion;
  }

  return conCabeceras(await siguiente());
}
