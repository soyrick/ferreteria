# Bitácora — Casa Herramientas

Documento de recuperación de contexto. Si empezás una sesión nueva o se vació el
contexto, leé **esto primero** y después [PLAN.md](PLAN.md). Con esos dos
archivos alcanza para retomar sin preguntar nada.

Última actualización: 2026-08-27

---

## Qué es

Web de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H), Calle
Guayaquil frente al estadio de béisbol de Barrio Sucre, Barcelona, estado
Anzoátegui, Venezuela.

- Producción: https://casaherramientas.vercel.app
- Repo: https://github.com/soyrick/ferreteria
- Panel: `/admin` (clave en el `.env` local y en Vercel)

**Al 2026-08-27:** todo commiteado y pusheado, árbol limpio, último commit
`cd10444`. Lo desplegado y lo local coinciden.

## Cómo trabajar con Ricardo

Estas cuatro no se negocian y ya tuvo que repetirlas:

1. **Respuestas concisas, concretas y directas.** Resultado y qué tiene que
   hacer él. Nada de tablas de verificación ni relatos de depuración.
2. **No suponer, no adelantarse.** Ante una duda, preguntar.
3. **Nunca commitear ni pushear sin que lo pida.** Terminar, reportar, y dejar
   los cambios sin commitear.
4. **Él levanta el servidor.** Verificar con `astro build`, scripts de Node o
   `curl`. No arrancar el servidor de desarrollo.

Están como R13–R16 en [PLAN.md](PLAN.md).

## Stack

Astro 7 híbrido sobre Vercel. La tienda se prerenderiza; solo `/admin` y `/api`
corren en servidor (`export const prerender = false` en esas páginas).

Cuatro dependencias: `astro`, `@astrojs/vercel`, `@vercel/blob`, `chart.js`
(la última solo se carga en `/admin`; la tienda va con 18,7 KB de JS).

```
src/
  pages/index.astro          la tienda entera (sin componentes, a propósito)
  pages/admin/
    entrar.astro             login
    index.astro              estadísticas + gráfica de visitas por mes
    categorias.astro         PRODUCTOS: todo el catálogo, buscador y menú ⋯
    semana.astro             Productos estrella
    ofertas.astro            Ofertas con precio, descuento y vencimiento
    salir.astro
  pages/api/vitrinas.json.js sirve la curaduría a la tienda
  layouts/Admin.astro        cabecera + barra lateral
  components/MenuProducto.astro   el menú ⋯ (usa <details>, sin JS)
  datos/catalogo.js          46 productos de ejemplo · fuente única
  datos/curaduria.js         qué producto va en cada vitrina · Vercel Blob
  lib/sesion.js              cookie firmada con HMAC (Web Crypto)
  middleware.js              puerta única de /admin
  scripts/app.js             interacción de la tienda
  scripts/carrito.js         carrito → WhatsApp
  scripts/analitica.js       GA4 + consentimiento
  scripts/grafica.js         gráfica del panel (Chart.js) + selector de mes
  scripts/panel.js           buscador, menús ⋯ y descuento en vivo
  styles/styles.css          tienda
  styles/admin.css           panel
public/assets/img/           50 imágenes + CREDITOS.txt
```

## Cómo funciona la curaduría

El panel **no edita productos**: elige cuáles se muestran y dónde. Nombre,
precio de lista y foto van a venir de la API del cliente (F6).

Documento guardado en Blob (`curaduria.json`, ~1,4 KB):

```json
{
  "destacados": { "hogar": ["tobo-industrial", "..."] },
  "semana": ["martillo-una", "..."],
  "ofertas": [{ "id": "taladro-percutor", "precio": 58, "vence": "" }]
}
```

- `CUPOS_SEMANA = 10` en `curaduria.js`. Lo respetan la tienda y el panel.
- `accionProducto(accion, id)` resuelve el menú ⋯: `a-estrella`, `a-oferta`,
  `quitar-estrella`, `quitar-oferta`.
- Poner algo en oferta desde el menú le pone **10 % de descuento** inicial; el
  precio fino se ajusta en la pantalla de Ofertas.
- `vitrinas()` resuelve todo a productos completos y aplica el precio de oferta:
  el rebajado pasa a ser el precio y el de lista queda tachado.
- **Vencimiento:** `ofertaVigente(oferta)` decide si sigue viva. Sin fecha =
  indefinida. Con fecha, vale todo ese día y se apaga sola al siguiente. Las
  vencidas **no se borran**: salen de la tienda pero quedan en el panel marcadas
  para poder reactivarlas cambiándoles la fecha.
- Cuando no hay oferta vigente, `resolver()` limpia `pa` y la etiqueta: el producto
  vuelve a su precio de lista sin sello ni tachado.
- Las 10 ofertas de arranque están escritas explícitas en `inicial()`, no deducidas
  del catálogo.

## Cómo pinta la tienda

`index.astro` sirve el HTML estático con las secciones vacías. `app.js` pide
`/api/vitrinas.json` y pinta las tres vitrinas: En oferta, Productos estrella y
las filas de categoría. Si esa ruta falla usa `RESPALDO`, que es el catálogo
empaquetado, así que **la tienda nunca queda vacía**.

