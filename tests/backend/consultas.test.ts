/**
 * Los caminos que no ocurren en una demostración.
 *
 * Que el formulario funcione cuando todo anda se ve a simple vista. Lo que hay
 * que sostener con pruebas es lo otro: el correo caído, el robot, el sexto
 * envío, el slug inventado. Son justo los casos donde una consulta se puede
 * perder sin que nadie se entere.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearBaseEfimera } from '../base-efimera';
import { procesarConsulta } from '../../backend/lib/consultas';
import type { Correo, Mensaje, ResultadoEnvio } from '../../backend/lib/mailer';
import {
  leads,
  properties,
  propertyTypes,
  rateLimitHits,
  siteSettings,
  zones,
} from '../../backend/db/schema';
import type { Db } from '../../backend/db/client';

let db: Db;
let cerrar: () => Promise<void>;

/** Un correo que anota lo que le piden en vez de enviarlo. */
function correoQueAnota() {
  const enviados: Mensaje[] = [];
  const correo: Correo = {
    async enviar(mensaje) {
      enviados.push(mensaje);
      return { ok: true, id: 'prueba-1' };
    },
  };
  return { correo, enviados };
}

/** Un correo caído, para comprobar que la consulta igual sobrevive. */
const correoCaido: Correo = {
  async enviar(): Promise<ResultadoEnvio> {
    return { ok: false, motivo: 'El proveedor devolvió 500' };
  },
};

/** Un correo que revienta, que es distinto de uno que devuelve un fallo. */
const correoQueRevienta: Correo = {
  async enviar(): Promise<ResultadoEnvio> {
    throw new Error('Sin red');
  },
};

const CONSULTA_VALIDA = {
  name: 'Ana Pérez',
  email: 'Ana@Ejemplo.com',
  phone: '+52 984 000 0000',
  interest: 'invertir',
  message: 'Me interesa la casa',
  sourcePath: '/propiedades/casa-abaton',
};

async function base(extra: Partial<Parameters<typeof procesarConsulta>[0]> = {}) {
  return {
    db,
    correo: correoQueAnota().correo,
    ipHash: 'ip-de-prueba',
    crudo: CONSULTA_VALIDA,
    urlDelSitio: 'https://reynaderealestate.com',
    ...extra,
  };
}

beforeEach(async () => {
  const efimera = await crearBaseEfimera();
  db = efimera.db;
  cerrar = efimera.cerrar;
  await db
    .insert(siteSettings)
    .values({ key: 'contacto.lead_email', valueEs: 'laura@ejemplo.com', group: 'contacto' });
});

afterEach(async () => {
  await cerrar();
});

describe('la consulta se guarda', () => {
  it('guarda el lead y marca que se avisó', async () => {
    const { correo, enviados } = correoQueAnota();
    const resultado = await procesarConsulta(await base({ correo }));

    expect(resultado.tipo).toBe('ok');

    const guardados = await db.select().from(leads);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]!.name).toBe('Ana Pérez');
    // El email se normaliza: si no, la misma persona entra dos veces distinta.
    expect(guardados[0]!.email).toBe('ana@ejemplo.com');
    expect(guardados[0]!.interest).toBe('invertir');
    expect(guardados[0]!.sourcePath).toBe('/propiedades/casa-abaton');
    expect(guardados[0]!.notifiedAt).not.toBeNull();

    expect(enviados).toHaveLength(1);
    expect(enviados[0]!.para).toBe('laura@ejemplo.com');
    // Al apretar "Responder" tiene que ir a quien consultó, no a nosotros.
    expect(enviados[0]!.responderA).toBe('Ana@Ejemplo.com');
  });

  it('acepta una consulta sin teléfono ni mensaje', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { name: 'Bruno', email: 'b@e.com', interest: 'consulta' } }),
    );

    expect(resultado.tipo).toBe('ok');
    const guardados = await db.select().from(leads);
    expect(guardados[0]!.phone).toBeNull();
    expect(guardados[0]!.message).toBeNull();
  });

  it('usa "consulta" cuando no se eligió interés', async () => {
    await procesarConsulta(await base({ crudo: { name: 'Bruno', email: 'b@e.com' } }));
    const guardados = await db.select().from(leads);
    expect(guardados[0]!.interest).toBe('consulta');
  });
});

