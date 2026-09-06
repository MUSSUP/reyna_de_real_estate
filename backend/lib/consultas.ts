/**
 * Qué pasa cuando alguien envía una consulta.
 *
 * Vive acá y no en el endpoint por una razón concreta: los caminos que hay que
 * poder probar son justamente los que no ocurren nunca en una demostración —
 * el correo caído, el robot, el sexto envío. Con la base y el correo recibidos
 * como parámetro, cada uno de esos casos se prueba de verdad, sin simular a
 * medias ni depender de que Resend responda.
 *
 * La regla que manda es D-08: **si el aviso por mail falla, la consulta ya
 * quedó guardada.** Nunca se pierde un contacto por un proveedor caído.
 */
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { leads, properties, siteSettings } from '../db/schema';
import { armarAvisoDeConsulta, type Correo } from './mailer';
import { LIMITE_CONSULTAS, limpiarVencidos, registrarIntento, revisarLimite } from './rateLimit';
import { erroresPorCampo, esquemaConsulta } from './validation';

export type Resultado =
  | { tipo: 'ok' }
  /** Trampa activada. Se responde igual que un éxito: el robot no debe aprender. */
  | { tipo: 'descartado' }
  | { tipo: 'datos'; campos: Record<string, string> }
  | { tipo: 'ilegible' }
  | { tipo: 'limite'; reintentarEnSegundos: number }
  | { tipo: 'nose-guardo' };

export interface Entrada {
  db: Db;
  correo: Correo;
  ipHash: string;
  /** El cuerpo tal como llegó, sin validar. */
  crudo: unknown;
  /** Base para armar el enlace a la propiedad dentro del aviso. */
  urlDelSitio: string;
  /** Para dejar rastro de los fallos sin acoplar esto a `console`. */
  registrar?: (mensaje: string, detalle?: unknown) => void;
}

export async function procesarConsulta(entrada: Entrada): Promise<Resultado> {
  const { db, correo, ipHash, crudo, urlDelSitio } = entrada;
  const registrar = entrada.registrar ?? (() => {});

  // --- Límite por IP --------------------------------------------------------
  // Se revisa primero: un envío bloqueado no debe costar trabajo.
  let limite;
  try {
    limite = await revisarLimite(db, 'leads', ipHash, LIMITE_CONSULTAS);
  } catch (error) {
    // Un contador caído no puede ser la razón por la que se pierde una consulta.
    registrar('No se pudo leer el límite por IP; se sigue igual', error);
    limite = { bloqueado: false, intentosRestantes: LIMITE_CONSULTAS.maximo };
  }

  if (limite.bloqueado) {
    return { tipo: 'limite', reintentarEnSegundos: limite.reintentarEn ?? 600 };
  }

  // --- Validación -----------------------------------------------------------
  if (crudo === null || typeof crudo !== 'object') return { tipo: 'ilegible' };

  const analizado = esquemaConsulta.safeParse(crudo);
  if (!analizado.success) {
    return { tipo: 'datos', campos: erroresPorCampo(analizado.error) };
  }
  const datos = analizado.data;

  // Desde acá el envío cuenta, incluidos los robots: que gasten su cuota.
  // Si el contador falla, no se interrumpe nada.
  try {
    await registrarIntento(db, 'leads', ipHash);
  } catch (error) {
    registrar('No se pudo anotar el envío en el contador', error);
  }
  void limpiarVencidos(db, 'leads', LIMITE_CONSULTAS).catch(() => {});

  // --- La trampa ------------------------------------------------------------
  if (datos.website && datos.website.trim() !== '') return { tipo: 'descartado' };

  // --- Resolver la propiedad ------------------------------------------------
  let propertyId: string | null = null;
  let propiedadParaElAviso: { titulo: string; url: string } | null = null;

  if (datos.propertySlug) {
    try {
      const fila = (
        await db
          .select({ id: properties.id, titulo: properties.titleEs, slug: properties.slug })
          .from(properties)
          .where(eq(properties.slug, datos.propertySlug))
          .limit(1)
      )[0];

      // Un slug inventado no invalida la consulta: se guarda sin propiedad.
      if (fila) {
        propertyId = fila.id;
        propiedadParaElAviso = {
          titulo: fila.titulo,
          url: `${urlDelSitio}/propiedades/${fila.slug}`,
        };
      }
    } catch (error) {
      registrar('No se pudo resolver la propiedad; la consulta se guarda igual', error);
    }
  }

  // --- Guardar --------------------------------------------------------------
  // Lo único que no puede fallar en silencio: es la consulta.
  let leadId: string;
  try {
    const guardado = await db
      .insert(leads)
      .values({
        name: datos.name,
        email: datos.email.toLowerCase(),
        phone: datos.phone || null,
        interest: datos.interest,
        message: datos.message || null,
        propertyId,
        sourcePath: datos.sourcePath ?? null,
      })
      .returning({ id: leads.id });

    leadId = guardado[0]!.id;
  } catch (error) {
    registrar('No se pudo guardar la consulta', error);
    return { tipo: 'nose-guardo' };
  }

  // --- Avisar por mail ------------------------------------------------------
  // A partir de acá nada puede cambiar el resultado: la consulta está a salvo.
  try {
    const destino = (
      await db
        .select({ valor: siteSettings.valueEs })
        .from(siteSettings)
        .where(eq(siteSettings.key, 'contacto.lead_email'))
        .limit(1)
    )[0]?.valor;

    if (!destino) {
      registrar('No hay contacto.lead_email configurado: la consulta se guardó sin avisar');
      return { tipo: 'ok' };
    }

    const aviso = armarAvisoDeConsulta({
      nombre: datos.name,
      email: datos.email,
      telefono: datos.phone || null,
      interes: datos.interest,
      mensaje: datos.message || null,
      propiedad: propiedadParaElAviso,
      origen: datos.sourcePath ?? null,
    });

    const enviado = await correo.enviar({ ...aviso, para: destino, responderA: datos.email });

    if (enviado.ok) {
      await db.update(leads).set({ notifiedAt: new Date() }).where(eq(leads.id, leadId));
    } else {
      // `notified_at` queda nulo. La bandeja del panel muestra cuáles no se
      // avisaron, así que un fallo del correo se ve y se puede recuperar.
      registrar('La consulta se guardó pero el aviso falló', enviado.motivo);
    }
  } catch (error) {
    registrar('Falló el aviso por mail; la consulta ya está guardada', error);
  }

  return { tipo: 'ok' };
}
