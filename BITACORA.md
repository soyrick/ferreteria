# Bitácora — Casa Herramientas

Documento de recuperación de contexto. Si empezás una sesión nueva o se vació el
contexto, leé **esto primero** y después [PLAN.md](PLAN.md). Con esos dos
archivos alcanza para retomar sin preguntar nada.

Última actualización: 2026-09-03

---

## Qué es

Web de **Casa Herramientas, C.A.** (Ferretería y Construcción C.H), Calle
Guayaquil frente al estadio de béisbol de Barrio Sucre, Barcelona, estado
Anzoátegui, Venezuela.

- Producción: https://casaherramientas.vercel.app
- Repo: https://github.com/soyrick/ferreteria
- Panel: `/admin` (clave en el `.env` local y en Vercel)

**Al 2026-09-02:** F4 (SEO), F9 (accesibilidad) y F10 (seguridad) cerradas.
Queda **F11**, la puesta en producción, que necesita el dominio.

**Ya no queda nada de prueba.** El panel mostraba métricas inventadas y la home
tenía cifras que puse yo para el demo: todo eso salió, y lo que quedó sale del
catálogo en vivo o está verificado. El único dato pendiente son las fotos, que
la API todavía no trae.

**Lo primero al retomar:** la lista de «Para mañana» en [PLAN.md](PLAN.md).

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

Tres dependencias: `astro`, `@astrojs/vercel` y `@vercel/blob`. La tienda baja
**56 KB**: 42 de CSS y 14 de JavaScript.

`chart.js` se fue el 2026-09-02 con la gráfica de visitas, que dibujaba datos
inventados. Vuelve si algún día se conecta la GA4 Data API.

