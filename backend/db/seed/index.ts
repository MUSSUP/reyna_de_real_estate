/**
 * Carga datos de demostración.
 *
 *   npm run seed            → carga sobre lo que haya
 *   npm run seed -- --limpiar  → borra todo y vuelve a cargar
 *
 * Las imágenes son **marcadores generados**, no fotos reales de propiedades:
 * rectángulos con los colores de la marca y el nombre encima. Sirven para
 * verificar que las páginas se ven bien, y se reemplazan por fotos de verdad
 * desde el panel.
 */
import { sql } from 'drizzle-orm';
import sharp from 'sharp';
import { getDb } from '../client';
import {
  amenities,
  articles,
  developers,
  leads,
  owners,
  properties,
  propertyAmenities,
  propertyImages,
  propertyTypes,
  siteSettings,
  zones,
} from '../schema';
import { crearAlmacenamientoS3 } from '../../lib/storage';
import { procesarYGuardar } from '../../lib/images';
import { CLAVES_CONFIGURACION, INFORME_INSIGHTS, NOTICIAS } from './contenido';
import {
  AMENIDADES,
  DESARROLLISTAS,
  LEADS,
  PROPIEDADES,
  PROPIETARIOS,
  TIPOLOGIAS,
  ZONAS,
} from './propiedades';

const limpiar = process.argv.includes('--limpiar');
const sinImagenes = process.argv.includes('--sin-imagenes');
const db = getDb();

function log(mensaje: string) {
  console.warn(mensaje);
}

/** Genera un marcador visual con los colores de la marca. */
async function generarMarcador(texto: string, color: string, ancho = 1600, alto = 1200) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#0F1E1D"/>
    </linearGradient></defs>
    <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
    <text x="50%" y="48%" text-anchor="middle" fill="#F2E9E4"
          font-family="Georgia,serif" font-size="${Math.round(ancho / 22)}">${texto.replace(/[<>&]/g, '')}</text>
    <text x="50%" y="56%" text-anchor="middle" fill="#C9A96E"
          font-family="Georgia,serif" font-size="${Math.round(ancho / 55)}" letter-spacing="6">IMAGEN DE DEMOSTRACION</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

if (limpiar) {
  log('Borrando datos existentes…');
  // El orden respeta las dependencias entre tablas.
  await db.delete(propertyImages);
  await db.delete(propertyAmenities);
  await db.delete(leads);
  await db.delete(properties);
  await db.delete(articles);
  await db.delete(amenities);
  await db.delete(developers);
  await db.delete(owners);
  await db.delete(propertyTypes);
  await db.delete(zones);
  await db.delete(siteSettings);
  await db.execute(sql`alter sequence zones_id_seq restart with 1`);
  await db.execute(sql`alter sequence property_types_id_seq restart with 1`);
  await db.execute(sql`alter sequence amenities_id_seq restart with 1`);
  await db.execute(sql`alter sequence developers_id_seq restart with 1`);
  await db.execute(sql`alter sequence owners_id_seq restart with 1`);
}

log('Cargando catálogos…');
const zonasIns = await db.insert(zones).values(ZONAS).returning();
const tiposIns = await db.insert(propertyTypes).values(TIPOLOGIAS).returning();
const amenIns = await db.insert(amenities).values(AMENIDADES).returning();
const devIns = await db.insert(developers).values(DESARROLLISTAS).returning();
const ownIns = await db.insert(owners).values(PROPIETARIOS).returning();
log(
  `  ${zonasIns.length} zonas · ${tiposIns.length} tipologías · ${amenIns.length} amenidades · ${devIns.length} desarrollistas · ${ownIns.length} propietarios`,
);

const idZona = (slug: string) => zonasIns.find((z) => z.slug === slug)!.id;
const idTipo = (slug: string) => tiposIns.find((t) => t.slug === slug)!.id;
const idAmen = (slug: string) => amenIns.find((a) => a.slug === slug)!.id;

const almacen = sinImagenes ? null : crearAlmacenamientoS3();

log('Cargando propiedades…');
const propiedadesPorSlug = new Map<string, string>();

