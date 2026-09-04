# Plan de trabajo — de demo a web funcional

> Para recuperar contexto rápido, ver [BITACORA.md](BITACORA.md).

Convertir el demo actual (2.056 líneas de HTML/CSS/JS estático) en la web
operativa de Casa Herramientas: catálogo real desde API, carrito que cierra por
WhatsApp, SEO activo, analítica y panel de administración.

**Once fases. Cada una se aprueba antes de pasar a la siguiente.** Nada corre en
automático hasta que lo indiques con "modo automático".

---

## Para mañana

**Lo único bloqueado por terceros son las fotos.** F4, F9 y F10 quedaron
cerradas el 2026-09-02, y el 2026-09-03 los rubros pasaron a tener página
propia. Queda F11, que necesita el dominio.

1. **Pedir las imágenes oficiales a los distribuidores.** INGCO, Truper y
   Stanley se las dan a sus clientes, y el negocio lo es. Cubren el 14 % del
   catálogo, que es lo máximo alcanzable hoy. Cargarlas **en la API**, no por
   un lado paralelo. Ver «El problema de las fotos», más abajo.
2. **Terminar de curar las vitrinas.** *Lo más vendido* y *En oferta* tienen un
   producto cada una; las secciones se ocultan solas si quedan vacías.
3. **Comprobar que lleguen los eventos propios a GA4.** Las visitas ya se
   registran; falta ver que aparezcan `add_to_cart` y `search`. Ahora también
   salen desde las páginas de rubro, que hasta el 2026-09-03 no medían nada.
4. **Escribir la política de privacidad.** Su enlace se quitó del pie el
   2026-09-01 junto con los de términos y reclamos, que llevaban a `#nosotros`
   y no prometían nada real. Pero **Google Analytics sigue corriendo**, y eso
   pide una política de verdad: qué se mide, para qué y cómo negarse. El
   banner de consentimiento ya está; falta el documento al que debería apuntar.
5. **F11, la puesta en producción.** Es la única fase que queda: dominio
   propio, HTTPS, Lighthouse sobre el sitio real, monitoreo de errores y una
   prueba de rollback. Necesita el dominio para arrancar.

---

## Cómo trabajamos cada fase

1. Te muestro **qué voy a tocar** y qué queda fuera.
2. Implemento.
3. Te entrego **verificación medida**, no "quedó lindo".
4. Vos aprobás o corregís. Recién ahí sigo.

Si en una fase aparece algo roto que no era parte del encargo, lo reporto y
pregunto antes de arreglarlo. No amplío el alcance por mi cuenta.

---

## Reglas de trabajo

Estas reglas son verificables: cada una se puede aceptar o rechazar mirando el
diff. No son buenas intenciones.

### Contra la sobreingeniería

| # | Regla | Cómo se verifica |
|---|-------|------------------|
| R1 | **Escalera antes de escribir.** ¿Hace falta? → ¿Ya existe en el repo? → ¿Lo hace la plataforma (HTML/CSS/Web API)? → ¿Lo hace una dependencia ya instalada? → recién ahí, código nuevo. | Si el diff agrega algo que la plataforma ya resuelve, se rechaza. |
| R2 | **Cero abstracciones especulativas.** Nada de interfaces con una sola implementación, fábricas de un solo producto, ni config para un valor que nunca cambia. | Buscar en el diff capas sin segundo caso de uso real. |
| R3 | **Una dependencia nueva exige una respuesta.** ¿Qué código propio borra? Si no borra nada y se resuelve en menos de ~50 líneas, no entra. | Cada `package.json` modificado se justifica en el commit. |
| R4 | **El diff más corto que funcione**, pero recién después de entender el problema completo. Un cambio chico en el lugar equivocado es un bug nuevo, no laziness. | Antes de editar, se rastrea el flujo real. |
| R5 | **Atajos marcados.** Toda simplificación deliberada lleva un comentario `ponytail:` que nombra el techo y el camino de salida. | `grep -rn "ponytail:"` da el inventario de deuda. |

### De calidad

| # | Regla | Cómo se verifica |
|---|-------|------------------|
| R6 | **Verificar midiendo.** Nada de "se ve bien". Medidas, respuestas HTTP, valores computados. | Cada fase cierra con números. |
| R7 | **No romper lo que ya anda.** Antes de dar por cerrada una fase, se revalida lo de las fases previas. | Checklist de regresión por fase. |
| R8 | **Nunca simplificar de menos**: validación en los bordes de confianza, manejo de errores que evita pérdida de datos, seguridad y accesibilidad básica. | Auditorías de F9 y F10. |
| R9 | **Idioma consistente.** El proyecto está en español (comentarios, identificadores, textos). Se mantiene así; no se mezcla. | Revisión de diff. |
| R17 | **Español latinoamericano neutro en todo lo que lee el usuario.** Tuteo, nunca voseo: "busca", no "buscá"; "dime", no "decime"; "aquí", no "acá". Vale para la tienda, el panel, el bot y los mensajes de error. | `rg "á</\|ás\b\|és\b"` sobre los textos visibles no debe dar imperativos con acento final. |
| R10 | **Datos de ejemplo siempre marcados** con `<!-- DATO PLACEHOLDER -->` o equivalente. | `grep` los encuentra todos. |
| R11 | **Cero secretos en el repo.** Claves y tokens solo en variables de entorno de Vercel. | Escaneo antes de cada push. |
| R12 | **Commits por unidad de trabajo**, no por tipo de archivo. Mensaje en conventional commits, sin atribución de IA. | `git log` cuenta una historia legible. |
| R14 | **No suponer, no adelantarse.** Ante una duda, preguntar. Nada que Ricardo no haya pedido, por obvio que parezca. | Si el diff tiene algo que no se pidió, sobra. |
| R15 | **Nunca commitear ni pushear sin que Ricardo lo pida.** Terminar, reportar, y dejar los cambios sin commitear. Igual para desplegar, borrar o crear recursos externos. | `git log` no debe tener commits que él no haya pedido. |
| R16 | **Respuestas concretas y directas.** Lenguaje simple, sin rodeos ni jerga innecesaria. Que se entienda de una lectura. | Si hay que releer una frase para entenderla, está mal escrita. |
| R13 | **Respuestas concisas.** Solo el resultado y qué tiene que hacer Ricardo. El detalle técnico va en los comentarios del código y en este plan, no en el chat. | Si la respuesta ocupa más que la pantalla sin que la haya pedido, sobra. |

