# Bitácora — Casa Herramientas

Documento de recuperación de contexto. Si empezás una sesión nueva o se vació el
contexto, leé **esto primero** y después [PLAN.md](PLAN.md). Con esos dos
archivos alcanza para retomar sin preguntar nada.

Última actualización: 2026-09-01

---

## Qué es

Web de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H), Calle
Guayaquil frente al estadio de béisbol de Barrio Sucre, Barcelona, estado
Anzoátegui, Venezuela.

- Producción: https://casaherramientas.vercel.app
- Repo: https://github.com/soyrick/ferreteria
- Panel: `/admin` (clave en el `.env` local y en Vercel)

**Al 2026-09-01:** la API del catálogo está integrada, con fichas de producto,
sitemap, rejilla de categoría y sello de agotado. Todo verificado en el
navegador. Para ver dónde quedó: `git log --oneline -8`.

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
    categorias.astro         PRODUCTOS: busca en los 8.437, filtra y pagina
    topventas.astro          Lo más vendido (10 cupos)
    ofertas.astro            Ofertas con precio, descuento y vencimiento
    salir.astro
  pages/producto/[...ruta].astro  la ficha · /producto/nombre/CODIGO
  pages/api/vitrinas.json.js sirve las vitrinas ya armadas a la tienda
  pages/api/catalogo.json.js PROXY del catálogo · impide que el token se filtre
  pages/sitemap.xml.js       índice de sitemaps
  pages/sitemap-paginas.xml.js       home y rubros
  pages/sitemap-productos-[tramo].xml.js  1.000 productos por tramo
  layouts/Admin.astro        cabecera + barra lateral
  components/MenuProducto.astro   el menú ⋯ (usa <details>, sin JS)
  datos/api.js               cliente del catálogo de kafe · SOLO SERVIDOR
  datos/curaduria.js         qué se muestra en la home · Vercel Blob
  lib/sesion.js              cookie firmada con HMAC (Web Crypto)
  lib/sitemap.js             tamaños, caché y tandas de los sitemaps
  middleware.js              puerta única de /admin
  scripts/app.js             interacción de la tienda
  scripts/tarjeta.js         la tarjeta de producto · la usan home y rejilla
  scripts/vistaproducto.js   el panel de la ficha, sin recargar
  scripts/vistacategoria.js  la rejilla completa que abre "Ver todo"
  scripts/ficha.js           la página de producto (solo agregar al pedido)
  scripts/whatsapp.js        el número y los mensajes pre-armados
  scripts/carrito.js         carrito → WhatsApp
  scripts/analitica.js       GA4 + consentimiento
  scripts/grafica.js         gráfica del panel (Chart.js) + selector de mes
  scripts/panel.js           buscador, menús ⋯ y descuento en vivo
  styles/styles.css          tienda
  styles/admin.css           panel
