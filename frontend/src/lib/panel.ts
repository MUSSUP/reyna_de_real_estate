/**
 * Consultas del panel.
 *
 * Separadas de `lib/datos.ts` a propósito: aquéllas se resuelven una vez al
 * construir el sitio y cachean; éstas corren **en cada visita** y tienen que
 * devolver el estado real de la base, no uno de hace un rato.
 */
import { count, desc, eq } from 'drizzle-orm';
import { getDb } from '../../../backend/db/client';
import {
  amenities,
  articles,
  developers,
  leads,
  owners,
  properties,
  propertyTypes,
  zones,
} from '../../../backend/db/schema';

export interface Resumen {
  propiedadesPublicadas: number;
  propiedadesBorrador: number;
  articulosPublicados: number;
  consultasNuevas: number;
}

export async function obtenerResumen(): Promise<Resumen> {
  const db = getDb();

  const [publicadas, borradores, articulos, nuevas] = await Promise.all([
    db.select({ n: count() }).from(properties).where(eq(properties.status, 'publicado')),
    db.select({ n: count() }).from(properties).where(eq(properties.status, 'borrador')),
    db.select({ n: count() }).from(articles).where(eq(articles.status, 'publicado')),
    db.select({ n: count() }).from(leads).where(eq(leads.status, 'nuevo')),
  ]);

  return {
    propiedadesPublicadas: publicadas[0]?.n ?? 0,
    propiedadesBorrador: borradores[0]?.n ?? 0,
    articulosPublicados: articulos[0]?.n ?? 0,
    consultasNuevas: nuevas[0]?.n ?? 0,
  };
}

/** Las últimas consultas para el tablero. Sin el mensaje: acá solo se listan. */
export async function obtenerUltimasConsultas(limite = 5) {
  const db = getDb();
  return db
    .select({
      id: leads.id,
      nombre: leads.name,
      email: leads.email,
      telefono: leads.phone,
      interes: leads.interest,
      estado: leads.status,
      avisado: leads.notifiedAt,
      creado: leads.createdAt,
      propiedad: properties.titleEs,
    })
    .from(leads)
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .orderBy(desc(leads.createdAt))
    .limit(limite);
}

// --- Catálogos para los formularios -----------------------------------------

/**
 * Todo lo que el formulario de una propiedad necesita para armar sus listas.
 *
 * Va en una sola función porque el formulario los necesita todos juntos:
 * cinco consultas sueltas desde la página serían cinco viajes a la base para
 * pintar una pantalla.
 */
export async function obtenerCatalogos() {
  const db = getDb();

  const [zonas, tipologias, desarrollistas, propietarios, amenidades] = await Promise.all([
    db
      .select({ id: zones.id, ciudad: zones.city, zona: zones.zone, pais: zones.country })
      .from(zones)
      .orderBy(zones.sortOrder, zones.city),
    db
      .select({ id: propertyTypes.id, nombre: propertyTypes.nameEs })
      .from(propertyTypes)
      .orderBy(propertyTypes.sortOrder, propertyTypes.nameEs),
    db
      .select({ id: developers.id, nombre: developers.name })
      .from(developers)
      .orderBy(developers.name),
    // Interno: se usa solo dentro del panel y jamás sale al sitio (RNF-10).
    db.select({ id: owners.id, nombre: owners.name }).from(owners).orderBy(owners.name),
    db
      .select({ id: amenities.id, nombre: amenities.nameEs, icono: amenities.icon })
      .from(amenities)
      .orderBy(amenities.nameEs),
  ]);

  return { zonas, tipologias, desarrollistas, propietarios, amenidades };
}

export type Catalogos = Awaited<ReturnType<typeof obtenerCatalogos>>;