---

## Decisión de base: el stack

**Decidido: Astro.** Aplicado en F1.

| Opción | A favor | En contra |
|--------|---------|-----------|
| **Astro** (recomendado) | El HTML y las 1.023 líneas de CSS pasan casi tal cual. El JS actual sigue funcionando dentro de islas, sin reescribir. Rutas de API nativas. SSG para SEO. Optimización de imágenes incluida. Envía casi nada de JS. | Stack nuevo para vos. No tenés skills de Astro instaladas. |
| **Next.js** | Tenés `next-best-practices` y `vercel-react-best-practices` instaladas. Es lo más mainstream. | Obliga a reescribir las 484 líneas de HTML como JSX y el carrito/chat/buscador como estado de React. Manda runtime de React a una tienda que es casi toda contenido. Más código para el mismo resultado. |
| **Estático + funciones de Vercel** | Salto mínimo desde lo que hay. | El catálogo se renderiza en el cliente: **el SEO de producto no funciona**. Habría que escribir a mano el pre-render. Más código propio que con Astro. |

Astro gana por la regla R1: la plataforma ya resuelve SSG, rutas de API e
imágenes, y **no obliga a reescribir lo que ya está hecho y verificado**.

Si más adelante el panel admin crece hasta ser una aplicación en serio, se puede
mover solo ese sector sin tocar la tienda.

---

## Las fases

> **Reordenado el 2026-08-12.** Las APIs (productos y chatbot) todavía no están
> entregadas. En vez de esperar, adelantamos todo lo que no depende de ellas y
> dejamos los tramos bloqueados para cuando lleguen.
>
> **La API de productos llegó el 2026-08-31 y F6 está integrada.**
>
> **El chatbot se canceló el 2026-09-01.** F3 y F7 quedan cerradas sin hacer:
> la atención va por WhatsApp, que es donde el negocio ya conversa con sus
> clientes. De once fases queda una: la puesta en producción.

| Fase | Estado | Bloqueada por |
|------|--------|---------------|
| F1 Base técnica | ✅ hecha | — |
| F2 Carrito de compras | ✅ hecha (número de WhatsApp de ejemplo) | — |
| ~~F3 Ventana de chat~~ | ⛔ **cancelada** el 2026-09-01 | — |
| F4 SEO base y rendimiento | ✅ cerrada el 2026-09-02 | — |
| F5 Analítica | ✅ hecha y verificada midiendo | — |
| F6 API de productos y catálogo real | ✅ integrada · faltan las fotos | el negocio no cargó fotos |
| ~~F7 Conexión del chatbot~~ | ⛔ **cancelada** el 2026-09-01 | — |
| F8 Panel de administración | ✅ muestra solo lo comprobable | APIs de Google para las visitas |
| F9 Auditoría de accesibilidad y UI | ✅ cerrada el 2026-09-02 | — |
| F10 Auditoría de ciberseguridad | ✅ cerrada el 2026-09-02 | — |
| F11 Puesta en producción | ⬜ pendiente | dominio |

---

## Lo que ya está en producción

Verificado el 2026-08-24 en el sitio desplegado.

- **Astro híbrido.** La tienda se sirve estática; solo `/admin` y `/api` corren en servidor.
- **Panel de administración** con acceso por clave, cookie firmada con HMAC, `HttpOnly`
  y limitada a `/admin`. Puerta única en middleware: toda página nueva bajo `/admin`
  nace protegida.
- **Cuatro pantallas:** estadísticas, categorías, lo más vendido y ofertas.
  Formularios HTML puros, sin JavaScript de cliente.
- **Curaduría guardada en Vercel Blob.** Probado en producción: se guarda, persiste,
  y la tienda lo refleja. Si el almacén no responde, cae a memoria y lo avisa en pantalla.
- **`/api/vitrinas.json`** sirve las vitrinas, así lo que se edita se ve sin reconstruir
  (caché de 60 s). Si falla, la tienda avisa y deriva a WhatsApp: con 8.437 productos y
  precios que cambian durante el día ya no hay catálogo de respaldo que empaquetar.
- **Sección de Ofertas propia.** Antes cuatro enlaces llevaban a "lo más vendido".
- **GA4 con consentimiento** — no se descarga nada de Google hasta aceptar.
  Verificado el 2026-08-24: las visitas llegan a Tiempo real.
