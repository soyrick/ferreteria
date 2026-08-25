# Plan de trabajo — de demo a web funcional

Convertir el demo actual (2.056 líneas de HTML/CSS/JS estático) en la web
operativa de Casa Herramientas: catálogo real desde API, carrito que cierra por
WhatsApp, chat con bot, SEO activo, analítica y panel de administración.

**Once fases. Cada una se aprueba antes de pasar a la siguiente.** Nada corre en
automático hasta que lo indiques con "modo automático".

---

## Para mañana

1. **Embellecer el tablero del panel.** Hoy cumple pero es plano: faltan gráficos,
   comparativas contra el período anterior y una jerarquía visual que se lea de un
   vistazo.
2. **Comprobar que lleguen los eventos propios.** Las visitas ya se registran;
   falta ver en GA4 que aparezcan `add_to_cart`, `search` y `abrir_chat` cuando
   alguien usa esas funciones.

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
| R10 | **Datos de ejemplo siempre marcados** con `<!-- DATO PLACEHOLDER -->` o equivalente. | `grep` los encuentra todos. |
| R11 | **Cero secretos en el repo.** Claves y tokens solo en variables de entorno de Vercel. | Escaneo antes de cada push. |
| R12 | **Commits por unidad de trabajo**, no por tipo de archivo. Mensaje en conventional commits, sin atribución de IA. | `git log` cuenta una historia legible. |
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
> dejamos los tramos bloqueados para cuando lleguen. El chat se parte en dos:
> la ventana (no necesita API) y la conexión con el bot (sí).

| Fase | Estado | Bloqueada por |
|------|--------|---------------|
| F1 Base técnica | ✅ hecha | — |
| F2 Carrito de compras | ⬜ pendiente | — |
| F3 Ventana de chat | ✅ interfaz hecha | — |
| F4 SEO base y rendimiento | ⬜ pendiente | — |
| F5 Analítica | ✅ hecha y verificada midiendo | — |
| F6 API de productos y catálogo real | ⛔ bloqueada | API de productos |
| F7 Conexión del chatbot | ⛔ bloqueada | API del chatbot |
| F8 Panel de administración | 🟡 funcionando, **faltan las cifras reales** | APIs de Google |
| F9 Auditoría de accesibilidad y UI | ⬜ pendiente | — |
| F10 Auditoría de ciberseguridad | ⬜ pendiente | — |
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
  (caché de 60 s). Si falla, la tienda pinta el catálogo empaquetado y nunca queda vacía.
- **Sección de Ofertas propia.** Antes cuatro enlaces llevaban a "lo más vendido".
- **Ventana de chat** con el botón flotante amarillo. Sin bot todavía: responde una
  plantilla que deriva a WhatsApp.
- **GA4 con consentimiento** — no se descarga nada de Google hasta aceptar.
  Verificado el 2026-08-24: las visitas llegan a Tiempo real.
- **Sitio público** en https://casaherramientas.vercel.app
- **Buscador replegable**, hero por tramos responsive, franjas de toque invisibles en
  el hero para móvil.

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

### F3 — Ventana de chat
La interfaz completa, sin bot detrás. Cuando llegue la API solo se enchufa el
envío y la respuesta.

- Botón flotante que abre y cierra el panel.
- Lista de mensajes, campo de entrada, estados de carga y de error.
- Accesible con teclado; en móvil ocupa la pantalla cómodamente.
- Mientras no haya bot: respuesta de reserva que deriva a WhatsApp.

**Cierre:** conversación simulada de ida y vuelta, con la ventana probada en
escritorio y en móvil.

---

### F4 — SEO base y rendimiento
- Metadatos por página, canónicas, Open Graph.
- `sitemap.xml` y `robots.txt` generados, no escritos a mano.
- Datos estructurados: `LocalBusiness` para la ficha del negocio. El `Product`
  queda pendiente hasta F6: marcar productos de ejemplo como reales sería
  mentirle a Google.
- Core Web Vitals medidos, no estimados.

**Cierre:** Lighthouse con números concretos y los datos estructurados validados.

---

### F5 — Analítica · cableada
- ✅ GA4 con carga diferida tras consentimiento. Nada de Google se descarga hasta aceptar.
- ✅ Etiqueta de verificación de Search Console, desde variable de entorno.
- ✅ Eventos propios: `add_to_cart`, `search`, `abrir_chat`. Falta el del pedido a WhatsApp (llega con F2).
- ✅ Banner de consentimiento; rechazar cuesta un clic igual que aceptar.
- ⏳ Falta: `PUBLIC_GA_ID` y `PUBLIC_GSC_VERIFICACION` reales, y enviar el sitemap (F4).

**Cierre:** eventos llegando a GA4 y el sitio verificado en Search Console.

---

### F6 — API de productos y catálogo real · **bloqueada**
Reemplazar el catálogo de ejemplo de 46 productos por datos reales.