public/assets/img/           imágenes del hero + CREDITOS.txt
```

`datos/catalogo.js` (los 46 productos de ejemplo) **se borró el 2026-08-31**:
lo reemplazó la API.

## El catálogo: de dónde salen los productos

**8.437 productos reales**, servidos por la API de kafe.agency. El negocio los
mantiene en su propio sistema; la API solo los publica.

**La regla que no se puede romper: el token va dentro de la URL.** Por eso
`datos/api.js` es **solo servidor** y la tienda pide por `/api/catalogo.json`.
Si ese módulo llegara al navegador, cualquiera abriría el código fuente y se
llevaría la lista de precios completa. Un token en la URL además deja rastro en
logs, historial y extensiones, donde una cabecera no llegaría.

Para comprobarlo después de tocar algo:

```bash
rg -l "kafe_cat_" dist/client/     # no debe encontrar nada
```

- La API se degrada con concurrencia: **8 peticiones a la vez responden en
  470 ms; 24 tardan 7,5 s.** Por eso `enLotes()` despacha de a ocho.
- Límite de 120 peticiones por minuto **por IP**. Detrás del proxy todas las
  visitas comparten la IP de Vercel, así que el caché no es un lujo: es lo que
  evita el 429. `/api/catalogo.json` cachea 120 s y `/api/vitrinas.json`, 60 s.
- El 44 % del catálogo está agotado y se descarta al pintar.
- La API ordena alfabéticamente y no acepta otro orden. Sin muestrear por
  tramos, las ocho filas de la home empezarían todas en "ABRAZADERA".

## Las fichas de producto y el SEO

**Cada producto tiene su dirección:** `/producto/nombre-del-producto/CODIGO`.

- La arma **`urlProducto()` en `datos/api.js`, y solo ella**. La usan las
  tarjetas, el buscador, el panel, la canónica y el sitemap. Si cada uno
  escribiera la suya, Google vería el mismo producto en varias direcciones
  repartiéndose el posicionamiento.
- El **código va al final y es el que manda**. La ruta es `[...ruta]`: toma el
  último tramo como código e ignora el resto. Así `/producto/CODIGO` a secas
  también entra, y si el negocio renombra un producto el enlace viejo no se
  rompe: **redirige con 301** al nombre nuevo.
- El nombre se recorta a 60 caracteres. URLs más largas no aportan nada.
- **La página se renderiza en servidor**, no se prerenderiza: son 8.437 fichas
  con precios que se mueven durante el día.
- Un producto **agotado o sin precio se muestra** —alguien puede llegar por un
  enlace viejo— pero lleva `noindex, follow`.
- El **panel lateral** (`scripts/vistaproducto.js`) va montado encima de un
  enlace real. Si el JavaScript falla, el enlace navega y se ve la misma ficha.
  Google sigue el `href` y nunca pasa por el panel.

### Las capas: rejilla, ficha y carrito

Tres paneles que se enciman, en este orden: la **rejilla de categoría**
(z-index 145), la **ficha** (150) y el **carrito** (140).

- `trabarFondo()` en `tarjeta.js` decide si el fondo scrollea **mirando qué
  capas hay abiertas**. Cada panel llamándolo al abrir y al cerrar alcanza: sin
  eso, cerrar la ficha soltaba el fondo con la rejilla todavía abierta.
- Escape cierra **la capa de arriba**, no las dos.
- La rejilla carga de a 24 productos con un **listener de scroll**, no un
  IntersectionObserver. Ver «Los observadores no se pueden probar acá».
- Si una tanda no llena la pantalla, se encadena la siguiente sola; si no, no
  habría scroll que disparara nada.

### El sello de agotado

El 44 % del catálogo no tiene existencia. La tarjeta se muestra igual, con un
sello redondo gris —el de oferta es una estrella roja, y la estrella dentada es
lenguaje de promoción—, la foto atenuada y **sin botón de agregar**: en su lugar
abre WhatsApp con la consulta escrita. Si un producto está agotado y en oferta
a la vez, gana agotado.

`disponible` puede no venir; en ese caso el producto se ofrece. Es peor
esconder algo que sí hay por un campo ausente.

### El sitemap, y por qué está partido

`/sitemap.xml` es un índice: apunta a `sitemap-paginas.xml` y a nueve
`sitemap-productos-N.xml` de 1.000 productos cada uno.

**No es una elección estética.** Recorrer el catálogo entero son 85 peticiones
y la API admite 120 por minuto por IP; hacerlas de una sola vez nos bloqueó
durante una tarde. Repartido, Google pide un tramo por vez, cada uno cuesta 10
peticiones en tandas de cuatro —medido: 794 ms— y se cachea 24 horas.

Ese caché largo no contradice el «no guardes precios más de unos minutos» del
proveedor: el sitemap lleva direcciones, no precios.

Solo entran los productos vendibles, unas 5.000 direcciones. Miles de fichas
agotadas y sin foto son contenido pobre para Google y arrastran al resto.

Hace falta porque **en el HTML de la home no hay un solo enlace a un producto**:
las tarjetas las pinta el JavaScript. Sin el sitemap, indexar quedaría a merced
de que el robot ejecute scripts, que lo hace tarde y sin garantías.

## Cómo funciona la curaduría

El panel **no edita productos**: el nombre y el precio los manda la API. Elige
qué se muestra y qué está rebajado.

Documento guardado en Blob (`curaduria.json`):

```json
{
  "categorias": ["HERRAMIENTAS MANUALES", "..."],
  "topventas": ["C011132", "..."],
  "ofertas": [{ "codigo": "H01107", "precio": 9.9, "vence": "" }]
}
```

- **Categorías: se eligen categorías, no productos.** Curar a mano una categoría
  de 1.608 artículos con casillas no es trabajo de nadie. Si la lista está
  vacía, la home usa las 8 más grandes de la API sola.
- **Lo más vendido y Ofertas: sí producto por producto**, por código, porque son
  pocos y son decisiones de la tienda.
- `CUPOS_TOPVENTAS = 10`, `CUPOS_CATEGORIAS = 8`.
- `accionProducto(accion, codigo)` resuelve el menú ⋯: `a-topventas`,
  `a-oferta`, `quitar-topventas`, `quitar-oferta`.
- Poner algo en oferta desde el menú le pone **10 % de descuento** inicial; el
  precio fino se ajusta en la pantalla de Ofertas.
- El precio de lista sale de la API en cada carga: si el negocio lo sube, el
  descuento se recalcula solo.
- **Vencimiento:** `ofertaVigente(oferta)` decide si sigue viva. Sin fecha =
  indefinida. Con fecha, vale todo ese día y se apaga sola al siguiente. Las
  vencidas **no se borran**: salen de la tienda pero quedan en el panel marcadas
  para poder reactivarlas cambiándoles la fecha.
- Un código que ya no esté en la API no rompe nada: se descarta al pintar y el
  panel lo marca *«ya no está en la API · quítalo»*.

## Cómo pinta la tienda

`index.astro` sirve el HTML estático con las secciones vacías. `app.js` pide
`/api/vitrinas.json` y pinta: En oferta, Lo más vendido, las ocho filas de
categoría y el menú con los 32 rubros.

**Ya no hay catálogo de respaldo.** Antes `app.js` traía 46 productos dentro
del bundle; 8.437 con precios que cambian durante el día no se pueden
empaquetar. Si la API no responde aparece `#catalogo-caido`, que avisa y deriva
a WhatsApp — mostrar precios de ayer sería peor que no mostrar nada.