describe('si el aviso por mail falla, la consulta NO se pierde (D-08)', () => {
  it('un proveedor que devuelve error deja el lead guardado y sin marcar', async () => {
    const resultado = await procesarConsulta(await base({ correo: correoCaido }));

    // Lo que ve el visitante es un éxito, porque su consulta llegó.
    expect(resultado.tipo).toBe('ok');

    const guardados = await db.select().from(leads);
    expect(guardados).toHaveLength(1);
    // Sin marcar: así la bandeja del panel puede mostrar cuáles no se avisaron.
    expect(guardados[0]!.notifiedAt).toBeNull();
  });

  it('un proveedor que revienta tampoco pierde la consulta', async () => {
    const resultado = await procesarConsulta(await base({ correo: correoQueRevienta }));

    expect(resultado.tipo).toBe('ok');
    expect(await db.select().from(leads)).toHaveLength(1);
  });

  it('sin mail de destino configurado, la consulta se guarda igual', async () => {
    await db.delete(siteSettings).where(eq(siteSettings.key, 'contacto.lead_email'));

    const resultado = await procesarConsulta(await base());

    expect(resultado.tipo).toBe('ok');
    expect(await db.select().from(leads)).toHaveLength(1);
  });
});

describe('la trampa para robots', () => {
  it('descarta el envío y responde como si hubiera salido bien', async () => {
    const { correo, enviados } = correoQueAnota();
    const resultado = await procesarConsulta(
      await base({ correo, crudo: { ...CONSULTA_VALIDA, website: 'http://spam.example' } }),
    );

    // Al robot se le responde lo mismo que a una persona: decirle que lo
    // detectamos solo le enseña a evitar la trampa la próxima vez.
    expect(resultado.tipo).toBe('descartado');
    expect(await db.select().from(leads)).toHaveLength(0);
    expect(enviados).toHaveLength(0);
  });

  it('un campo vacío no se confunde con un robot', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, website: '' } }),
    );

    expect(resultado.tipo).toBe('ok');
    expect(await db.select().from(leads)).toHaveLength(1);
  });

  it('el robot igual gasta su cuota', async () => {
    for (let i = 0; i < 5; i++) {
      await procesarConsulta(await base({ crudo: { ...CONSULTA_VALIDA, website: 'spam' } }));
    }

    // El sexto envío, ya sin trampa, encuentra la puerta cerrada.
    const resultado = await procesarConsulta(await base());
    expect(resultado.tipo).toBe('limite');
  });
});

describe('validación en el servidor', () => {
  it('rechaza un email inválido y dice qué campo', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, email: 'no-es-un-email' } }),
    );

    expect(resultado.tipo).toBe('datos');
    if (resultado.tipo !== 'datos') throw new Error('tipo inesperado');
    expect(resultado.campos.email).toBeTruthy();
    expect(await db.select().from(leads)).toHaveLength(0);
  });

  it('rechaza un nombre de una sola letra', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, name: 'A' } }),
    );
    expect(resultado.tipo).toBe('datos');
  });

  it('rechaza un mensaje de más de 2000 caracteres', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, message: 'x'.repeat(2001) } }),
    );
    expect(resultado.tipo).toBe('datos');
  });

  it('rechaza un interés que no está en la lista', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, interest: 'comprar-un-yate' } }),
    );
    expect(resultado.tipo).toBe('datos');
  });

  it('rechaza un cuerpo que no es un objeto', async () => {
    expect((await procesarConsulta(await base({ crudo: 'hola' }))).tipo).toBe('ilegible');
    expect((await procesarConsulta(await base({ crudo: null }))).tipo).toBe('ilegible');
  });

  it('un envío inválido no consume cuota', async () => {
    for (let i = 0; i < 8; i++) {
      await procesarConsulta(await base({ crudo: { ...CONSULTA_VALIDA, email: 'roto' } }));
    }

    // Quien se equivoca escribiendo no debería quedar bloqueado por eso.
    expect((await procesarConsulta(await base())).tipo).toBe('ok');
  });
});

