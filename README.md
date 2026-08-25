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
    admin/              panel: entrar, estadísticas, categorías, semana, ofertas
  layouts/Admin.astro   marco común del panel
  datos/
    catalogo.js         catálogo de ejemplo — lo comparten tienda y panel
    curaduria.js        qué producto va en cada vitrina (se guarda en Blob)
  lib/sesion.js         cookie de sesión firmada con HMAC
  middleware.js         puerta única de /admin
  scripts/              app.js (tienda) y analitica.js (GA4 + consentimiento)
  styles/               styles.css (tienda) y admin.css (panel)
public/assets/          logo, 50 imágenes y CREDITOS.txt
```

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

- **Licencias de las imágenes.** Las 50 vienen de Wikimedia Commons con licencias
  variadas (CC BY, CC BY-SA, dominio público). Hay que revisarlas una por una y dar
  la atribución que cada una exija, o —mejor— reemplazarlas por fotos reales de la
  mercancía. Ver [CREDITOS.txt](public/assets/img/CREDITOS.txt).
- **Datos de contacto.** Teléfono, correo, horarios y dos de las tres sucursales son
  de ejemplo. Están marcados en el HTML con `<!-- DATO PLACEHOLDER -->`.
- **Precios e inventario.** El catálogo de `app.js` es de muestra.
- **Inicio de sesión.** El modal es solo la interfaz; no hay backend detrás.