Las secciones **En oferta** y **Lo más vendido** se ocultan si están vacías, así
que en un despliegue nuevo no se ven hasta curar productos en el panel.

Orden de la home: hero → franja → En oferta → Lo más vendido → categorías →
marcas → nosotros → pie.

**Las fotos.** La API devuelve `imagenes: []` en todo el catálogo. La tarjeta
reserva el hueco (`.producto-foto.vacia`) con el icono de la casa, del tamaño
exacto que tendrá la foto real. `normalizar()` ya lee `imagenes[0].url`, así que
el día que el negocio las cargue aparecen solas.

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
| **El catálogo solo tiene precios de lista** | La rebaja vive únicamente en la curaduría; la API manda el precio de lista. |
| **`api.js` nunca se importa desde el navegador** | La URL lleva el token adentro. La tienda pide por `/api/catalogo.json`, que corre en servidor. |
| **La home elige categorías, no productos** | 1.608 artículos en una sola categoría no se curan con casillas. |
| **No se buscan fotos por título automáticamente** | Ya se probó con 50 imágenes y salieron mal (un candado ilustrado con una pareja en la playa). Con 8.437 nadie las audita, y una foto equivocada genera un reclamo. |
| **La ficha es una página, no un modal** | Un panel que abre con JavaScript es invisible para Google: sin URL no hay nada que indexar. El panel va encima de un enlace real, no en su lugar. |
| **La URL lleva nombre y código** | El nombre gana clics —acá los enlaces se pegan en WhatsApp—; el código mantiene el enlace vivo si el producto se renombra. |
| **El sitemap no incluye todo el catálogo** | Miles de fichas agotadas y sin foto son contenido pobre y arrastran al resto del sitio. |

## Trampas conocidas

- **Astro carga `.env` en `import.meta.env`, NO en `process.env`.** El SDK de Blob
  lee `process.env`. Por eso `curaduria.js`, `api.js` y `middleware.js` buscan en
  los dos; además así se los puede ejecutar desde Node suelto para probarlos.
- **La API se degrada con concurrencia.** Medido: 8 peticiones simultáneas → 470 ms;
  24 → 7,5 s. Si algo empieza a dar timeout, revisar si se soltaron demasiadas
  juntas en vez de pasar por `enLotes()`.