for (const p of PROPIEDADES) {
  // Las dimensiones se guardan: de ellas depende qué variante existe y, por
  // lo tanto, cuál puede pedir el HTML sin quedarse con un recuadro roto.
  let coverPath: string | null = null;
  let coverWidth: number | null = null;
  let coverHeight: number | null = null;

  if (almacen) {
    const marcador = await generarMarcador(p.titleEs, p.color);
    const r = await procesarYGuardar(almacen, marcador, {
      carpeta: `propiedades/${p.slug}`,
      nombreOriginal: `${p.slug}-portada.jpg`,
    });
    if (r.ok) {
      coverPath = r.imagen.rutaBase;
      coverWidth = r.imagen.width;
      coverHeight = r.imagen.height;
    }
  }

  const [creada] = await db
    .insert(properties)
    .values({
      slug: p.slug,
      titleEs: p.titleEs,
      descriptionEs: p.descriptionEs,
      propertyTypeId: idTipo(p.tipologia),
      zoneId: idZona(p.zona),
      developerId: p.desarrollista != null ? devIns[p.desarrollista]!.id : null,
      ownerId: p.propietario != null ? ownIns[p.propietario]!.id : null,
      operation: p.operation,
      constructionStatus: p.constructionStatus,
      yearBuilt: p.yearBuilt ?? null,
      priceUsd: p.priceUsd ?? null,
      priceOnRequest: p.priceOnRequest ?? false,
      areaCoveredM2: p.areaCoveredM2 ?? null,
      areaTotalM2: p.areaTotalM2 ?? null,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      coverPath,
      coverWidth,
      coverHeight,
      coverAltEs: `${p.titleEs} — imagen de demostración`,
      driveUrl: p.driveUrl ?? null,
      isFeatured: p.isFeatured,
      featuredOrder: p.featuredOrder ?? null,
      status: p.status,
      ownership: p.ownership,
      publishedAt: p.status === 'publicado' ? new Date() : null,
    })
    .returning();

  propiedadesPorSlug.set(p.slug, creada!.id);

  if (p.amenidades.length > 0) {
    await db
      .insert(propertyAmenities)
      .values(p.amenidades.map((a) => ({ propertyId: creada!.id, amenityId: idAmen(a) })));
  }

  // Galería: entre 4 y 6 imágenes por propiedad.
  if (almacen) {
    const cantidad = 4 + (p.slug.length % 3);
    for (let i = 1; i <= cantidad; i++) {
      const img = await generarMarcador(`${p.titleEs} · ${i}`, p.color, 1600, 1067);
      const r = await procesarYGuardar(almacen, img, {
        carpeta: `propiedades/${p.slug}`,
        nombreOriginal: `${p.slug}-${i}.jpg`,
      });
      if (r.ok) {
        await db.insert(propertyImages).values({
          propertyId: creada!.id,
          storagePath: r.imagen.rutaBase,
          altEs: `${p.titleEs}, imagen ${i} — demostración`,
          width: r.imagen.width,
          height: r.imagen.height,
          sortOrder: i,
        });
      }
    }
  }
  log(`  ${p.titleEs}${coverPath ? '' : ' (sin imagen)'}`);
}

log('Cargando el informe y las noticias…');
let portadaInforme: string | null = null;
let anchoInforme: number | null = null;
let altoInforme: number | null = null;
if (almacen) {
  const img = await generarMarcador('Bienes raíces', '#1E4F4C', 1600, 900);
  const r = await procesarYGuardar(almacen, img, {
    carpeta: 'articulos',
    nombreOriginal: 'informe-portada.jpg',
  });
  if (r.ok) {
    portadaInforme = r.imagen.rutaBase;
    anchoInforme = r.imagen.width;
    altoInforme = r.imagen.height;
  }
}

await db.insert(articles).values({
  slug: 'bienes-raices-una-oportunidad-de-crecimiento',
  type: 'informe',
  titleEs: 'Bienes raíces: una oportunidad de crecimiento',
  excerptEs:
    '¿Por qué invertir sigue siendo una decisión inteligente? Un análisis del mercado inmobiliario y de lo que sostiene el valor a largo plazo.',
  bodyEs: INFORME_INSIGHTS,
  coverPath: portadaInforme,
  coverWidth: anchoInforme,
  coverHeight: altoInforme,
  coverAltEs: 'Vista aérea de playa en Riviera Maya',
  status: 'publicado',
  isPinned: true,
  publishedAt: new Date(),
});

for (const [i, n] of NOTICIAS.entries()) {
  let portada: string | null = null;
  let anchoPortada: number | null = null;
  let altoPortada: number | null = null;
  if (almacen) {
    const img = await generarMarcador(
      n.titulo.slice(0, 28),
      i === 0 ? '#255F5B' : i === 1 ? '#C9A96E' : '#FB5696',
      1600,
      900,
    );
    const r = await procesarYGuardar(almacen, img, {
      carpeta: 'articulos',
      nombreOriginal: `${n.slug}.jpg`,
    });
    if (r.ok) {
      portada = r.imagen.rutaBase;
      anchoPortada = r.imagen.width;
      altoPortada = r.imagen.height;
    }
  }
  await db.insert(articles).values({
    slug: n.slug,
    type: 'noticia',
    titleEs: n.titulo,
    excerptEs: n.bajada,
    bodyEs: n.cuerpo,
    coverPath: portada,
    coverWidth: anchoPortada,
    coverHeight: altoPortada,
    coverAltEs: `${n.titulo} — imagen de demostración`,
    status: 'publicado',
    isPinned: i === 0,
    publishedAt: new Date(Date.now() - i * 7 * 86400_000),
  });
}
log(`  1 informe · ${NOTICIAS.length} noticias`);

log('Cargando consultas de ejemplo…');
for (const l of LEADS) {
  await db.insert(leads).values({
    name: l.name,
    email: l.email,
    phone: l.phone,
    interest: l.interest,
    message: l.message,
    propertyId: l.propiedad ? (propiedadesPorSlug.get(l.propiedad) ?? null) : null,
    sourcePath: l.sourcePath,
    status: l.status,
    notes: l.notes,
    notifiedAt: l.status === 'nuevo' ? null : new Date(Date.now() - l.diasAtras * 86400_000),
    createdAt: new Date(Date.now() - l.diasAtras * 86400_000),
  });
}
log(`  ${LEADS.length} consultas`);

log('Cargando configuración del sitio…');
await db.insert(siteSettings).values(
  CLAVES_CONFIGURACION.map((c) => ({
    key: c.key,
    valueEs: c.valueEs,
    group: c.group,
    inputType: c.inputType,
  })),
);
log(`  ${CLAVES_CONFIGURACION.length} claves`);

log('\n✅ Datos de demostración cargados');
process.exit(0);
