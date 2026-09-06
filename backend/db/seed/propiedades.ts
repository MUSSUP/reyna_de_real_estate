/**
 * Catálogos y propiedades de demostración.
 *
 * Casa Abaton, Torre Mirador y Casa Babilon vienen de la versión aprobada por
 * la clienta (`design/referencias/sec2-buscador-destacadas.png`). El resto se
 * completó para cubrir todas las combinaciones que el sitio tiene que mostrar
 * bien: venta y renta, obra en pozo y terminada, precio a consultar, terreno
 * sin dormitorios, cartera propia y compartida.
 */

export const ZONAS = [
  { slug: 'tulum-centro', city: 'Tulum', zone: 'Centro', sortOrder: 1 },
  { slug: 'tulum-zona-hotelera', city: 'Tulum', zone: 'Zona hotelera', sortOrder: 2 },
  { slug: 'playa-del-carmen', city: 'Playa del Carmen', zone: null, sortOrder: 3 },
  { slug: 'holbox', city: 'Holbox', zone: null, sortOrder: 4 },
];

export const TIPOLOGIAS = [
  { slug: 'casa', nameEs: 'Casa', sortOrder: 1 },
  { slug: 'departamento', nameEs: 'Departamento', sortOrder: 2 },
  { slug: 'villa', nameEs: 'Villa', sortOrder: 3 },
  { slug: 'terreno', nameEs: 'Terreno', sortOrder: 4 },
  { slug: 'local-comercial', nameEs: 'Local comercial', sortOrder: 5 },
];

export const AMENIDADES = [
  { slug: 'piscina', nameEs: 'Piscina', icon: 'piscina' },
  { slug: 'gimnasio', nameEs: 'Gimnasio', icon: 'gimnasio' },
  { slug: 'seguridad-24h', nameEs: 'Seguridad 24h', icon: 'seguridad' },
  { slug: 'estacionamiento', nameEs: 'Estacionamiento', icon: 'auto' },
  { slug: 'roof-top', nameEs: 'Roof top', icon: 'roof' },
  { slug: 'playa-privada', nameEs: 'Playa privada', icon: 'playa' },
  { slug: 'pet-friendly', nameEs: 'Pet friendly', icon: 'mascota' },
  { slug: 'cowork', nameEs: 'Cowork', icon: 'cowork' },
];

export const DESARROLLISTAS = [
  {
    name: 'Grupo Selvática',
    website: 'https://ejemplo-selvatica.mx',
    notes: 'Tres proyectos entregados en Tulum',
  },
  { name: 'Amanecer Desarrollos', website: null, notes: 'Contacto: Mariana, +52 984 000 1111' },
  { name: 'Costa Norte', website: null, notes: 'Especializados en Holbox' },
];

/** Datos internos. NUNCA se muestran en el sitio público (D-09). */
export const PROPIETARIOS = [
  {
    name: 'Familia Restrepo',
    phone: '+52 984 000 2222',
    email: 'restrepo@ejemplo.com',
    notes: 'Prefieren contacto por WhatsApp',
  },
  {
    name: 'Inversiones del Caribe SA',
    phone: null,
    email: 'contacto@ejemplo.com',
    notes: 'Cartera compartida con broker asociado',
  },
];

export interface PropiedadSemilla {
  slug: string;
  titleEs: string;
  descriptionEs: string;
  tipologia: string;
  zona: string;
  desarrollista?: number | null;
  propietario?: number | null;
  operation: 'venta' | 'renta';
  constructionStatus: 'pozo' | 'construccion' | 'terminado';
  yearBuilt?: number | null;
  priceUsd?: string | null;
  priceOnRequest?: boolean;
  areaCoveredM2?: number | null;
  areaTotalM2?: number | null;
  bedrooms: number;
  bathrooms: number;
  amenidades: string[];
  isFeatured: boolean;
  featuredOrder?: number | null;
  ownership: 'propia' | 'compartida';
  status: 'borrador' | 'publicado';
  driveUrl?: string | null;
  /** Color de la imagen de marcador, hasta que haya fotos reales. */
  color: string;
}