- **Pasarse del límite bloquea la IP, y no avisa con un 429.** El 2026-08-31,
  midiendo el comportamiento de la API, se hicieron más de cien peticiones en
  ráfagas y el host dejó de aceptar conexiones: ni handshake TLS, solo
  `Connection timed out` a los 20 segundos. Duró horas y se resolvió cambiando
  de IP. Para distinguirlo de una caída del servicio:

  ```bash
  curl -sv --max-time 15 "https://auto.kafe.agency/" 2>&1 | rg -i "trying|connected|timed out"
  curl -s https://api.ipify.org        # por qué IP estás saliendo
  ```

  Si el DNS resuelve pero el TCP no conecta, es bloqueo o caída; si otros
  sitios cargan bien, es bloqueo. **Al probar contra la API, ir de a pocas.**
- **`referencia` en la API NO es el código de fábrica: es el anaquel.** Trae
  cosas como `EXHIBICION TABLERO` y `A2-ARRIBA`, y el mismo `04CH` aparece en
  STANLEY, TRUPER y TOLSEN a la vez. No sirve para buscar fotos.
- **En local Blob no funciona.** El token vive en Production/Preview y
  `vercel env pull` baja Development. El panel usa el respaldo en memoria y lo
  avisa en pantalla; es lo esperado. Para bajarlo igual:
  `npx vercel env pull --environment=preview .env.local --yes`

### Las tres del entorno en Windows

Las tres costaron tiempo el 2026-08-31 y se repiten solas si no se saben.

- **Nunca escribir un `.env` con `echo >>` en Windows.** PowerShell guarda en
  **UTF-16**: la clave queda con un byte nulo entre cada letra
  (`C A T A L O G O _ U R L`) y el valor mide el doble de lo que debería. Se ve
  perfecto en el editor y no funciona. Usar `vercel env pull` o pegar la línea
  a mano en el editor.
- **Vite lee los `.env` una sola vez, al arrancar.** Después de tocar cualquier
  variable hay que reiniciar el servidor. Un `apiLista(): false` con el archivo
  correcto casi siempre es esto.
- **`vercel env pull` agrega su propio `.env*` al final del `.gitignore`.** Si
  queda debajo de `!.env.example`, la anula y la plantilla deja de versionarse.
  Por eso esa negación va siempre en la última línea del archivo.

Para saber si el problema es la variable o el servidor, sin adivinar:

```bash
curl -s "http://localhost:4321/api/catalogo.json?q=taladro&limit=2"
```

`{"error":"catálogo no configurado"}` significa que `CATALOGO_URL` no llegó al
proceso: o falta en el archivo, o el servidor arrancó antes de que existiera.
- **`[hidden]` no funciona solo.** Cualquier regla de autor con `display` le gana a
  la hoja del navegador. Por eso está `[hidden] { display: none !important; }`.
- **`wa.me/message/CÓDIGO` no admite texto pre-cargado.** Hace falta el número
  en formato internacional.
- **`clip-path` + `filter` + `rotate` emborronan el texto de esa capa.** Por eso el
  sello de oferta dibuja la estrella en un `::before` y deja el número aparte.
- Al probar en el navegador, las transiciones y animaciones CSS pueden quedar
  congeladas si el panel no está compositando. Medir con la Web Animations API
  (`pause()` + `currentTime`) o recargar limpio antes de sacar conclusiones.

### Los observadores no se pueden probar acá

**`IntersectionObserver` no dispara nunca en este entorno**, ni siquiera la
primera vez, que normalmente ocurre siempre. Costó una hora el 2026-09-01
creyendo que era un bug del scroll infinito. El diagnóstico que lo zanja:

```js
requestAnimationFrame(() => {/* … */});   // no corre → no se está pintando
```

Si `requestAnimationFrame` no corre, el navegador no está componiendo la página
y **todo lo que dependa del renderizado queda mudo**: observers de intersección
y de redimensionado, animaciones, transiciones. `document.visibilityState` dice
`visible` igual, así que no sirve para detectarlo.

Por eso la rejilla usa un listener de `scroll`: hace lo mismo y sí se puede
comprobar. Antes de escribir algo apoyado en un observer, pensar cómo se va a
verificar.

### Cuánto cuesta pintar la home

Armar las vitrinas son **unas 30 peticiones** a la API (el resumen, 8 categorías
por 3 tramos, y los productos curados uno por uno). Con el caché de 60 s en
`/api/vitrinas.json` eso es una vez por minuto y sobra margen sobre el límite
de 120. **Pero recargando a mano varias veces seguidas se llega al tope**, y la
home empieza a devolver `503`. No es un bug: es esperar un minuto.