Orden de la home: hero → franja → En oferta → Productos estrella → categorías →
marcas → nosotros → pie.

## Decisiones que no hay que volver a discutir

| Decisión | Por qué |
|---|---|
| **Astro, no Next** | El HTML y el CSS existentes pasaron casi intactos. Next obligaba a reescribir todo como JSX sin ganar nada. |
| **El panel cura, no edita productos** | Si también editara nombre y precio, habría dos fuentes de verdad peleando con la API. |
| **Vercel Blob, no Global Config** | Escribir en Global Config exige un token de la API REST con permisos sobre toda la cuenta. Blob usa credenciales acotadas al store. |
| **Formularios HTML puros en el panel** | El JS de cliente solo hace buscador, menús y descuento en vivo. El resto son POST normales. |
| **`<details>` para el menú ⋯** | El navegador ya sabe abrirlo, cerrarlo y manejarlo con teclado. Cero JS. |
| **La tienda lee `/api/vitrinas.json`** | Lo que edita el panel se ve sin reconstruir. Caché de 60 s. |
| **Chart.js solo en el panel** | Se importan nada más las piezas que se usan. La tienda no lo carga. |
| **El catálogo solo tiene precios de lista** | Ningún producto trae `pa` ni etiqueta de oferta. La rebaja vive únicamente en la curaduría, que es como va a funcionar con la API. |

## Trampas conocidas

- **Astro carga `.env` en `import.meta.env`, NO en `process.env`.** El SDK de Blob
  lee `process.env`. Por eso `curaduria.js` busca en los dos y pasa el token explícito.
- **En local Blob no funciona.** El token vive en Production/Preview y
  `vercel env pull` baja Development. El panel usa el respaldo en memoria y lo
  avisa en pantalla; es lo esperado. Para bajarlo igual:
  `npx vercel env pull --environment=preview .env.local --yes`
- **`[hidden]` no funciona solo.** Cualquier regla de autor con `display` le gana a
  la hoja del navegador. Por eso está `[hidden] { display: none !important; }`.
- **`wa.me/message/CÓDIGO` no admite texto pre-cargado.** Hace falta el número
  en formato internacional.
- **`clip-path` + `filter` + `rotate` emborronan el texto de esa capa.** Por eso el
  sello de oferta dibuja la estrella en un `::before` y deja el número aparte.
- Al probar en el navegador, las transiciones y animaciones CSS pueden quedar
  congeladas si el panel no está compositando. Medir con la Web Animations API
  (`pause()` + `currentTime`) o recargar limpio antes de sacar conclusiones.

## Datos de ejemplo que hay que reemplazar

Buscar `DATO PLACEHOLDER` en el repo.

- Número de WhatsApp del carrito: `584120000000` en `src/scripts/carrito.js`
- Teléfono, correo y horarios en `index.astro`
- Los 46 productos de `datos/catalogo.js`
- Las métricas y la serie de visitas del panel (`pages/admin/index.astro`)
- Las 50 imágenes: licencias variadas de Wikimedia Commons, ver `CREDITOS.txt`

## Variables de entorno

En Vercel están cargadas en **Production y Preview** (no en Development).

| Variable | Para qué |
|---|---|
| `ADMIN_CLAVE` | clave de acceso al panel |
| `ADMIN_SECRETO` | firma la cookie de sesión |
| `PUBLIC_GA_ID` | `G-EENVGHWLEV`, Google Analytics |
| `PUBLIC_GSC_VERIFICACION` | vacía; Search Console espera el dominio |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` | los pone el store de Blob |

Store de Blob: `ferreteria-blob` (`store_venOEHu33aAQbWxD`), privado, región `iad1`.

## Cómo verificar sin levantar el servidor

Ricardo corre el servidor, así que para comprobar cambios:

```bash
npx astro build                      # que compile
node --input-type=module -e "..."    # probar módulos directo
```

Para los módulos que tocan el navegador hay que stubbear antes de importar:

```js
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const cur = await import('./src/datos/curaduria.js');
console.log((await cur.vitrinas()).ofertas.length);
```

`curaduria.js` sin credenciales de Blob cae al respaldo en memoria, así que se
puede probar `guardar()` y `vitrinas()` sin tocar producción.

## Comandos

```bash
npm run dev        # localhost:4321 — lo levanta Ricardo, no el asistente
npm run build
npx vercel env ls production
```

## Estado

Ver la tabla de fases en [PLAN.md](PLAN.md).

**Hecho:** F1 base técnica · F2 carrito · F3 ventana de chat · F5 analítica
(verificada midiendo) · panel de administración con acceso, curaduría en Blob,
buscador, menús ⋯, sello de oferta y gráfica con histórico por mes.

**Bloqueado esperando al cliente:** F6 catálogo real, F7 conexión del bot,
F8 cifras reales de GA4 y Search Console en el panel.

**Pendiente sin bloqueo:** F4 SEO, F9 accesibilidad, F10 seguridad, F11 producción.

## Deuda conocida

- El login no tiene límite de intentos (va en F10; en serverless un contador en
  memoria no sirve).
- Las métricas del panel son de muestra hasta F8.
- `grep -rn "ponytail:" src/` lista los atajos deliberados.