- **Sitio público** en https://casaherramientas.vercel.app
- **Buscador replegable**, hero por tramos responsive, franjas de toque invisibles en
  el hero para móvil.
- **Carrito** en panel lateral, con persistencia y pedido armado hacia WhatsApp,
  más un atajo flotante que aparece cuando hay algo dentro.
- **Panel con barra lateral** y cuatro pantallas: estadísticas (gráfica de visitas
  con Chart.js e histórico por mes), Productos, Lo más vendido y Ofertas.
- **Buscador y menú ⋯** en las tres pantallas de curaduría, para mover un producto
  entre vitrinas sin recargar la selección entera.
- **Ofertas con vencimiento:** al pasar la fecha el producto sale solo de la tienda
  y vuelve a su precio de lista. La opción *Indefinida* la mantiene hasta que el
  admin la saque. Las vencidas quedan en el panel para reactivarlas.
- **Sello de descuento** con forma de estrella, con el porcentaje calculado.

---

### F1 — Base técnica ✅
Migrar el demo al stack elegido **sin cambiar una sola cosa visible**.

- Estructura de carpetas, rutas, layout base.
- El CSS y el JS actuales se mueven, no se reescriben.
- `server.js` se retira: lo reemplaza el servidor de desarrollo del framework.

**Cierre:** la página se ve y se comporta idéntica a hoy. Mismas medidas de hero,
buscador y grillas que ya verificamos. Cero regresiones.

---

### F2 — Carrito de compras
El carrito de hoy es un contador falso. Acá se vuelve real. **No depende de la
API**: funciona con el catálogo de ejemplo y sigue funcionando cuando llegue el
real, porque consume la misma forma de producto.

- Panel del carrito: abrir, cerrar, lista de ítems, vacío.
- Agregar, quitar, cambiar cantidad, vaciar. Subtotal.
- Persistencia entre recargas.
- Armado del mensaje de WhatsApp y manejo del límite de caracteres de `wa.me`.

**Cierre:** se arma un pedido, se abre WhatsApp con el mensaje correcto y
legible. Probado con 1 ítem y con 20.

---

### ~~F3 — Ventana de chat~~ · **cancelada el 2026-09-01**

Ricardo descartó el chatbot: no se va a usar. La atención va por WhatsApp, que
es donde el negocio ya conversa con sus clientes.

Se quitó todo: el botón flotante, el panel, su JavaScript, sus 112 líneas de
CSS y el evento `abrir_chat` de la analítica. El icono `#i-chat` se queda,
porque lo usan los botones de WhatsApp.

Si algún día vuelve, está en la historia de git antes de ese commit.

---

### F4 — SEO base y rendimiento · **cerrada el 2026-09-02**

Se saltó en su momento y quedó como la única fase sin bloqueo. Rindió más que
entonces: con la API integrada hay `codigo` estable, así que el `Product`
estructurado que estaba vetado se pudo hacer sin mentirle a Google.

Hecho y verificado entre el 2026-08-31 y el 2026-09-01:

- ✅ **Páginas de producto** en `/producto/nombre-del-producto/CODIGO`,
  renderizadas en servidor. Era la deuda que dejó F6: sin ellas, 8.437
  productos no tenían una sola URL que Google pudiera indexar.
- ✅ **Redirección 301** de `/producto/CODIGO` al nombre completo, para que los
  enlaces viejos y los que alguien escriba a mano no se rompan ni repartan el
  posicionamiento entre varias direcciones.
- ✅ **Panel lateral** que abre la ficha sin recargar, montado encima de un
  enlace que funciona igual sin JavaScript.
- ✅ **Sitemap** partido en índice y nueve tramos. Ronda las 5.000 direcciones:
  solo entran los productos vendibles.
- ✅ **`robots.txt`** apuntando al sitemap y cerrando `/api/`.
- ✅ **Datos estructurados `Product`**, declarando solo lo que la API garantiza.
- ✅ Canónicas y Open Graph en la ficha.
- ✅ **Página propia por rubro** al tocar «Ver todo» o cualquiera de los 32 del
  menú, que antes eran anclas y en 24 casos no llevaban a ningún lado. Empezó
  siendo una ventana flotante; el 2026-09-03 pasó a ser una página de verdad
  —ver «Los rubros dejan de ser una ventana», más abajo—.
- ✅ **Sello de agotado** en los productos sin existencia, con consulta por
  WhatsApp en vez del botón de agregar.
- ✅ Un solo `<h1>` en la home. Había cuatro, uno por lámina del hero.
- ✅ **Carrito flotante** abajo a la derecha, solo cuando hay algo en el pedido.
- ✅ **Fuera el inicio de sesión y el menú hamburguesa.** No va a haber cuentas,
  y el hamburguesa no abría nada: hacía scroll a una barra ya visible.
- ✅ **Buscador desplegado en el teléfono**, de extremo a extremo y sin el botón
  negro; queda la lupa. Se busca escribiendo o con Enter.
- ✅ **Ofertas en dorado** en el menú, y avisa cuando no hay ninguna publicada.

Cerrado el 2026-09-02:

- ✅ **Metadatos de la home**: canónica, Open Graph y descripción. Open Graph no
  es cosmético acá: es lo que se ve cuando alguien pega el enlace en WhatsApp,
  que es por donde se mueve la venta.
- ✅ **Ficha del negocio para Google**, como `HardwareStore` —más preciso que
  `LocalBusiness`— con dirección, coordenadas, horario, teléfono y mapa.