export const PROPIEDADES: PropiedadSemilla[] = [
  {
    slug: 'casa-abaton',
    titleEs: 'Casa Abaton',
    descriptionEs:
      'Residencia de autor en el corazón de Tulum, con doble altura y piscina privada rodeada de selva. Los materiales nobles y la ventilación cruzada mantienen la casa fresca todo el año. A ocho minutos de la playa.',
    tipologia: 'casa',
    zona: 'tulum-centro',
    desarrollista: 0,
    propietario: 0,
    operation: 'venta',
    constructionStatus: 'terminado',
    yearBuilt: 2023,
    priceUsd: '1680000.00',
    areaCoveredM2: 800,
    areaTotalM2: 1100,
    bedrooms: 6,
    bathrooms: 5,
    amenidades: ['piscina', 'seguridad-24h', 'estacionamiento', 'pet-friendly'],
    isFeatured: true,
    featuredOrder: 1,
    ownership: 'propia',
    status: 'publicado',
    driveUrl: 'https://drive.google.com/drive/folders/ejemplo-casa-abaton',
    color: '#1E4F4C',
  },
  {
    slug: 'torre-mirador',
    titleEs: 'Torre Mirador',
    descriptionEs:
      'Departamento en planta alta con vista abierta al mar y terraza propia. El edificio tiene roof top con piscina y cowork. Ideal para renta vacacional por su ubicación.',
    tipologia: 'departamento',
    zona: 'holbox',
    desarrollista: 2,
    propietario: 1,
    operation: 'venta',
    constructionStatus: 'terminado',
    yearBuilt: 2022,
    priceUsd: '185000.00',
    areaCoveredM2: 1200,
    areaTotalM2: 1200,
    bedrooms: 2,
    bathrooms: 2,
    amenidades: ['piscina', 'roof-top', 'cowork', 'seguridad-24h'],
    isFeatured: true,
    featuredOrder: 2,
    ownership: 'compartida',
    status: 'publicado',
    driveUrl: 'https://drive.google.com/drive/folders/ejemplo-torre-mirador',
    color: '#255F5B',
  },
  {
    slug: 'casa-babilon',
    titleEs: 'Casa Babilon',
    descriptionEs:
      'Casa de líneas contemporáneas con piscina desbordante y acceso directo a playa privada. Los ambientes se abren por completo al exterior. Entrega inmediata.',
    tipologia: 'casa',
    zona: 'holbox',
    desarrollista: 2,
    propietario: 0,
    operation: 'venta',
    constructionStatus: 'terminado',
    yearBuilt: 2024,
    priceUsd: '950000.00',
    areaCoveredM2: 620,
    areaTotalM2: 900,
    bedrooms: 4,
    bathrooms: 3,
    amenidades: ['piscina', 'playa-privada', 'estacionamiento'],
    isFeatured: true,
    featuredOrder: 3,
    ownership: 'propia',
    status: 'publicado',
    driveUrl: 'https://drive.google.com/drive/folders/ejemplo-casa-babilon',
    color: '#0F1E1D',
  },
  {
    slug: 'villa-sian',
    titleEs: 'Villa Sian',
    descriptionEs:
      'Villa de cuatro suites en la zona hotelera, con playa privada y servicio de mantenimiento incluido. Disponible para renta por temporada.',
    tipologia: 'villa',
    zona: 'tulum-zona-hotelera',
    desarrollista: 0,
    propietario: 1,
    operation: 'renta',
    constructionStatus: 'terminado',
    yearBuilt: 2021,
    priceUsd: '12000.00',
    areaCoveredM2: 450,
    areaTotalM2: 700,
    bedrooms: 4,
    bathrooms: 4,
    amenidades: ['piscina', 'playa-privada', 'seguridad-24h', 'pet-friendly'],
    isFeatured: true,
    featuredOrder: 4,
    ownership: 'compartida',
    status: 'publicado',
    driveUrl: null,
    color: '#C9A96E',
  },
  {
    slug: 'lote-selva-norte',
    titleEs: 'Lote Selva Norte',
    descriptionEs:
      'Terreno de 2.400 m² con uso de suelo residencial y acceso pavimentado. Servicios en frente. Excelente oportunidad para desarrollar.',
    tipologia: 'terreno',
    zona: 'tulum-centro',
    desarrollista: null,
    propietario: 0,
    operation: 'venta',
    constructionStatus: 'terminado',
    yearBuilt: null,
    priceUsd: null,
    priceOnRequest: true,
    areaCoveredM2: null,
    areaTotalM2: 2400,
    bedrooms: 0,
    bathrooms: 0,
    amenidades: [],
    isFeatured: false,
    ownership: 'propia',
    status: 'publicado',
    driveUrl: 'https://drive.google.com/drive/folders/ejemplo-lote-selva',
    color: '#6B6B6B',
  },
  {
    slug: 'residencial-aurora',
    titleEs: 'Residencial Aurora',
    descriptionEs:
      'Departamento de dos dormitorios en preventa, con entrega proyectada a 24 meses. Amenidades completas y esquema de pagos en cuotas durante la obra.',
    tipologia: 'departamento',
    zona: 'playa-del-carmen',
    desarrollista: 1,
    propietario: null,
    operation: 'venta',
    constructionStatus: 'pozo',
    yearBuilt: null,
    priceUsd: '210000.00',
    areaCoveredM2: 95,
    areaTotalM2: 110,
    bedrooms: 2,
    bathrooms: 2,
    amenidades: ['piscina', 'gimnasio', 'roof-top', 'cowork', 'seguridad-24h'],
    isFeatured: false,
    ownership: 'propia',
    status: 'publicado',
    driveUrl: null,
    color: '#FB5696',
  },
  {
    slug: 'local-quinta-avenida',
    titleEs: 'Local en Quinta Avenida',
    descriptionEs:
      'Local a la calle sobre la avenida de mayor circulación peatonal de Playa del Carmen. Actualmente en obra, con entrega a seis meses.',
    tipologia: 'local-comercial',
    zona: 'playa-del-carmen',
    desarrollista: 1,
    propietario: 1,
    operation: 'renta',
    constructionStatus: 'construccion',
    yearBuilt: null,
    priceUsd: '4500.00',
    areaCoveredM2: 120,
    areaTotalM2: 120,
    bedrooms: 0,
    bathrooms: 1,
    amenidades: ['estacionamiento'],
    isFeatured: false,
    ownership: 'compartida',
    status: 'publicado',
    driveUrl: null,
    color: '#E03D7E',
  },
  {
    slug: 'casa-manglar',
    titleEs: 'Casa Manglar',
    descriptionEs:
      'Casa de tres dormitorios a pasos del centro, con patio interno y espacio para ampliar. Buena oportunidad para primera inversión.',
    tipologia: 'casa',
    zona: 'tulum-centro',
    desarrollista: null,
    propietario: 0,
    operation: 'venta',
    constructionStatus: 'terminado',
    yearBuilt: 2019,
    priceUsd: '340000.00',
    areaCoveredM2: 180,
    areaTotalM2: 300,
    bedrooms: 3,
    bathrooms: 2,
    amenidades: ['estacionamiento', 'pet-friendly'],
    isFeatured: false,
    ownership: 'propia',
    status: 'publicado',
    driveUrl: null,
    color: '#DFC089',
  },
];