describe('límite de envíos por IP', () => {
  it('al sexto envío desde la misma IP responde límite', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await procesarConsulta(await base())).tipo).toBe('ok');
    }

    const sexto = await procesarConsulta(await base());
    expect(sexto.tipo).toBe('limite');
    if (sexto.tipo !== 'limite') throw new Error('tipo inesperado');
    expect(sexto.reintentarEnSegundos).toBeGreaterThan(0);
    expect(sexto.reintentarEnSegundos).toBeLessThanOrEqual(10 * 60);

    // Los cinco primeros sí quedaron guardados.
    expect(await db.select().from(leads)).toHaveLength(5);
  });

  it('otra IP no queda afectada', async () => {
    for (let i = 0; i < 5; i++) await procesarConsulta(await base());

    const otra = await procesarConsulta(await base({ ipHash: 'otra-ip' }));
    expect(otra.tipo).toBe('ok');
  });

  it('el contador de consultas no toca el del acceso al panel', async () => {
    for (let i = 0; i < 5; i++) await procesarConsulta(await base());

    // Mismo hash de IP, otro ámbito: el acceso al panel debe seguir libre.
    const marcas = await db
      .select({ scope: rateLimitHits.scope })
      .from(rateLimitHits)
      .where(eq(rateLimitHits.ipHash, 'ip-de-prueba'));

    expect(marcas.filter((m) => m.scope === 'leads')).toHaveLength(5);
    expect(marcas.filter((m) => m.scope === 'login')).toHaveLength(0);
  });
});

describe('la propiedad de origen', () => {
  async function crearPropiedad(slug: string, titulo: string) {
    const [zona] = await db
      .insert(zones)
      .values({ slug: 'tulum', city: 'Tulum', country: 'México' })
      .returning();
    const [tipo] = await db
      .insert(propertyTypes)
      .values({ slug: 'casa', nameEs: 'Casa' })
      .returning();
    const [prop] = await db
      .insert(properties)
      .values({
        slug,
        titleEs: titulo,
        propertyTypeId: tipo!.id,
        zoneId: zona!.id,
        operation: 'venta',
        constructionStatus: 'terminado',
        priceOnRequest: true,
        status: 'publicado',
      })
      .returning();
    return prop!;
  }

  it('enlaza el lead con la propiedad y la nombra en el aviso', async () => {
    const prop = await crearPropiedad('casa-abaton', 'Casa Abaton');
    const { correo, enviados } = correoQueAnota();

    await procesarConsulta(
      await base({ correo, crudo: { ...CONSULTA_VALIDA, propertySlug: 'casa-abaton' } }),
    );

    const guardados = await db.select().from(leads);
    expect(guardados[0]!.propertyId).toBe(prop.id);
    expect(enviados[0]!.asunto).toContain('Casa Abaton');
    expect(enviados[0]!.html).toContain('https://reynaderealestate.com/propiedades/casa-abaton');
  });

  it('un slug inventado no tira la consulta: se guarda sin propiedad', async () => {
    const resultado = await procesarConsulta(
      await base({ crudo: { ...CONSULTA_VALIDA, propertySlug: 'no-existe' } }),
    );

    expect(resultado.tipo).toBe('ok');
    const guardados = await db.select().from(leads);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]!.propertyId).toBeNull();
  });
});

describe('lo que escribe el visitante no se ejecuta', () => {
  it('el mensaje se escapa antes de entrar al HTML del mail', async () => {
    const { correo, enviados } = correoQueAnota();

    await procesarConsulta(
      await base({
        correo,
        crudo: {
          ...CONSULTA_VALIDA,
          name: '<script>alert(1)</script>',
          message: '<img src=x onerror=alert(1)>',
        },
      }),
    );

    const html = enviados[0]!.html;
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');

    // En la base se guarda tal cual llegó: escapar es cosa de quien lo muestra.
    const guardados = await db.select().from(leads);
    expect(guardados[0]!.name).toBe('<script>alert(1)</script>');
  });
});
