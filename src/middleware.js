/* Puerta única de /admin. Va en middleware y no repartido por página: una sola
   puerta es una sola cosa que auditar, y una página nueva queda protegida sin
   que nadie se acuerde de agregarle el control. */
import { verificar } from './lib/sesion.js';

const ENTRAR = '/admin/entrar';

export async function onRequest(contexto, siguiente) {
  const { pathname } = contexto.url;

  if (!pathname.startsWith('/admin')) return siguiente();
  if (pathname === ENTRAR) return siguiente();

  const secreto = import.meta.env.ADMIN_SECRETO;
  const token = contexto.cookies.get('ch_sesion')?.value;
  const sesion = secreto && token ? await verificar(token, secreto) : null;

  if (!sesion) {
    return contexto.redirect(`${ENTRAR}?volver=${encodeURIComponent(pathname)}`, 302);
  }

  contexto.locals.sesion = sesion;
  return siguiente();
}
