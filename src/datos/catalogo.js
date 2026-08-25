/* Catálogo de ejemplo. Lo comparten la tienda y el panel: una sola fuente,
   para que el admin cure exactamente los productos que la página muestra.
   ponytail: datos en el código hasta F6. Cuando llegue la API de productos,
   este archivo se reemplaza por la llamada y el resto no se entera —
   siempre que se respete la forma de abajo. */

export const CATEGORIAS = [
  {
    id: 'hogar',
    nombre: 'Hogar',
    lema: 'Lo que hace falta en la casa: limpieza, cerraduras, organización y esos arreglitos del fin de semana.',
    productos: [
      { n: 'Tobo industrial reforzado 12 litros', m: 'Plastihogar', p: 4.50, img: 'tobo-industrial', v: 4.6 },
      { n: 'Coleto de microfibra con mango de aluminio', m: 'Limpiex', p: 6.90, pa: 8.50, img: 'coleto-microfibra', et: 'oferta', v: 4.8 },
      { n: 'Escalera de aluminio 5 peldaños', m: 'Truper', p: 78.00, img: 'escalera-aluminio', v: 4.9 },
      { n: 'Cerradura de seguridad doble paso', m: 'Yale', p: 24.50, img: 'cerradura-seguridad', et: 'nuevo', v: 4.7 },
      { n: 'Surtido de tornillería 200 piezas', m: 'Stanley', p: 18.90, img: 'organizador-gavetas', v: 4.5 },
      { n: 'Juego de bisagras 3" acero inoxidable (4 pzas)', m: 'Total', p: 5.20, img: 'juego-bisagras', v: 4.4 },
    ],
  },
  {
    id: 'construccion',
    nombre: 'Construcción',
    lema: 'Desde la primera cabilla hasta el último saco. Cotizamos la obra completa y te la despachamos.',
    productos: [
      { n: 'Saco de cemento gris 42,5 kg', m: 'Venezolana de Cementos', p: 9.80, img: 'cemento-gris', v: 4.7 },
      { n: 'Cabilla estriada 3/8" x 12 m', m: 'Sidor', p: 11.40, img: 'cabilla-estriada', v: 4.6 },
      { n: 'Carretilla de obra reforzada 6 pies³', m: 'Truper', p: 62.00, pa: 74.00, img: 'carretilla-obra', et: 'oferta', v: 4.8 },
      { n: 'Cuchara de albañil 8" mango de madera', m: 'Total', p: 7.30, img: 'cuchara-albanil', v: 4.5 },
      { n: 'Nivel de burbuja de aluminio 60 cm', m: 'Stanley', p: 12.80, img: 'nivel-burbuja', v: 4.9 },
      { n: 'Malla truckson electrosoldada 2 x 1 m', m: 'Ferrominera', p: 16.50, img: 'malla-truckson', v: 4.4 },
    ],
  },
  {
    id: 'electricas',
    nombre: 'Herramientas eléctricas',
    lema: 'Marcas que aguantan trabajo pesado, con garantía y repuestos aquí mismo en la tienda.',
    productos: [
      { n: 'Taladro percutor 1/2" 750 W', m: 'Bosch', p: 58.00, pa: 72.00, img: 'taladro-percutor', et: 'oferta', v: 4.9 },
      { n: 'Esmeril angular 4½" 900 W', m: 'DeWalt', p: 46.50, img: 'esmeril-angular', v: 4.8 },
      { n: 'Sierra caladora 650 W velocidad variable', m: 'Black+Decker', p: 52.00, img: 'sierra-caladora', v: 4.6 },
      { n: 'Lijadora orbital 5" con bolsa recolectora', m: 'Ingco', p: 41.00, img: 'lijadora-orbital', v: 4.5 },
      { n: 'Atornillador inalámbrico 20V con 2 baterías', m: 'DeWalt', p: 67.00, img: 'atornillador-bateria', et: 'nuevo', v: 5.0 },
      { n: 'Pistola de calor 2000 W dos temperaturas', m: 'Total', p: 29.90, img: 'pistola-calor', v: 4.4 },
    ],
  },
  {
    id: 'plomeria',
    nombre: 'Plomería',
    lema: 'Tubería, conexiones, grifería y piezas sanitarias. Te decimos exactamente qué medida te sirve.',
    productos: [
      { n: 'Llave de paso PVC 1/2"', m: 'Pavco', p: 2.80, img: 'llave-paso', v: 4.3 },
      { n: 'Tubería PVC 1/2" x 6 m presión', m: 'Pavco', p: 6.40, img: 'tuberia-pvc', v: 4.7 },
      { n: 'Grifería de lavamanos cromada monomando', m: 'Fanaven', p: 28.00, pa: 35.00, img: 'griferia-lavamanos', et: 'oferta', v: 4.6 },
      { n: 'Poceta blanca de losa con tanque', m: 'Fanaven', p: 95.00, img: 'poceta-blanca', v: 4.8 },
      { n: 'Teflón 12 mm rollo (paquete de 10)', m: '3M', p: 3.50, img: 'teflon-rollo', v: 4.5 },
      { n: 'Manguera de jardín reforzada 15 m', m: 'Rotoplas', p: 19.90, img: 'manguera-jardin', v: 4.4 },
    ],
  },
  {
    id: 'electricidad',
    nombre: 'Electricidad',
    lema: 'Iluminación, cableado, protección y medición. Todo con certificación para que no te quedes a oscuras.',
    productos: [
      { n: 'Bombillo LED 12 W luz blanca (rosca E27)', m: 'Philips', p: 2.20, img: 'bombillo-led', v: 4.7 },
      { n: 'Cable THW #12 rollo de 100 m', m: 'Cabel', p: 48.00, pa: 56.00, img: 'cable-thw', et: 'oferta', v: 4.9 },
      { n: 'Breaker monofásico 20 A enchufable', m: 'Schneider', p: 6.80, img: 'breaker-monofasico', v: 4.6 },
      { n: 'Tomacorriente doble con placa', m: 'Levinton', p: 3.90, img: 'tomacorriente-doble', v: 4.5 },
      { n: 'Cinta aislante negra (paquete de 5)', m: '3M', p: 4.60, img: 'cinta-aislante', v: 4.8 },
      { n: 'Linterna LED recargable 800 lúmenes', m: 'Ingco', p: 14.50, img: 'linterna-recargable', et: 'nuevo', v: 4.6 },
    ],
  },
];