```
src/
  pages/index.astro          la tienda entera (sin componentes, a propósito)
  pages/admin/
    entrar.astro             login
    index.astro              estado: conexiones, catálogo y qué se publica
    categorias.astro         PRODUCTOS: busca en los 8.437, filtra y pagina
    topventas.astro          Lo más vendido (10 cupos)
    ofertas.astro            Ofertas con precio, descuento y vencimiento
    salir.astro
  pages/producto/[...ruta].astro  la ficha · /producto/nombre/CODIGO
  pages/categoria/[ranura].astro  el rubro · /categoria/plomeria
  pages/api/vitrinas.json.js sirve las vitrinas ya armadas a la tienda
  pages/api/catalogo.json.js PROXY del catálogo · impide que el token se filtre
  pages/sitemap.xml.js       índice de sitemaps
  pages/sitemap-paginas.xml.js       home y rubros
  pages/sitemap-productos-[tramo].xml.js  1.000 productos por tramo
  layouts/Admin.astro        cabecera + barra lateral
  components/MenuProducto.astro   el menú ⋯ (usa <details>, sin JS)
  components/Carrito.astro   el pedido: panel, flotante y tostada
  datos/api.js               cliente del catálogo de kafe · SOLO SERVIDOR
  datos/curaduria.js         qué se muestra en la home · Vercel Blob
  datos/negocio.js           dirección, horario, contacto y ficha para Google
  lib/sesion.js              cookie firmada con HMAC (Web Crypto)
  lib/sitemap.js             tamaños, caché y tandas de los sitemaps
  middleware.js              puerta única de /admin
  scripts/app.js             interacción de la tienda
  scripts/tarjeta.js         la tarjeta de producto · home, rubros y servidor
  scripts/vistaproducto.js   el panel de la ficha, sin recargar
  scripts/categoria.js       buscador, filtro y "ver más" del rubro
  scripts/ficha.js           la página de producto: agregar y el pedido
  scripts/tostada.js         el aviso corto de abajo, compartido
  scripts/whatsapp.js        el número y los mensajes pre-armados
  scripts/carrito.js         carrito → WhatsApp
  scripts/analitica.js       GA4 + consentimiento
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

### Las capas: ficha y carrito

Dos paneles que se enciman: la **ficha** (z-index 150) y el **carrito** (140).

- `trabarFondo()` en `tarjeta.js` decide si el fondo scrollea **mirando qué
  capas hay abiertas**. Cada panel llamándolo al abrir y al cerrar alcanza: sin
  eso, cerrar una soltaba el fondo con la otra todavía abierta.
- Escape cierra **la capa de arriba**, no las dos.

Hubo una tercera, la rejilla de categoría, que abría encima de la home al tocar
«Ver todo». Se fue el 2026-09-03: ver «Las páginas de categoría».

### El sello de agotado

El 44 % del catálogo no tiene existencia. La tarjeta se muestra igual, con un
sello redondo gris —el de oferta es una estrella roja, y la estrella dentada es
lenguaje de promoción—, la foto atenuada y **sin botón de agregar**: en su lugar
abre WhatsApp con la consulta escrita. Si un producto está agotado y en oferta
a la vez, gana agotado.

`disponible` puede no venir; en ese caso el producto se ofrece. Es peor
esconder algo que sí hay por un campo ausente.

**Precio en cero cuenta como agotado.** No es que el producto valga nada: es que
el negocio todavía no lo cargó. Un botón que suma $0,00 al pedido termina en un
reclamo cuando llega la cuenta de verdad.

### Las páginas de categoría

`/categoria/plomeria` y las otras 31. **Son la pantalla del rubro, no un
resumen**: buscador dentro de la categoría, filtro de solo disponibles, botón
de agregar en cada tarjeta, carrito propio y «ver más» por tandas de 24.

Hasta el 2026-09-03 eso vivía en una **ventana flotante** que abría encima de la
home. Funcionaba, pero era invisible: sin dirección propia no hay nada que
Google indexe, nada que pegar en un grupo de WhatsApp y nada a lo que volver con
el botón de atrás. La página ya existía desde F4 y los enlaces apuntaban ahí de
verdad — pero el JavaScript los interceptaba, así que nadie llegaba nunca.

Cómo está armada, de abajo hacia arriba:

1. **El servidor pinta las primeras 24 tarjetas** y los enlaces de página. Eso
   es lo que lee Google y lo que se ve con el JavaScript apagado: el buscador
   es un `<form method="get">` que recarga con `?q=…`, y la paginación son
   enlaces con `rel="prev"`/`rel="next"`.
2. **`categoria.js` se monta encima.** Cambia los enlaces de página por un botón
   de «ver más», esconde el botón de enviar del formulario y busca solo mientras
   se escribe. Los enlaces siguen en el HTML servido, que es lo que recorre el
   rastreador.
3. **Las tarjetas las arma `tarjeta.js`**, el mismo módulo que la home. Es un
   template de texto, así que sirve igual del lado del servidor: la primera
   tanda la renderiza Astro y las siguientes el navegador, con una sola tarjeta
   escrita en un solo lugar.

El filtro de disponibles vuelve a pedir desde cero en vez de esconder lo que ya
está: si solo se ocultaran las tarjetas agotadas, una tanda de 24 podría dejar
tres visibles y parecería que el rubro casi no tiene nada. Y como la API no sabe
filtrar por disponibilidad, el contador dice **cuántos se están viendo**, no
cuántos hay.

`noindex` de la página 2 en adelante: esas se recorren para llegar a los
productos, no compiten como resultado.

### Volver de la ficha al rubro

**El botón de la cabecera de la ficha vuelve al rubro, no al inicio.** Arma su
destino con `p.categoria`, así que vale igual llegando desde Google o desde un
enlace pegado en WhatsApp, no solo navegando desde el rubro. Para ir al inicio
está el logo. Los nombres largos —«Sanitarios, fregaderos, bateas y acces.»— se
recortan con puntos suspensivos; el completo va en el `aria-label`.

**Y vuelve donde se había quedado.** Al abrir un producto se sale de la página y
el navegador la rehace desde cero: las tandas de «ver más» se perdían y la vista
arrancaba arriba. `categoria.js` guarda `{traidos, término, filtro, scroll}` en
`sessionStorage` al salir y lo repone **solo si el referrer es una ficha** —
entrando desde el menú se empieza arriba, que es lo que uno espera. Reponer
gasta una sola petición, con tope de 100 productos porque es el límite de la
API: quien haya cargado más vuelve con 100 y el botón puesto.

Se probó antes con `history.back()`, que sale gratis y deja que el navegador
restaure todo solo. **No sirvió:** rehizo la página igual y volvió a quedar en
24 productos.

**Las tres páginas del catálogo llevan caché de dos minutos.** No es
optimización prematura: sin ella, cada visita a una categoría cuesta **dos**
peticiones a la API —el resumen y el listado— sobre un límite de 120 por
minuto para todo el sitio. Sesenta visitas en un minuto nos dejaban afuera.


### Lo que ve Google del negocio

`datos/negocio.js` tiene dirección, coordenadas, horario, teléfono y correo, y
arma la ficha `HardwareStore` de la home. **Un solo lugar a propósito:** esos
datos estaban repetidos en la tarjeta de ubicación, el pie y los contactos, y
con tres copias a Google podía llegarle un horario distinto del que ve el
visitante — que es justo lo que penaliza.

`HardwareStore` y no `LocalBusiness`: es un subtipo, más preciso, y Google
prefiere el tipo más específico que aplique.

### El gris tiene dos versiones, y no es capricho

`--gris-500` es el texto secundario sobre fondo **claro**; `--gris-en-negro`, el
mismo papel sobre el negro del pie y las cabeceras oscuras.

Están separados porque un solo gris no puede servir a los dos: el que pasa
4,5:1 contra blanco no llega contra negro, y al revés.

| | Sobre blanco | Sobre negro |
|---|---|---|
| `--gris-500: #6B717B` | 4,91 ✓ | 3,24 ✗ |
| `--gris-en-negro: #7C828C` | 3,87 ✗ | 4,85 ✓ |

