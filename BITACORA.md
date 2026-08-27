# Bitácora — Casa Herramientas

Documento de recuperación de contexto. Si empezás una sesión nueva, leé esto
primero y después [PLAN.md](PLAN.md).

Última actualización: 2026-08-25

---

## Qué es

Web de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H), Calle
Guayaquil frente al estadio de Barrio Sucre, Barcelona, estado Anzoátegui.

- Producción: https://casaherramientas.vercel.app
- Repo: https://github.com/soyrick/ferreteria
- Panel: `/admin`

## Stack

Astro 7 híbrido sobre Vercel. La tienda se prerenderiza; solo `/admin` y `/api`
corren en servidor (`export const prerender = false` en esas páginas).

Tres dependencias, nada más: `astro`, `@astrojs/vercel`, `@vercel/blob`.

```
src/
  pages/index.astro        la tienda entera (sin componentes, a propósito)
  pages/admin/             entrar · index (estadísticas) · categorias · semana · ofertas
  pages/api/vitrinas.json.js
  layouts/Admin.astro
  datos/catalogo.js        46 productos de ejemplo — fuente única, la usan tienda y panel
  datos/curaduria.js       qué producto va en cada vitrina · lee/escribe en Vercel Blob
  lib/sesion.js            cookie firmada con HMAC (Web Crypto, sin dependencias)
  middleware.js            puerta única de /admin
  scripts/app.js           interacción de la tienda
  scripts/carrito.js       carrito → WhatsApp
  scripts/analitica.js     GA4 + consentimiento
  styles/styles.css        tienda · styles/admin.css  panel
public/assets/img/         50 imágenes + CREDITOS.txt
```

## Decisiones que no hay que volver a discutir

| Decisión | Por qué |
|---|---|
| **Astro, no Next** | El HTML y el CSS existentes pasaron casi intactos. Next obligaba a reescribir todo como JSX sin ganar nada. |
| **El panel cura, no edita productos** | Nombre, precio y foto los va a mandar la API (F6). Si el panel también los editara, habría dos fuentes de verdad. |
| **Vercel Blob, no Global Config** | Escribir en Global Config exige un token de la API REST con permisos sobre toda la cuenta. Blob usa credenciales acotadas al store. |
| **Formularios HTML puros en el panel** | Sin JS de cliente: menos código y no hay estado que se desincronice. |
| **La tienda lee `/api/vitrinas.json`** | Así lo que edita el panel se ve sin reconstruir. Caché de 60 s. |
| **`precioLista(p)`** | En los datos de ejemplo, los rebajados traen `p` = precio con rebaja y `pa` = de lista. La rebaja es de la curaduría, no del producto. |

## Trampas conocidas

- **Astro carga `.env` en `import.meta.env`, NO en `process.env`.** El SDK de Blob
  lee `process.env`. Por eso `curaduria.js` busca en los dos y pasa el token explícito.
- **`vercel env pull` baja solo el entorno Development**, y el store está conectado
  a Production/Preview. En local el panel usa el respaldo en memoria y lo avisa en
  pantalla. Es lo esperado; no es un bug.
- **`[hidden]` no funciona solo.** Cualquier regla de autor con `display` le gana a
  la hoja del navegador. Por eso está `[hidden] { display: none !important; }` en la base.
- **El enlace corto `wa.me/message/CÓDIGO` no admite texto pre-cargado.** Hace falta
  el número en formato internacional.
- Al probar en el navegador, las transiciones CSS pueden quedar congeladas si el panel
  no está compositando. Medir con la Web Animations API (`pause()` + `currentTime`) o
  recargar limpio antes de sacar conclusiones.

## Datos de ejemplo que hay que reemplazar

Buscar `DATO PLACEHOLDER` en el repo.

- Número de WhatsApp del carrito: `584120000000` en `src/scripts/carrito.js`
- Teléfono, correo, horarios y dos de las tres sucursales en `index.astro`
- Los 46 productos de `datos/catalogo.js`
- Las 50 imágenes: licencias variadas de Wikimedia Commons, ver `CREDITOS.txt`

## Comandos

```bash
npm run dev      # localhost:4321  (lo levanta Ricardo, no el asistente)
npm run build
npx vercel env ls production
```

## Reglas de trabajo

Están en [PLAN.md](PLAN.md). Las dos que más se olvidan:

- **R13** — respuestas concisas: resultado y qué tiene que hacer Ricardo. Nada más.
- **Ricardo levanta el servidor él mismo.** Verificar con `astro build`, scripts de
  Node o `curl`; no arrancar el dev server.

## Estado

Ver la tabla de fases en [PLAN.md](PLAN.md). Resumen: F1, F3 y F5 hechas; F2
(carrito) recién terminada; F6, F7 y F8 esperando las APIs del cliente.