- ✅ **Páginas de categoría** en `/categoria/[ranura]`, con paginación, miga
  estructurada y `noindex` de la página 2 en adelante. Los 32 rubros pasaron de
  ser anclas de la home a tener dirección propia, y el sitemap las lista.
- ✅ **Caché de dos minutos** en las páginas de categoría y de producto.
- ✅ Core Web Vitals: lo que se pudo medir está abajo.

**Los datos del negocio viven en `datos/negocio.js`.** Estaban repetidos en la
tarjeta de ubicación, el pie y los enlaces de contacto; ahora los pide también
el dato estructurado. Con tres copias, a Google le podía llegar un horario
distinto del que ve el visitante, que es justo lo que penaliza.

#### Lo que se midió

| | |
|---|---|
| Lo que baja el visitante en la home | **56 KB** (42 de CSS, 14 de JS) |
| Respuesta de la home | 6 ms |
| Ficha de producto | 160 ms |
| Página de categoría | 513 ms (dos consultas a la API) |

Los 513 ms de las categorías son el motivo del caché: **cada visita costaba dos
peticiones** —el resumen y el listado— sobre un límite de 120 por minuto para
todo el sitio. Sesenta visitas en un minuto nos dejaban afuera. Con dos minutos
de caché, todas las de ese lapso cuestan una sola.

**No se midieron LCP, CLS ni INP.** Hacen falta un navegador que componga la
página —el de pruebas no lo hace— y el sitio en su dominio. Van en F11, con
Lighthouse sobre producción.

**Por qué el sitemap va partido.** Recorrer el catálogo entero son 85
peticiones y la API admite 120 por minuto por IP. Hacerlas de una sola vez nos
bloqueó durante una tarde. Repartido en tramos de 1.000, Google pide uno por
vez, cada uno cuesta 10 peticiones —medido: 794 ms— y se cachea 24 horas.

**Y por qué no se indexa todo.** El 44 % del catálogo está agotado y ninguno
tiene foto ni descripción. Miles de fichas así son contenido pobre para Google
y arrastran al resto del sitio. Entran solo las vendibles; el resto existe con
`noindex` y vuelve al sitemap solo cuando haya existencia.

**Cierre:** Lighthouse con números concretos y los datos estructurados validados.

---

### F5 — Analítica · cableada
- ✅ GA4 con carga diferida tras consentimiento. Nada de Google se descarga hasta aceptar.
- ✅ Etiqueta de verificación de Search Console, desde variable de entorno.
- ✅ Eventos propios: `add_to_cart` y `search`. Falta el del pedido a WhatsApp (llega con F2).
- ✅ Banner de consentimiento; rechazar cuesta un clic igual que aceptar.
- ⏳ Falta: `PUBLIC_GA_ID` y `PUBLIC_GSC_VERIFICACION` reales, y enviar el sitemap (F4).

**Cierre:** eventos llegando a GA4 y el sitio verificado en Search Console.

---

### F6 — API de productos y catálogo real · **integrada el 2026-08-31**

Los 46 productos de ejemplo se reemplazaron por los **8.437 reales** que sirve
la API de kafe.agency. `src/datos/catalogo.js` ya no existe.

- ✅ Cliente en `src/datos/api.js` y proxy en `/api/catalogo.json`.
- ✅ La home arma ocho filas con las categorías más grandes (74 % del catálogo).
  Las 32 completas van en el menú Productos.
- ✅ Se descartan los agotados (44 % del catálogo) y los que no tienen precio.
- ✅ El buscador consulta el servidor, con espera de 300 ms y cancelación de la
  consulta anterior. Antes filtraba 46 productos en memoria.
- ✅ El panel pasó de casillas a búsqueda con filtro por categoría y paginación.
- ✅ Si la API no responde, la tienda lo dice y ofrece WhatsApp.
- ⏳ Falta: las fotos (ver abajo) y las páginas de producto con su `Product`
  estructurado, que se pueden hacer ahora que hay `codigo` estable.

**Verificado el 2026-08-31:** las dos rutas responden 200, ninguna filtra el
token, ocho categorías con ochenta productos, todos disponibles y con precio, y
las cuatro pantallas del panel siguen redirigiendo sin sesión. Comprobado
también en el navegador con el servidor local: los productos se ven.

#### El problema de las fotos

**Ningún producto tiene foto.** Medido sobre 700 productos en siete tramos del
catálogo: `imagenes` viene `[]` en todos. Tampoco hay destacados.

**Los códigos SÍ son de fábrica** — corregido el 2026-09-01. La primera
revisión miró el campo `referencia` y los códigos de productos sin marca, y
concluyó mal. Mirando los productos con marca:

| Marca | Códigos en el catálogo | Formato del fabricante |
|-------|------------------------|------------------------|
| INGCO | `AKMG5031`, `HPP28258` | letras + números ✅ |
| STANLEY | `88558`, `84055` | cinco dígitos ✅ |
| TRUPER | `13426`, `17351` | cinco dígitos ✅ |
| TOLSEN | `TLV38138`, `V38138` | `V38138` ✅ |

Lo que **no** sirve: `referencia` es la ubicación en la tienda
(`EXHIBICION TABLERO`, `A2-ARRIBA`, y el mismo `04CH` en STANLEY, TRUPER y
TOLSEN a la vez); `modelo` son medidas; `ficha` viene `null`.