**Al escribir CSS nuevo: fijarse en qué fondo cae el texto.** Poner
`--gris-500` sobre algo oscuro rompe el contraste sin que se note a simple
vista. Ya pasó una vez con el aviso de derechos del pie.

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

## La barra de arriba y los flotantes

**No hay inicio de sesión.** Se quitó entero el 2026-09-01 —botón, modal,
formulario, JavaScript y CSS— porque no va a haber cuentas de usuario. Tampoco
hay menú hamburguesa: no abría nada, hacía scroll hasta la barra de secciones,
que ya está a la vista y se desliza sola.

**El buscador en el teléfono nace desplegado**, de extremo a extremo y sin el
botón negro: solo la lupa de la izquierda. Replegado pedía dos gestos donde
alcanzaba uno. Dos cosas que no se ven pero sostienen eso:

- `min-width: 0` en toda la cadena del buscador. Un `<input>` trae un ancho
  mínimo propio de unos 20 caracteres y sin eso ningún contenedor cede: la caja
  se salía 11 px de la pantalla.
- El JS decide entre «abrir» y «buscar» **midiendo el ancho del campo**, no
  mirando la clase `.abierto`. En móvil el CSS lo deja abierto sin que nadie lo
  toque, y ahí el primer envío tiene que buscar.

Enviar funciona con Enter, por la regla de envío implícito: con un único campo
de texto no hace falta un botón visible.

**El botón Ofertas del menú es dorado** y no amarillo. Sobre el nav negro el
dorado resalta sin competir con el amarillo de la marca, que ya es el color del
botón de agregar en cada tarjeta.

### Los flotantes de la esquina

Abajo a la derecha conviven dos, y esa esquina resultó tener dueño:

- **Carrito**, solo cuando hay algo en el pedido. En el teléfono muestra la
  cantidad; el total se esconde para no competir con el contenido.
- **Volver arriba**, que se corre a 86 px cuando el carrito aparece.
- **El banner de cookies se apoya ahí con `z-index: 100`**, o sea encima de los
  dos. Tocar el carrito pulsaba «Aceptar» sin querer. `analitica.js` publica el
  alto del banner en `--sube-flotantes` y el CSS levanta los botones mientras
  esté visible.

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

Cuando *En oferta* está escondida, el **botón Ofertas del menú** —el de al lado
de Productos, por donde entra el cliente— avisa que no hay ninguna en vez de no
hacer nada. La condición sale de los datos, no de si la sección se ve. Los otros
dos enlaces a ofertas (hero y pie) siguen sin respuesta: decisión de Ricardo.

Los avisos duran 3 segundos y se desvanecen hundiéndose un poco. La tostada se
esconde recién al terminar la transición: ocultarla antes se comía el efecto.

Orden de la home: hero → franja → En oferta → Lo más vendido → categorías →
marcas → nosotros → pie.

**Las fotos.** La API devuelve `imagenes: []` en todo el catálogo. La tarjeta
reserva el hueco (`.producto-foto.vacia`) con el icono de la casa, del tamaño
exacto que tendrá la foto real. `normalizar()` ya lee `imagenes[0].url`, así que
el día que el negocio las cargue aparecen solas.

## Seguridad: qué protege qué

Cerrado en F10 el 2026-09-02. Lo que hay que saber antes de tocar algo de esto.

**Las cabeceras salen del middleware, no de cada página.** `src/middleware.js`
las pone en *todas* las respuestas —tienda, panel y APIs— con una sola función.
Una página nueva nace protegida sin que nadie se acuerde de agregar nada.

La CSP lleva `'unsafe-inline'` en `script-src` y `style-src`. No es descuido:
Astro pone estilos y scripts en línea, y sacarlo obliga a generar un nonce por
respuesta, que en una home estática no se puede. Si algún día se agrega un
dominio nuevo —otro CDN, otro embed— hay que sumarlo a la lista o el navegador
lo bloquea **sin avisar en la página**, solo en la consola.