/** Consultas de ejemplo, en distintos estados, para que la bandeja del panel
 *  se vea como se va a ver en uso real. */
export const LEADS = [
  {
    name: 'Ana Restrepo',
    email: 'ana.restrepo@ejemplo.com',
    phone: '+52 984 100 2030',
    interest: 'invertir' as const,
    message:
      'Vi Casa Abaton y me interesa mucho. ¿Sigue disponible? Viajo a Tulum en dos semanas y me gustaría conocerla.',
    propiedad: 'casa-abaton',
    sourcePath: '/propiedades/casa-abaton',
    status: 'nuevo' as const,
    notes: null,
    diasAtras: 0,
  },
  {
    name: 'Martín Oliveira',
    email: 'm.oliveira@ejemplo.com',
    phone: '+55 11 9000 1122',
    interest: 'invertir' as const,
    message: 'Busco opciones de inversión en preventa hasta 250 mil dólares.',
    propiedad: 'residencial-aurora',
    sourcePath: '/propiedades/residencial-aurora',
    status: 'contactado' as const,
    notes: 'Llamada el martes. Le interesa el esquema de pagos.',
    diasAtras: 2,
  },
  {
    name: 'Sofía Lambert',
    email: 'sofia.lambert@ejemplo.com',
    phone: null,
    interest: 'rentar' as const,
    message: 'Quisiera rentar Villa Sian para diciembre, somos ocho personas.',
    propiedad: 'villa-sian',
    sourcePath: '/propiedades/villa-sian',
    status: 'contactado' as const,
    notes: 'Enviada disponibilidad y tarifa de temporada alta.',
    diasAtras: 5,
  },
  {
    name: 'Diego Fuentes',
    email: 'diego.f@ejemplo.com',
    phone: '+52 998 200 3040',
    interest: 'consulta' as const,
    message: 'Tengo un terreno en la zona y quiero saber si lo pueden comercializar.',
    propiedad: null,
    sourcePath: '/',
    status: 'cerrado' as const,
    notes: 'Se firmó acuerdo de comercialización.',
    diasAtras: 12,
  },
  {
    name: 'Consulta sin datos',
    email: 'spam@ejemplo.com',
    phone: null,
    interest: 'consulta' as const,
    message: 'aaaa',
    propiedad: null,
    sourcePath: '/',
    status: 'descartado' as const,
    notes: 'Mensaje sin contenido.',
    diasAtras: 20,
  },
];