**Pero el código de fábrica no alcanza.** Solo el **14 %** del catálogo es de
marcas con catálogo web público:

```
INGCO 325 · STANLEY 278 · TRUPER 221 · WADFOW 194
TOLSEN 129 · BOSCH 40 · TOTAL 39 · DEWALT 25   →  1.251 de 8.437
```

El resto son marcas locales que no publican fotos, más un **18 % sin marca**,
donde no hay ni dónde buscar.

**Camino recomendado:** pedirle los paquetes de imágenes oficiales a los
distribuidores. INGCO, Truper y Stanley se los dan a sus clientes, y el negocio
lo es. Cubre los mismos productos que un robot, sin discusión legal y con
mejor calidad. **Esas fotos van cargadas en la API**, no por un lado paralelo:
el campo `imagenes` ya existe en el contrato y la ficha ya lo lee.

**Descartado: buscar imágenes por título automáticamente.** Ya se probó en este
proyecto con 50 imágenes y salieron mal (un candado ilustrado con una pareja en
la playa). Con 8.437 productos nadie las audita y una foto equivocada genera un
reclamo.

Mientras tanto la tarjeta reserva el hueco con el icono de la casa, del tamaño
exacto que tendrá la imagen real.

**Cierre:** el catálogo sale de la API. Si se cae, la página no se rompe: avisa
y deriva a WhatsApp.

---

### ~~F7 — Conexión del chatbot~~ · **cancelada el 2026-09-01**

Sin chatbot no hay nada que conectar. Nunca llegó la API y ya no hace falta
esperarla.

**Lo que se ahorra al no tenerlo,** además del trabajo: el bot habría sido el
punto más expuesto del sitio —inyección de prompts, abuso de costo y filtrado
de la salida, tres frentes propios en la auditoría de F10— y el único gasto
recurrente del proyecto.

---

### F8 — Panel de administración · shell hecho
- ✅ Renderizado en servidor solo para `/admin`; la tienda sigue estática.
- ✅ Acceso con clave y cookie firmada (HMAC), `HttpOnly` y con `Path=/admin`.
- ✅ Puerta única en middleware: una página nueva bajo `/admin` nace protegida.
- ✅ Tablero con estado de conexiones, métricas y tablas, con datos de muestra rotulados.
- ✅ **El 2026-09-02 se sacaron todas las cifras inventadas.** El tablero tenía
  usuarios, sesiones, CTR, una gráfica de visitas y dos tablas de páginas y
  búsquedas más vistas: todo falso, con un cartelito de «muestra» al lado.
  Servía para ver cómo iba a quedar, pero un panel con números inventados es
  peor que uno vacío — se los termina leyendo como si fueran ciertos.
  Ahora muestra lo comprobable: qué está conectado, cuánto hay en el catálogo y
  qué está publicado en la portada. Se fue con eso la dependencia `chart.js`.
- ⏳ Falta: traer las cifras reales de la GA4 Data API y la Search Console API.
  Ambas piden credenciales de cuenta de servicio.
- ✅ Límite de intentos en el login: 5 por IP cada 15 minutos, con el registro en
  el Blob. Se hizo en F10 — en serverless un contador en memoria no sirve porque
  cada petición puede caer en una instancia nueva.

**Cierre:** sin sesión válida no se accede ni a la vista ni a los datos.
Verificado pegándole directo con curl y con cookies manipuladas.

---

### F9 — Auditoría de accesibilidad y UI · **cerrada el 2026-09-02**

Se auditaron 38 combinaciones de color, los 220 elementos enfocables y los tres
paneles que se superponen. **Dos hallazgos reales**, los dos corregidos.

#### 1 · El gris del texto secundario no llegaba al mínimo

`--gris-500` era `#7C828C`: **3,87:1 contra blanco**, cuando AA pide 4,5. Se lo
veía en la marca de cada producto, en los nombres de las marcas, en las notas y
en las cifras — o sea, en toda la tienda.

El arreglo obligó a partir el token en dos, porque **un mismo gris no puede
servir para los dos fondos**: oscurecerlo mejora sobre blanco y empeora sobre el
negro del pie.

| | Sobre blanco | Sobre el negro del pie |
|---|---|---|
| `#7C828C` (el de antes) | 3,87 ✗ | 4,85 ✓ |
| `--gris-500: #6B717B` | **4,91 ✓** | 3,24 ✗ |
| `--gris-en-negro: #7C828C` | — | **4,85 ✓** |

Los nombres de las marcas estaban peor: en `--gris-300` daban **1,59:1**, casi
invisibles.

**Cuidado al tocar `--gris-500`:** si se usa en algo con fondo oscuro hay que
poner `--gris-en-negro`. Pasó al hacer este mismo cambio — el aviso de derechos
del pie quedó en 3,81 y hubo que corregirlo aparte.

#### 2 · El carrusel no se podía detener

Gira solo cada 5 segundos. Paraba al pasar el mouse por encima, pero **con
teclado o en un teléfono no hay mouse**: quien necesitara más tiempo para leer
una lámina no tenía forma de frenarla. Ahora hay un botón de pausa, siempre
visible —un control de accesibilidad que solo aparece al pasar el mouse no le
sirve a quien lo necesita— y la pausa manual gana sobre el hover.

#### Lo que ya estaba bien