**Todo JSON-LD pasa por `comoJSONLD()`** (`datos/negocio.js`). Escapa `<`, `>` y
`&`. Sin eso, un nombre de producto con la cadena de cierre de script cerraba el
bloque y lo que siguiera se leía como HTML — y los nombres vienen de la API, o
sea de afuera. Si aparece un `<script type="application/ld+json">` nuevo con
`JSON.stringify` crudo, está mal.

**El freno del login vive en el Blob**, no en memoria: `src/lib/intentos.js`,
archivo `intentos.json`, 5 intentos por IP cada 15 minutos. En serverless un
contador en memoria no frena nada porque cada petición puede caer en una
instancia nueva. `decidir()` y `sumar()` son puras a propósito, para poder
probarlas sin Blob. **Sin `BLOB_READ_WRITE_TOKEN` el freno deja pasar a
todos** — deliberado: dejar a Ricardo afuera de su propio panel es peor.

Aceptado y no corregido: `path-to-regexp` con ReDoS (llega por
`@astrojs/vercel`, se usa al construir con patrones nuestros), y que Google
Fonts y el mapa carguen sin consentimiento. El banner ya no promete lo
contrario: dice que *Analytics* no se activa, que es lo que sí se cumple.

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
| **Sin cuentas de usuario** | No va a haber inicio de sesión. Un formulario que avisaba «esto es un demo» solo generaba expectativas. |
| **El carrito flotante aparece solo con algo dentro** | Vacío ocupa la esquina más valiosa del teléfono sin dar nada a cambio. |
| **El buscador va abierto en móvil** | Replegado pedía dos gestos —tocar y después escribir— donde alcanzaba uno. |
| **Las cabeceras de seguridad van en el middleware** | Una sola puerta es una sola cosa que auditar, y una página nueva nace protegida sin que nadie se acuerde. |
| **El freno del login se guarda en el Blob** | En serverless un contador en memoria se reinicia solo: cada petición puede caer en una instancia nueva. |

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

- Las imágenes del hero: licencias variadas de Wikimedia Commons, ver `CREDITOS.txt`

**Datos reales al 2026-09-02:** todos en `datos/negocio.js` — WhatsApp
`+584248190490`, correo `casaherramienta@gmail.com`, horario de lunes a sábado
de 8:00 a 16:50, coordenadas de la ficha de Google Maps. Los productos y las
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

Store de Blob: `ferreteria-blob` (`store_venOEHu33aAQbWxD`), privado, región
`iad1`. Guarda dos archivos: `curaduria.json` y `intentos.json` (el freno del
login).

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

**Cancelado el 2026-09-01:** el chatbot (F3 y F7). No se va a usar; la atención
va por WhatsApp. Se quitó el botón flotante, el panel, su JavaScript y sus 112
líneas de CSS. El icono `#i-chat` se queda: lo usan los botones de WhatsApp.

**Hecho:** F1 base técnica · F2 carrito · F5 analítica
(verificada midiendo) · **F6 catálogo real integrado** · panel de administración
con acceso, curaduría en Blob, buscador, menús ⋯, sello de oferta y gráfica con
histórico por mes.

**Bloqueado esperando al cliente:** las fotos del catálogo (D2 en el plan),
F7 conexión del bot, F8 cifras reales de GA4 y Search Console en el panel.

**Cerradas el 2026-09-02:** F4 SEO · F9 accesibilidad · F10 seguridad.

**Pendiente:** F11 producción — necesita el dominio.

## Deuda conocida

- **Ningún producto tiene foto.** Ver «El problema de las fotos» en
  [PLAN.md](PLAN.md): está medido y con la pregunta que hay que hacerle al
  encargado.
- **Faltan Core Web Vitals medidos.** LCP, CLS e INP necesitan un navegador que
  componga la página —el de pruebas no lo hace— y el sitio en su dominio. Van
  en F11, con Lighthouse sobre producción.
- **La CSP lleva `unsafe-inline`** en scripts y estilos: Astro los pone en línea
  y sacarlo pide un nonce por respuesta. Se revisa si alguna vez el sitio deja
  de ser mayormente estático.
- **`path-to-regexp` con ReDoS**, por `@astrojs/vercel`. Solo se usa al
  construir, con patrones nuestros. Se corrige cuando Astro actualice.
- Las cifras del panel esperan las APIs de Google (F8).
- `rg -n "ponytail:" src/` lista los atajos deliberados.