- Definir el **contrato**: `nombre`, `categoria`, `precio`, `fotos`.
- Adaptador de Vercel y ruta de API que consulta la BD y normaliza la respuesta.
- Manejo de imágenes: optimización, tamaños, `alt`, y qué se ve si una foto falta.
- Caché y revalidación: cada cuánto se refresca el precio.
- Páginas de categoría y de producto, más el `Product` estructurado que quedó de F4.

**Cierre:** el catálogo sale de la BD. Si la API se cae, la página no se rompe:
muestra el último estado bueno o un mensaje claro.

---

### F7 — Conexión del chatbot · **bloqueada**
La ventana ya existe desde F3. Acá se enchufa.

- Ruta de API contra el chatbot.
- Estados reales de carga y de error, reemplazando la respuesta de reserva.
- Límite de peticiones por visitante, para que la API no quede expuesta a abuso.

**Cierre:** conversación completa de ida y vuelta, con el caso de error del bot
probado, no solo el camino feliz.

---

### F8 — Panel de administración · shell hecho
- ✅ Renderizado en servidor solo para `/admin`; la tienda sigue estática.
- ✅ Acceso con clave y cookie firmada (HMAC), `HttpOnly` y con `Path=/admin`.
- ✅ Puerta única en middleware: una página nueva bajo `/admin` nace protegida.
- ✅ Tablero con estado de conexiones, métricas y tablas, con datos de muestra rotulados.
- ⏳ Falta: traer las cifras reales de la GA4 Data API y la Search Console API.
  Ambas piden credenciales de cuenta de servicio.
- ⏳ Falta: límite de intentos en el login (va en F10; en serverless un contador
  en memoria no sirve).

**Cierre:** sin sesión válida no se accede ni a la vista ni a los datos.
Verificado pegándole directo con curl y con cookies manipuladas.

---

### F9 — Auditoría de accesibilidad y UI
Con la skill `web-design-guidelines`.

- Navegación completa por teclado, foco visible, lectores de pantalla.
- Contraste de toda la paleta.
- Responsive revisado en los seis tamaños que ya tenemos medidos.

**Cierre:** informe de hallazgos y corrección de los bloqueantes.

---

### F10 — Auditoría de ciberseguridad
**Como especialista en seguridad, sobre el sitio completo.** Esta fase asume que
el resto ya funciona: se audita lo construido, no se construye.

| Frente | Qué se revisa |
|--------|---------------|
| Cabeceras | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Entradas | Validación y saneamiento en toda ruta de API. Inyección en los parámetros del catálogo |
| XSS | Todo punto donde entra contenido del usuario o de la API al DOM — incluido el chat, que es el más expuesto |
| Autenticación | Cookies de sesión, `HttpOnly`/`Secure`/`SameSite`, expiración, fuerza bruta en el login |
| APIs | Límite de peticiones, CORS, autorización por ruta, fuga de datos en respuestas de error |
| Secretos | Que ninguna clave viaje al cliente ni quede en el repo |
| Dependencias | `npm audit` y revisión de lo que efectivamente se instaló |
| Bot de chat | Inyección de prompts, abuso de costo, filtrado de la salida |
| Terceros | Qué carga y qué envía GA4; que el consentimiento se respete de verdad |

**Cierre:** informe con severidad por hallazgo, corrección de todo lo crítico y
alto, y decisión explícita sobre lo medio y bajo.

---

### F11 — Puesta en producción
- Variables de entorno en Vercel.
- Dominio propio y HTTPS.
- Licencias de imágenes resueltas (ver `public/assets/img/CREDITOS.txt`) o
  reemplazo por fotos reales de la mercancía.
- Datos de contacto reales en lugar de los placeholders.
- Monitoreo de errores y prueba de rollback.

**Cierre:** sitio en el dominio real, con los datos reales, y un rollback probado.

---

## Decisiones pendientes

Ninguna bloquea el arranque. Cada una tiene que estar resuelta al empezar su fase.

| # | Pregunta | Se necesita en |
|---|----------|----------------|
| D1 | ¿La BD de productos ya existe? ¿Qué motor, y quién la administra? | F6 |
| D2 | Las fotos: ¿la API devuelve URLs o binarios? ¿Dónde están hospedadas? | F6 |
| D3 | ¿A qué número de WhatsApp llega el pedido? ¿Es el mismo del enlace actual? | F2 |
| D4 | ¿Qué chatbot? ¿Responde sobre el catálogo o es de propósito general? | F7 |
| D5 | ¿Cuántas personas entran al panel admin? ¿Hace falta más de un rol? | F8 |
| D6 | ¿El panel admin solo muestra métricas, o también administra productos? | F8 |
| D7 | ¿Hay dominio comprado? | F11 |
| ~~D8~~ | ✅ **Resuelto: Vercel Blob.** "Vercel KV" ya no existe como producto. Se descartó Global Config porque escribir exige un token de la API REST con permisos sobre toda la cuenta. Falta que crees el store. | hecho |
| D9 | La tienda es estática: los cambios del panel no se ven hasta reconstruir. ¿Reconstrucción automática al guardar, o la home pasa a servidor? | junto con D8 |

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

Los dos puntos de **Para mañana**, arriba de este documento. Después, **F2 —
Carrito de compras**, que no depende de ninguna API.