Un solo `<h1>`, jerarquía de encabezados sin saltos, `lang="es-VE"`, enlace de
saltar al contenido, todas las imágenes con `alt`, todos los controles con
nombre accesible, `:focus-visible` definido, ningún `tabindex` positivo, y los
tres paneles con `role="dialog"`, etiqueta, cierre con Escape y foco que entra
al abrir y vuelve al cerrar.

---

### F10 — Auditoría de ciberseguridad · **cerrada el 2026-09-02**

Se revisaron los ocho frentes. **Tres hallazgos altos y medios, los tres
corregidos**; dos bajos, documentados y aceptados.

#### ALTO · El sitio no mandaba ninguna cabecera de seguridad

Ni una: la única era `content-type`. Ahora el middleware las agrega a **todas**
las respuestas —tienda, panel y APIs— porque una sola puerta es una sola cosa
que auditar, y una página nueva nace protegida.

| Cabecera | Para qué |
|---|---|
| `Content-Security-Policy` | Si algo inyecta un `<script>` ajeno, el navegador se niega a ejecutarlo |
| `Strict-Transport-Security` | HTTPS obligatorio por un año |
| `X-Content-Type-Options` | El navegador no adivina tipos: un `.txt` con HTML deja de ejecutarse |
| `Referrer-Policy` | Al salir del sitio se manda el dominio, no qué producto se miraba |
| `Permissions-Policy` | Cámara, micrófono, ubicación y pagos apagados de entrada |
| `X-Frame-Options` + `frame-ancestors` | Nadie mete la tienda en un iframe: así se arman las estafas de clics |

La CSP lleva `'unsafe-inline'` en scripts y estilos porque Astro los pone en
línea; sacarlo pide nonces por respuesta y la home es estática. **Verificado que
no rompe nada:** tipografías, mapa y Analytics siguen cargando.

#### ALTO · El dato estructurado era inyectable

`JSON.stringify` dentro de `<script type="application/ld+json">`: si un nombre
de producto trajera la cadena de cierre de script, el navegador cerraba el
bloque ahí y **todo lo que siguiera se interpretaba como HTML**. Los nombres los
manda la API del negocio, o sea texto que nosotros no controlamos.

Ahora lo serializa `comoJSONLD()`, que escapa los signos de menor, mayor y
ampersand: sigue siendo JSON válido y el texto se lee igual, pero ya no forma
etiquetas.

#### MEDIO · El acceso al panel no tenía freno

Se podían probar claves sin límite contra un panel que tiene una sola. Ahora hay
**5 intentos por IP cada 15 minutos**, con el registro en el mismo Blob que
guarda la curaduría: en serverless un contador en memoria no sirve, porque cada
petición puede caer en una instancia nueva.

La decisión vive en `decidir()` y `sumar()`, funciones puras probadas con 13
casos —incluido que sumar un fallo **no reinicie la ventana**, que si no cada
intento extendería el bloqueo para siempre.

**Sin Blob configurado el freno deja pasar.** Es deliberado: dejar a Ricardo
afuera de su propio panel sería peor que no tener el freno.

#### BAJO · Aceptados, con su razón

- **`path-to-regexp` con ReDoS** (aviso *high* de npm), llega por
  `@astrojs/vercel`. Se usa al **construir** las rutas, con patrones que
  escribimos nosotros: un atacante no controla esa entrada. Se corrige cuando
  Astro actualice su adaptador; forzarlo hoy rompe el despliegue.
- **Google Fonts y el mapa cargan sin consentimiento** y ven la IP del
  visitante. El banner ya no promete lo contrario: dice que *Analytics* no se
  activa, que es lo que se cumple. Quitarlos costaría la tipografía de la marca
  y el mapa del pie.

#### Lo que ya estaba bien

- **Secretos:** nada sensible en lo que baja el navegador, y el token del
  catálogo no aparece en ningún commit de la historia.
- **XSS en el DOM:** los doce puntos que escriben HTML pasan por `limpio()`.
- **Entradas:** el path traversal en `?codigo=` devuelve 404, `limit` se recorta
  a 1–100 y `offset` a cero o más, y el proxy no refleja lo que le mandan.
- **Cookie de sesión:** `HttpOnly`, `Secure` en producción, `SameSite=lax`,
  `Path=/admin` —no viaja en las peticiones de la tienda— y expira a las 8 h. La
  firma se verifica con `crypto.subtle.verify`, que compara en tiempo constante.
- **Errores:** devuelven un mensaje genérico; el detalle solo va al log.
- **CORS:** cerrado. Otro sitio no puede leer nuestras respuestas por `fetch`.
- **Consentimiento:** con rechazo, cero scripts de Google, `gtag` sin definir y
  cero peticiones a Analytics.

---

### Los rubros dejan de ser una ventana · 2026-09-03

Dos arreglos del mismo día, pedidos juntos.

#### Cuatro de los ocho botones del hero no hacían nada

Medido, no supuesto: tres apuntaban a anclas que **no existen en la página**
—`#hogar`, `#electricas`, `#construccion`— y el cuarto a `#ofertas`, que existe
pero está escondida cuando no hay ninguna publicada.

| Botón | Adónde iba | Adónde va |
|---|---|---|
| Ver catálogo | `#hogar` (no existe) | abre el menú Productos · ver abajo |
| Ver herramientas | `#electricas` (no existe) | `/categoria/herramientas-electricas` |
| Ver materiales | `#construccion` (no existe) | `/categoria/albanileria` |
| Ver lo que está en oferta | `#ofertas`, escondida | igual, con el aviso de que no hay |

