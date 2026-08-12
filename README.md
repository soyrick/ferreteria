# Casa Herramientas — demo de interfaz

Demo de la página principal de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H),
Calle Guayaquil, frente al estadio de béisbol de Barrio Sucre, Barcelona, estado Anzoátegui.

HTML, CSS y JavaScript sin dependencias. No hace falta `npm install`.

## Correr en local

```bash
npm start
```

Queda en `http://localhost:3000`. El servidor ([server.js](server.js)) es un estático
mínimo de Node, cero dependencias, y sirve todo con `Cache-Control: no-cache`: editás
un archivo de `public/`, refrescás, y ya está.

## Deploy

El sitio es 100 % estático, así que en Vercel no corre `server.js` — se publica el
contenido de `public/` tal cual. Eso está declarado en [vercel.json](vercel.json):

```json
{ "framework": null, "outputDirectory": "public" }
```

Importás el repo en Vercel y no hay que configurar nada más: sin build command,
sin variables de entorno.

## Estructura

```
public/
  index.html      estructura y sprite de iconos SVG
  styles.css      diseño completo, tokens de color en :root
  app.js          catálogo de ejemplo (46 productos) y toda la interacción
  assets/
    logo.png
    img/          50 imágenes locales
    img/CREDITOS.txt   origen y licencia de cada imagen
server.js         servidor estático para desarrollo local
```

El amarillo de la marca (`--amarillo: #FFDD00`) está muestreado del propio `logo.png`.
No cambiarlo sin volver a muestrear el archivo: de ahí depende que el fondo de la
pantalla de entrada y el logo se vean como una sola pieza.

## Pendientes antes de producción

- **Licencias de las imágenes.** Las 50 vienen de Wikimedia Commons con licencias
  variadas (CC BY, CC BY-SA, dominio público). Hay que revisarlas una por una y dar
  la atribución que cada una exija, o —mejor— reemplazarlas por fotos reales de la
  mercancía. Ver [CREDITOS.txt](public/assets/img/CREDITOS.txt).
- **Datos de contacto.** Teléfono, correo, horarios y dos de las tres sucursales son
  de ejemplo. Están marcados en el HTML con `<!-- DATO PLACEHOLDER -->`.
- **Precios e inventario.** El catálogo de `app.js` es de muestra.
- **Inicio de sesión.** El modal es solo la interfaz; no hay backend detrás.
