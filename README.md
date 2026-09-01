# Casa Herramientas — demo de interfaz

Demo de la página principal de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H),
Calle Guayaquil, frente al estadio de béisbol de Barrio Sucre, Barcelona, estado Anzoátegui.

Astro, con la tienda estática y el panel en servidor.

## Correr en local

```bash
npm start
```

Queda en `http://localhost:4321`. El panel está en `/admin`.

## Deploy

La tienda se genera estática y solo `/admin` corre en servidor, declarado con
`export const prerender = false` en esas páginas. El adaptador de Vercel se
encarga del resto; en [vercel.json](vercel.json) solo hace falta el framework.

Hay que cargar las variables de entorno en Vercel — ver [.env.example](.env.example).

## Estructura

```
src/
  pages/
    index.astro         la tienda (estática)
    admin/              panel: entrar, estadísticas, productos, topventas, ofertas
    api/
      catalogo.json.js  proxy del catálogo — evita que el token llegue al cliente
      vitrinas.json.js  lo que se pinta en la home, ya resuelto
  layouts/Admin.astro   marco común del panel
  datos/
    api.js              cliente del catálogo de kafe — SOLO SERVIDOR
    curaduria.js        qué se muestra en la home (se guarda en Blob)
  lib/sesion.js         cookie de sesión firmada con HMAC
  middleware.js         puerta única de /admin
  scripts/              app.js (tienda) y analitica.js (GA4 + consentimiento)
  styles/               styles.css (tienda) y admin.css (panel)
public/assets/          logo, imágenes del hero y CREDITOS.txt
```

Los productos son los **8.437 reales** del negocio, servidos por la API de
kafe.agency. `CATALOGO_URL` lleva el token dentro de la URL: por eso `api.js`
no puede importarse desde nada que llegue al navegador, y la tienda consulta
por `/api/catalogo.json`.

El amarillo de la marca (`--amarillo: #FFDD00`) está muestreado del propio `logo.png`.
No cambiarlo sin volver a muestrear el archivo: de ahí depende que el fondo de la
pantalla de entrada y el logo se vean como una sola pieza.

## Almacenamiento del panel

Lo que el administrador edita (qué productos van en cada vitrina) se guarda en
**Vercel Blob**, no en el repositorio: en Vercel el sistema de archivos es de
solo lectura y cada petición puede caer en una instancia distinta.

Para activarlo:

1. En Vercel: tu proyecto → **Storage** → **Create Database** → **Blob**, acceso
   **Private**. Marcá también el entorno **Development**.
2. En local: `npx vercel env pull` trae el token a `.env.local`.

Sin el store, el panel avisa en pantalla y guarda solo en memoria — sirve para
probar, pero en producción no persistiría nada.

Se eligió Blob y no Global Config porque escribir en Global Config exige un
token de la API REST de Vercel, con permisos sobre toda la cuenta. Blob usa
credenciales acotadas al store.

## Pendientes antes de producción

- **Fotos de los productos.** La API devuelve `imagenes: []` en todo el catálogo:
  ningún producto tiene foto. La tarjeta reserva el hueco con un icono mientras
  tanto. Ver «El problema de las fotos» en [PLAN.md](PLAN.md).
- **Licencias de las imágenes del hero.** Vienen de Wikimedia Commons con licencias
  variadas (CC BY, CC BY-SA, dominio público). Hay que revisarlas una por una y dar
  la atribución que cada una exija, o —mejor— reemplazarlas por fotos reales del
  local. Ver [CREDITOS.txt](public/assets/img/CREDITOS.txt).
- **Datos de contacto.** Teléfono, correo y horarios son de ejemplo. Están marcados
  en el HTML con `<!-- DATO PLACEHOLDER -->`.
- **Número de WhatsApp del carrito.** `584120000000` en `src/scripts/carrito.js`.
- **Inicio de sesión.** El modal es solo la interfaz; no hay backend detrás.
