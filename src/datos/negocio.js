/* Los datos del negocio, en un solo lugar.

   Estaban repetidos en la tarjeta de ubicación, en el pie y en los enlaces de
   contacto; ahora los pide también el dato estructurado que lee Google. Con
   tres copias, cambiar un horario significaba acordarse de todas — y a Google
   le llegaría una versión distinta de la que ve el visitante, que es
   exactamente lo que penaliza. */

export const NEGOCIO = {
  nombre: 'Casa Herramientas, C.A.',
  nombreCorto: 'Casa Herramientas',
  rubro: 'Ferretería y Construcción C.H',

  descripcion:
    'Ferretería y construcción en Barcelona, estado Anzoátegui. Herramientas, '
    + 'materiales, plomería, electricidad y todo para el hogar, con atención '
    + 'desde el arreglo de la casa hasta el pedido industrial.',

  direccion: {
    calle: 'Calle Guayaquil, frente al estadio de béisbol de Barrio Sucre',
    ciudad: 'Barcelona',
    estado: 'Anzoátegui',
    pais: 'VE',
  },

  /* Coordenadas de la ficha de Google Maps del negocio. */
  geo: { lat: 10.1482035, lon: -64.6748066 },
  mapa: 'https://www.google.com/maps/place/CASA+HERRAMIENTAS,+C.A/@10.1480428,-64.6753437,19.5z/data=!4m6!3m5!1s0x8c2d72ff55af9c01:0xc74ecd4bfbba9f2a!8m2!3d10.1482035!4d-64.6748066!16s%2Fg%2F11gbfdy27p',

  telefono: '+584248190490',
  correo: 'casaherramienta@gmail.com',
  instagram: 'https://www.instagram.com/casaherramientas.ca/',

  /* Lunes a sábado de 8:00 a 16:50. El formato de dos letras y 24 horas es el
     que pide schema.org; el texto que se lee en pantalla vive en el HTML. */
  horario: { dias: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], abre: '08:00', cierra: '16:50' },

  monedas: 'USD',
  pagos: 'Pago móvil, divisas, débito, Zelle y Binance',
};

/** Ficha del negocio para Google. HardwareStore es más preciso que LocalBusiness. */
export function datosNegocio(base) {
  const n = NEGOCIO;
  return {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    '@id': `${base}/#negocio`,
    name: n.nombre,
    alternateName: n.rubro,
    description: n.descripcion,
    url: base,
    logo: `${base}/assets/logo.png`,
    image: `${base}/assets/logo.png`,
    telephone: n.telefono,
    email: n.correo,
    currenciesAccepted: n.monedas,
    paymentAccepted: n.pagos,
    address: {
      '@type': 'PostalAddress',
      streetAddress: n.direccion.calle,
      addressLocality: n.direccion.ciudad,
      addressRegion: n.direccion.estado,
      addressCountry: n.direccion.pais,
    },
    geo: { '@type': 'GeoCoordinates', latitude: n.geo.lat, longitude: n.geo.lon },
    hasMap: n.mapa,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: n.horario.dias.map((d) => `https://schema.org/${
        { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday' }[d]
      }`),
      opens: n.horario.abre,
      closes: n.horario.cierra,
    }],
    sameAs: [n.instagram],
  };
}