El aviso de «por ahora no hay ofertas activas» ya existía, pero se enganchaba a
`.nav-destacada`: la clase del botón del menú. El del hero no la tiene, y esa
era exactamente la razón de que no hiciera nada. Ahora el disparador es el
destino —`a[href="#ofertas"]`— así que cubre los dos y cualquiera que se agregue.

#### La ventana flotante de categoría pasa a ser una página

Al tocar «Ver todo» abría una rejilla encima de la home. Cómoda, y **invisible**:
sin dirección propia no hay nada que Google indexe, nada que pegar en un grupo
de WhatsApp y nada a lo que volver con el botón de atrás. La página
`/categoria/…` existía desde F4 y los enlaces apuntaban ahí de verdad, pero el
JavaScript los interceptaba: nadie llegaba nunca.

Ahora la página es la pantalla del rubro, con todo lo que tenía la ventana y lo
que le faltaba:

| | Antes (ventana) | Ahora (página) |
|---|---|---|
| Dirección | ninguna | `/categoria/plomeria` |
| Primeras 24 tarjetas | las traía el navegador | **las pinta el servidor** |
| Buscar en el rubro | sí | sí, y sin JavaScript recarga con `?q=…` |
| Solo disponibles | sí | sí |
| Agregar al pedido | sí | sí, con carrito propio |
| Más productos | scroll infinito | botón «ver más» |
| Dato estructurado | ninguno | `BreadcrumbList` + `ItemList` |

**Lo que se borró:** `vistacategoria.js` entero (189 líneas), su marcado en la
home y 72 líneas de CSS. La página quedó con menos código del que reemplazó.

**Lo que se compartió en vez de copiar:**

- `components/Carrito.astro` — el panel, el flotante y la tostada. Al aparecer
  una segunda pantalla desde donde se agrega, copiarlo habría dejado dos
  marcados que tienen que quedar idénticos para que `carrito.js` encuentre sus
  ids.
- `scripts/tostada.js` — el aviso de abajo estaba escrito tres veces, con tres
  comportamientos apenas distintos.
- `scripts/tarjeta.js` ahora también corre **en el servidor**. Es un template de
  texto, así que la primera tanda la renderiza Astro y las siguientes el
  navegador, con una sola tarjeta escrita en un solo lugar.

**Tres cosas que aparecieron al hacerlo:**

1. **Precio en cero se ofrecía como si valiera cero.** La tarjeta marcaba
   agotado solo si `disponible === false`, así que un producto sin precio
   cargado mostraba «$0,00» y un botón de agregar. Corregido en la tarjeta, o
   sea en las tres pantallas a la vez.
2. **La analítica se cortaba fuera de la home.** `iniciarConsentimiento()`
   salía temprano si no encontraba el banner, y el banner solo está en la home:
   quien aceptaba y entraba a un rubro navegaba sin medición. Ahora la decisión
   se lee antes que el banner.
3. **Una carrera en la carga por tandas.** El `finally` de un pedido cancelado
   soltaba la traba que ya había tomado el pedido nuevo, y entraba una tanda
   encima de la otra: productos repetidos y el contador sumando de a dos. Solo
   suelta la traba el pedido vigente.

**Verificado midiendo**, con el servidor de Ricardo:

```
Rubro:      24 tarjetas servidas · 14 agregar + 10 consultar
Buscar:     "taladro" en herramientas eléctricas → 42 · muestra 24
Filtrar:    16 disponibles de las primeras 24 · cero agotados en pantalla
Ver más:    16 → 33 · cero agotados
Carrito:    contador 1 · flotante $184,16 · guardado en localStorage
Encabezados: h1 → h2 → h3×24 · sin saltos
Sin JS:     paginación con rel=prev/next en el HTML servido
Móvil 375:  no desborda · dos columnas · buscador de extremo a extremo
Rutas:      / 200 · 3 rubros 200 · rubro inexistente 404 · sitemap 200
```

#### De la ficha no se podía volver al rubro

Reportado por Ricardo el mismo día: entrando a `/categoria/automotriz` y
abriendo un producto, el único botón de la cabecera llevaba al **inicio**. Había
que rehacer todo el camino.

- El botón ahora dice «Volver a Automotriz» y va a `/categoria/automotriz`. Sale
  de `p.categoria`, no de cómo se haya llegado: funciona igual entrando desde
  Google. Para ir al inicio está el logo.
- La miga de pan apuntaba a `/#automotriz`, un ancla de la home. **Para 24 de
  los 32 rubros esa ancla no existe** — el mismo error que los botones del hero.
  Ahora va a la página del rubro.
- **Vuelve donde se había quedado**: `categoria.js` guarda tandas, búsqueda,
  filtro y posición en `sessionStorage` al salir, y los repone solo si se viene
  de una ficha.

Primero se probó `history.back()`, que sale gratis. **No sirvió**: el navegador
rehizo la página y volvió a quedar en 24 productos. Se cambió por el guardado
explícito, que sí se puede comprobar.

```
Volver:     72 tandas cargadas → ficha → volver → 72 de nuevo
Con filtro: "aceite" + solo disponibles → ficha → volver → idéntico (3 de 9)
Desde menú: entrando desde la home arranca en 24, sin reponer
Nombre largo: "Sanitarios, fregaderos, bateas y acces." recortado, sin desborde
Slugs:      7 rubros de nombre difícil → 200
Móvil 375:  no desborda · el botón queda en "Volver" · el logo va al inicio
```

