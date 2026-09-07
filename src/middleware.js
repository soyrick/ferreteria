/* La puerta de /admin. Una sola cosa, y es esta.

   Acá también vivían las seis cabeceras de seguridad, y era un error: el
   middleware **solo corre en las rutas que se renderizan por petición**. La
   home está prerenderizada, así que Vercel la sirve como archivo estático
   desde la CDN sin pasar por acá — o sea que la página más visitada del sitio
   quedaba sin CSP, sin X-Frame-Options y sin nosniff. Se descubrió el
   2026-09-07 midiendo contra el dominio real; la auditoría de F10 no lo vio
   porque se verificó contra el servidor de desarrollo, donde todo pasa por el
   middleware.

   Las cabeceras viven ahora en `vercel.json`, que las aplica en el borde a
   todo, estático incluido. Están medidas en producción: las seis presentes en
   rutas estáticas y dinámicas, una sola CSP por respuesta.

   Si hay que tocarlas, se tocan allá. Acá no vuelven: dos copias de la misma
   política terminan divergiendo, y dos CSP distintas se aplican como
   intersección, que rompe cosas sin dejar rastro. */
import { verificar } from './lib/sesion.js';

const ENTRAR = '/admin/entrar';

export async function onRequest(contexto, siguiente) {
  const { pathname } = contexto.url;

  if (pathname.startsWith('/admin') && pathname !== ENTRAR) {
    // import.meta.env solo existe dentro de Vite; el fallback deja este archivo
    // ejecutable desde Node suelto, que es como se lo prueba.
    const secreto = (import.meta.env ?? process.env).ADMIN_SECRETO;
    const token = contexto.cookies.get('ch_sesion')?.value;
    const sesion = secreto && token ? await verificar(token, secreto) : null;

    if (!sesion) {
      return contexto.redirect(`${ENTRAR}?volver=${encodeURIComponent(pathname)}`, 302);
    }
    contexto.locals.sesion = sesion;
  }

  return siguiente();
}