## Datos de ejemplo que hay que reemplazar

Buscar `DATO PLACEHOLDER` en el repo.

- **Número de WhatsApp: `584120000000` en `src/scripts/whatsapp.js`.** Es el
  único placeholder que queda. Lo esperan el carrito y las consultas de
  producto agotado: hasta que llegue el real, esos dos botones no funcionan.
  Los enlaces genéricos usan `wa.me/message/N5EYYCMCKHH2M1`, que sí funciona
  pero no admite texto pre-cargado.
- Las métricas y la serie de visitas del panel (`pages/admin/index.astro`)
- Las imágenes del hero: licencias variadas de Wikimedia Commons, ver `CREDITOS.txt`

**Datos reales al 2026-09-01:** correo `casaherramienta@gmail.com`, horario de
lunes a sábado de 8:00 a 4:50, sin teléfono de llamadas. Los productos y las
marcas salen de la API.

## Variables de entorno

En Vercel están cargadas en **Production y Preview** (no en Development).

| Variable | Para qué |
|---|---|
| `ADMIN_CLAVE` | clave de acceso al panel |
| `ADMIN_SECRETO` | firma la cookie de sesión |
| `PUBLIC_GA_ID` | `G-EENVGHWLEV`, Google Analytics |
| `PUBLIC_GSC_VERIFICACION` | vacía; Search Console espera el dominio |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` | los pone el store de Blob |
| `CATALOGO_URL` | URL completa del catálogo de kafe, token incluido. **Sin `PUBLIC_`**: ese prefijo la mandaría al navegador. Marcada como sensible y cargada en los tres entornos; en local llega por `npx vercel env pull .env.local`. |

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

Los handlers de API se llaman directo, sin levantar nada. Es lo que verificó la
integración del 2026-08-31:

```js
process.env.CATALOGO_URL = '...';
const cat = await import('./src/pages/api/catalogo.json.js');
const r = await cat.GET({ url: new URL('https://x/api/catalogo.json?q=taladro') });
console.log(r.status, (await r.text()).includes('kafe_cat_'));  // 200 false
```

El `false` es la prueba que importa: la respuesta no lleva el token.

**Si la API te bloqueó pero el servidor de Ricardo sigue andando**, se verifica
a través de él, que sale por otra IP:

```bash
curl -s -o /dev/null -w "%{http_code} → %{redirect_url}\n" "http://localhost:4321/producto/CN28"
curl -s "http://localhost:4321/sitemap-productos-1.xml" | rg -c "<loc>"
```

Cada llamada así consume peticiones de **su** IP: pocas y bien elegidas.

## Comandos

```bash
npm run dev        # localhost:4321 — lo levanta Ricardo, no el asistente
npm run build
npx vercel env ls production
```

## Estado

Ver la tabla de fases en [PLAN.md](PLAN.md).

**Hecho:** F1 base técnica · F2 carrito · F3 ventana de chat · F5 analítica
(verificada midiendo) · **F6 catálogo real integrado** · panel de administración
con acceso, curaduría en Blob, buscador, menús ⋯, sello de oferta y gráfica con
histórico por mes.

**Bloqueado esperando al cliente:** las fotos del catálogo (D2 en el plan),
F7 conexión del bot, F8 cifras reales de GA4 y Search Console en el panel.

**Pendiente sin bloqueo:** F4 SEO, F9 accesibilidad, F10 seguridad, F11 producción.

## Deuda conocida

- **Ningún producto tiene foto.** Ver «El problema de las fotos» en
  [PLAN.md](PLAN.md): está medido y con la pregunta que hay que hacerle al
  encargado.
- **Faltan las páginas de categoría** (`/categoria/[ranura]`). Hoy los 32 rubros
  del menú son anclas de la home, no páginas propias.
- **La home no tiene metadatos propios** más allá del título y la descripción:
  falta canónica, Open Graph y el `LocalBusiness`.
- El login no tiene límite de intentos (va en F10; en serverless un contador en
  memoria no sirve).
- Las métricas del panel son de muestra hasta F8.
- `rg -n "ponytail:" src/` lista los atajos deliberados.