#### La ficha tampoco tenía carrito

Se podía agregar —quedaba guardado y salía el aviso— pero no había dónde ver el
pedido ni cómo mandarlo: había que volver al rubro para eso. Ahora la ficha
lleva el mismo `<Carrito />` que la home y los rubros: botón con contador en la
cabecera, panel lateral y atajo flotante. Y sus `add_to_cart` ya llegan a GA4,
que hasta ahora tampoco corría en esta pantalla.

```
Agregar ×2:  contador 2 · flotante $8,12 · aviso con el nombre
Panel:       1 renglón, cantidad 2, total $8,12, enlace a wa.me correcto
Quitar uno:  contador 2 → 1
Cerrar:      panel oculto y el fondo vuelve a scrollear
Agotado:     sin botón de agregar, con "consultar disponibilidad"
Móvil 375:   logo + "Volver" + carrito, sin desborde
```

#### «Ver catálogo» despliega el menú de rubros · 2026-09-04

Bajaba a la sección de categorías de la portada, que muestra **ocho**. Quien
pide ver el catálogo quiere los **32**, y esos están en el menú Productos.
Ahora el botón lo despliega.

El enlace sigue apuntando a `#categorias`, que es su destino real sin
JavaScript. El detalle que costó: el listener va **en el elemento**, no
delegado en `document`. Desde ahí `stopPropagation` no sirve —el listener que
cierra el menú al hacer clic afuera vive en el mismo nodo, y los del mismo nodo
corren igual—, así que el menú se cerraba en el mismo clic que lo abría.

```
Clic:        menú abierto · aria-expanded=true · 32 rubros · sin saltar a #categorias
Foco:        queda en el botón Productos, que es lo que quedó desplegado
Cerrar:      clic afuera ✓ · Escape ✓ · el propio botón Productos alterna ✓
Elegir rubro: cierra el menú y navega a /categoria/herramientas-manuales
Móvil 375:   32 rubros en dos columnas, con scroll, sin desborde
```


---

### F11 — Puesta en producción
- Variables de entorno en Vercel.
- Dominio propio y HTTPS.
- Licencias de imágenes resueltas (ver `public/assets/img/CREDITOS.txt`) o
  reemplazo por fotos reales de la mercancía.
- Monitoreo de errores y prueba de rollback.

**Cierre:** sitio en el dominio real, con los datos reales, y un rollback probado.

---

## Decisiones pendientes

Ninguna bloquea el arranque. Cada una tiene que estar resuelta al empezar su fase.

| # | Pregunta | Se necesita en |
|---|----------|----------------|
| ~~D1~~ | ✅ **Resuelto.** API REST de solo lectura de kafe.agency, sincronizada desde el sistema del negocio. 8.437 productos. | hecho |
| **D2** | **Las fotos: la API devuelve `imagenes: []` en todo el catálogo.** El código sí es el de fábrica, pero solo el 14 % es de marcas con catálogo web. Resuelto el camino —pedir las imágenes oficiales a los distribuidores—, falta hacerlo y que kafe las cargue. | F6 |
| **D3** | **¿A qué número de WhatsApp llega el pedido?** Sin él no funcionan el carrito ni las consultas de producto agotado. El enlace de invitación que hay sirve para abrir el chat, pero no admite texto pre-cargado. | F2 |
| ~~D4~~ | ✅ **Resuelto: no habrá chatbot.** Ricardo lo descartó el 2026-09-01. La atención va por WhatsApp. | — |
| D5 | ¿Cuántas personas entran al panel admin? ¿Hace falta más de un rol? | F8 |
| ~~D6~~ | ✅ **Resuelto: solo cura, no administra.** El nombre y el precio los manda la API; el panel elige qué se muestra y qué está rebajado. | hecho |
| D7 | ¿Hay dominio comprado? | F11 |
| ~~D8~~ | ✅ **Resuelto: Vercel Blob.** "Vercel KV" ya no existe como producto. Se descartó Global Config porque escribir exige un token de la API REST con permisos sobre toda la cuenta. | hecho |
| ~~D9~~ | ✅ **Resuelto: la home lee `/api/vitrinas.json`.** El HTML sigue estático y las vitrinas se piden al cargar, con caché de 60 s. No hace falta reconstruir al guardar. | hecho |
| **D10** | ¿Mostramos productos agotados marcados como tales, o se ocultan? **Hoy se ocultan** — son el 44 % del catálogo. | F6 |

---

## Lo que este plan deja afuera, a propósito

- **Pasarela de pagos.** El cierre es por WhatsApp, como pediste. Integrar
  tarjetas en Venezuela es un proyecto en sí mismo.
- **Control de inventario.** El catálogo lee de la BD; no la escribe.
- **App móvil.** La web responsive cubre el caso.
- **Multi-idioma.** Español de Venezuela, y nada más.

Si alguno hace falta, se agrega como fase nueva y se estima aparte.

---

## Próximo paso

La lista de **Para mañana**, arriba de este documento. Lo que desbloquea más
trabajo es la respuesta del encargado sobre el código de fábrica (D2): decide
si la tienda va a tener fotos o se queda con el hueco reservado.

Sin depender de nadie se puede seguir con **F4 — SEO base**, que ahora vale
más que antes: con `codigo` estable ya se pueden hacer las páginas de producto
y su dato estructurado.
