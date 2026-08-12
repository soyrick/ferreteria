// Servidor estatico minimo para el demo. Cero dependencias.
// ponytail: sirve archivos desde ./public y nada mas. Si hace falta API, usar express.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = fileURLToPath(new URL('./public', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return responder(res, 400, 'Solicitud invalida');
  }

  const relativo = normalize(ruta === '/' ? 'index.html' : ruta.slice(1));
  const archivo = join(ROOT, relativo);

  // Frontera de confianza: nada fuera de ./public, pase lo que pase en la URL.
  if (archivo !== ROOT && !archivo.startsWith(ROOT + sep)) {
    return responder(res, 403, 'Prohibido');
  }

  try {
    const datos = await readFile(archivo);
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(archivo).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(datos);
  } catch {
    responder(res, 404, 'No encontrado');
  }
}).listen(PORT, () => {
  console.log(`\n  Casa Herramientas — demo corriendo en http://localhost:${PORT}\n`);
});

function responder(res, codigo, texto) {
  res.writeHead(codigo, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(texto);
}
