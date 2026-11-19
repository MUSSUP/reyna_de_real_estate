/**
 * Los permisos del panel.
 *
 * Lo que se protege acá es **un solo dato que no es de la clienta**: los
 * propietarios —nombre, teléfono y correo de gente que le confió una
 * propiedad—. Todo lo demás que queda restringido (configuración y usuarios)
 * se restringe porque cambia cómo funciona el sitio para todos, no por
 * privacidad.
 *
 * Lo que se prueba no es que el menú esconda cosas —eso se ve— sino lo que no
 * se ve hasta que ya pasó: que quitarle el campo propietario a alguien **no le
 * borre el propietario a la propiedad** al guardar.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { catalogoReservado, rutaReservada, sinPropietario } from '../../backend/lib/permisos';
import {
  cookieDeSesion,
  crearToken,
  esCompleto,
  esRespuesta,
  requerirAccesoCompleto,
  requerirSesion,
  rolDe,
} from '../../backend/lib/auth';

beforeAll(() => {
  process.env.JWT_SECRET = 'secreto-de-prueba-de-32-caracteres-o-mas';
});

/** Una petición con la cookie de sesión de alguien con ese rol. */
async function peticionDe(rol?: 'completo' | 'contenido') {
  const token = await crearToken({
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'quien@ejemplo.test',
    name: 'Quien',
    ...(rol ? { rol } : {}),
  });
  return new Request('https://ejemplo.test/api/admin/settings', {
    headers: { cookie: cookieDeSesion(token).split(';')[0]! },
  });
}

const sesion = (rol?: 'completo' | 'contenido') => ({
  userId: '1',
  email: 'a@b.test',
  name: 'A',
  ...(rol ? { rol } : {}),
});

describe('qué rol tiene una sesión', () => {
  it('una sesión sin rol se trata como acceso completo', () => {
    // Las sesiones firmadas antes de que existieran los permisos no pueden
    // dejar a nadie afuera de golpe.
    expect(rolDe(sesion())).toBe('completo');
    expect(esCompleto(sesion())).toBe(true);
  });

  it('contenido no es acceso completo', () => {
    expect(esCompleto(sesion('contenido'))).toBe(false);
    expect(esCompleto(sesion('completo'))).toBe(true);
  });
});

describe('el catálogo reservado', () => {
  it('sólo los propietarios', () => {
    expect(catalogoReservado('propietarios')).toBe(true);
    for (const otro of ['zonas', 'tipologias', 'desarrollistas', 'amenidades']) {
      expect(catalogoReservado(otro)).toBe(false);
    }
  });
});

describe('las rutas reservadas', () => {
  it('configuración y usuarios, con lo que cuelga de ellas', () => {
    expect(rutaReservada('/admin/configuracion')).toBe(true);
    expect(rutaReservada('/admin/usuarios')).toBe(true);
    expect(rutaReservada('/admin/usuarios/algo')).toBe(true);
  });

  it('el resto del panel no', () => {
    for (const libre of [
      '/admin',
      '/admin/propiedades',
      '/admin/catalogos',
      '/admin/leads',
      '/admin/ayuda',
    ]) {
      expect(rutaReservada(libre)).toBe(false);
    }
  });

  // Un prefijo sin la barra dejaría pasar cualquier cosa que empiece igual.
  it('una ruta que apenas se parece no cuenta', () => {
    expect(rutaReservada('/admin/configuracionX')).toBe(false);
    expect(rutaReservada('/admin/usuariosgatos')).toBe(false);
  });
});

describe('guardar una propiedad sin permiso sobre el propietario', () => {
  // Esto es lo que importa: el campo se quita, NO se vacía. Vaciarlo borraría
  // el propietario de una propiedad que ya lo tenía — un robo de datos
  // disfrazado de permiso.
  it('quita la clave en vez de ponerla en null', () => {
    const limpio = sinPropietario({ titleEs: 'Casa', ownerId: 7 }) as Record<string, unknown>;

    expect('ownerId' in limpio).toBe(false);
    expect(limpio.ownerId).toBeUndefined();
    expect(limpio.titleEs).toBe('Casa');
  });

  it('no toca lo que recibe', () => {
    const original = { titleEs: 'Casa', ownerId: 7 };
    sinPropietario(original);
    expect(original.ownerId).toBe(7);
  });

  it('un cuerpo sin propietario pasa igual', () => {
    expect(sinPropietario({ titleEs: 'Casa' })).toEqual({ titleEs: 'Casa' });
  });

  it('algo que no es un objeto se devuelve tal cual', () => {
    for (const basura of [null, undefined, 'texto', 42, ['a']]) {
      expect(sinPropietario(basura)).toBe(basura);
    }
  });
});

describe('el portón de acceso completo, con sesiones de verdad', () => {
  it('deja pasar a quien tiene acceso completo', async () => {
    const r = await requerirAccesoCompleto(await peticionDe('completo'));
    expect(esRespuesta(r)).toBe(false);
  });

  it('responde 403 a quien sólo tiene contenido', async () => {
    const r = await requerirAccesoCompleto(await peticionDe('contenido'));
    expect(esRespuesta(r)).toBe(true);
    if (!esRespuesta(r)) return;
    expect(r.status).toBe(403);
    // 403 y no 404: quien tiene sesión ya sabe que el panel existe. Esconder
    // la pantalla sólo lograría que crea que algo está roto.
    expect(await r.json()).toMatchObject({ ok: false });
  });

  it('responde 401, no 403, a quien no tiene sesión', async () => {
    const r = await requerirAccesoCompleto(new Request('https://ejemplo.test/api/admin/settings'));
    expect(esRespuesta(r) && r.status).toBe(401);
  });

  it('una sesión vieja sin rol sigue entrando: nadie queda afuera al migrar', async () => {
    const r = await requerirAccesoCompleto(await peticionDe());
    expect(esRespuesta(r)).toBe(false);
  });

  it('el portón de sesión común deja pasar a los dos roles', async () => {
    for (const rol of ['completo', 'contenido'] as const) {
      expect(esRespuesta(await requerirSesion(await peticionDe(rol)))).toBe(false);
    }
  });

  // Esta prueba encontró un defecto real: `crearToken` sólo guardaba el correo
  // y el nombre, así que el permiso se perdía en el viaje y TODO EL MUNDO
  // quedaba con acceso completo, en silencio. Sin ella, los permisos no
  // habrían funcionado nunca y nada lo habría avisado.
  it('el rol viaja dentro del token y vuelve intacto', async () => {
    const r = await requerirSesion(await peticionDe('contenido'));
    expect(esRespuesta(r)).toBe(false);
    if (esRespuesta(r)) return;
    expect(rolDe(r)).toBe('contenido');
    expect(esCompleto(r)).toBe(false);
  });
});

describe('un permiso que no conocemos', () => {
  // La firma garantiza que el valor lo escribimos nosotros, así que esto sólo
  // puede pasar si una versión nueva agrega un rol y una vieja lo lee. Ante la
  // duda, el permiso más acotado: equivocarse dando acceso de más es peor.
  it('se trata como el más acotado, no como completo', async () => {
    const token = await crearToken({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'quien@ejemplo.test',
      name: 'Quien',
      rol: 'supervisor' as unknown as 'completo',
    });

    const r = await requerirSesion(
      new Request('https://ejemplo.test/api/admin/settings', {
        headers: { cookie: cookieDeSesion(token).split(';')[0]! },
      }),
    );

    expect(esRespuesta(r)).toBe(false);
    if (esRespuesta(r)) return;
    expect(rolDe(r)).toBe('contenido');
  });
});