export const ESTRELLAS = [
  { n: 'Set de destornilladores 12 piezas', m: 'Stanley', p: 16.90, pa: 21.00, img: 'set-destornilladores', et: 'oferta', v: 4.9 },
  { n: 'Juego de llaves combinadas 14 piezas', m: 'Truper', p: 34.00, pa: 42.00, img: 'llaves-combinadas', et: 'oferta', v: 4.8 },
  { n: 'Martillo de uña 16 oz mango de fibra', m: 'Stanley', p: 9.80, img: 'martillo-una', v: 4.9 },
  { n: 'Cinta métrica 8 m con freno', m: 'Truper', p: 7.50, img: 'cinta-metrica', v: 4.7 },
  { n: 'Alicate universal 8" aislado', m: 'Total', p: 8.90, img: 'alicate-universal', v: 4.6 },
  { n: 'Juego de cajas de herramientas (3 tamaños)', m: 'Truper', p: 22.00, img: 'caja-herramientas', v: 4.5 },
  { n: 'Pintura de caucho blanca (galón)', m: 'Montana', p: 18.50, pa: 23.00, img: 'pintura-caucho', et: 'oferta', v: 4.7 },
  { n: 'Brocha 4" cerda natural', m: 'Corimon', p: 4.20, img: 'brocha-cerda', v: 4.3 },
  { n: 'Guantes de seguridad reforzados (par)', m: 'Ingco', p: 3.80, img: 'guantes-seguridad', v: 4.4 },
  { n: 'Casco de seguridad con ajuste ratchet', m: '3M', p: 11.00, img: 'casco-seguridad', v: 4.8 },
  { n: 'Candado de bronce 50 mm con 3 llaves', m: 'Yale', p: 8.40, img: 'candado-acero', v: 4.6 },
  { n: 'Extensión eléctrica 10 m con 3 tomas', m: 'Cabel', p: 13.90, img: 'extension-electrica', v: 4.5 },
  { n: 'Silicón transparente + pistola aplicadora', m: 'Sika', p: 10.60, img: 'silicon-pistola', et: 'nuevo', v: 4.6 },
  { n: 'Discos de corte 4½" (paquete de 10)', m: 'Bosch', p: 9.20, img: 'disco-corte', v: 4.9 },
  { n: 'Cepillo de acero mango de madera', m: 'Total', p: 3.60, img: 'cepillo-acero', v: 4.2 },
  { n: 'Multímetro digital con puntas', m: 'Ingco', p: 17.80, pa: 21.50, img: 'multimetro-digital', et: 'oferta', v: 4.7 },
];

/** Precio de lista, sin rebajas.
    En los datos de ejemplo los productos rebajados traen el descuento
    incrustado: `p` es el precio con rebaja y `pa` el de lista. La rebaja
    pertenece a la curaduría, no al producto, así que acá se desenreda.
    Cuando la API mande precios, `pa` no va a existir y esto devuelve `p`. */
export const precioLista = (prod) => prod.pa ?? prod.p;

/** Los productos se identifican por su slug de imagen: es el único campo
    estable que ya existe. Cuando la API traiga un id propio, se usa ese. */
export const idDe = (p) => p.img;

/** Todos los productos, aplanados y con su categoría a mano. */
export const TODOS = [
  ...CATEGORIAS.flatMap((c) => c.productos.map((p) => ({ ...p, id: idDe(p), cat: c.nombre, catId: c.id }))),
  ...ESTRELLAS.map((p) => ({ ...p, id: idDe(p), cat: 'Estrellas de la semana', catId: 'estrellas' })),
];

/** Índice por id, sin repetidos (un producto puede estar en más de una vitrina). */
export const POR_ID = new Map(TODOS.map((p) => [p.id, p]));
