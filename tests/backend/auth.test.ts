/**
 * La autenticación del panel.
 *
 * Esta prueba faltaba desde la revisión del Hito 1 (hallazgo I-7) y es la que
 * el documento de requisitos nombra primera entre los caminos críticos. Lo
 * que se prueba acá no es que el ingreso funcione —eso se nota enseguida—
 * sino **lo que no se nota hasta que ya pasó**:
 *
 * - que una cookie vencida o manipulada no sirva,
 * - que una sesión firmada con otro secreto no entre,
 * - que la cookie no se pueda leer desde JavaScript,
 * - que el límite de intentos frene de verdad a los cinco,
 * - y que la respuesta sea idéntica para un email que no existe y una
 *   contraseña equivocada.
 */
import { beforeEach, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { crearBaseEfimera } from '../base-efimera';
import {
  cookieDeCierre,
  cookieDeSesion,
  crearToken,
  esRespuesta,
  gastarTiempoEquivalente,
  hashearContrasena,
  hashearIp,
  ipDeLaPeticion,
  leerCookie,
  leerToken,
  NOMBRE_COOKIE,
  requerirSesion,
  verificarContrasena,
} from '../../backend/lib/auth';
import {
  LIMITE_ACCESO,
  limpiarIntentos,
  registrarIntento,
  revisarLimite,
} from '../../backend/lib/rateLimit';
import type { Db } from '../../backend/db/client';

const SESION = {
  userId: '11111111-1111-1111-1111-111111111111',
  email: 'reynaderealestate@gmail.com',
  name: 'Laura',
};

/** El secreto de las pruebas. 32 caracteres es el mínimo que exige el código. */
const SECRETO = 'secreto-de-prueba-de-32-caracteres-o-mas';

beforeAll(() => {
  process.env.JWT_SECRET = SECRETO;
});

const peticionCon = (cookie?: string) =>
  new Request('https://ejemplo.test/api/admin/properties', {
    headers: cookie ? { cookie } : {},
  });

describe('contraseñas', () => {
  it('el hash no se parece a la contraseña y verifica bien', async () => {
    const hash = await hashearContrasena('una-contrasena-larga-y-rara');

    expect(hash).not.toContain('una-contrasena');
    expect(await verificarContrasena('una-contrasena-larga-y-rara', hash)).toBe(true);
    expect(await verificarContrasena('otra-cosa', hash)).toBe(false);
  });

  it('dos veces la misma contraseña dan hashes distintos', async () => {
    // Si fueran iguales, dos personas con la misma contraseña se verían en la
    // base, y un hash filtrado serviría para todas.
    const a = await hashearContrasena('la-misma');
    const b = await hashearContrasena('la-misma');
    expect(a).not.toBe(b);
    expect(await verificarContrasena('la-misma', b)).toBe(true);
  });

  it('el hash es de bcrypt con coste 12', async () => {
    // Bajarlo haría baratísimo probar contraseñas al azar.
    expect(await hashearContrasena('x')).toMatch(/^\$2[aby]\$12\$/);
  });

  it('gastar el tiempo equivalente no explota ni devuelve nada', async () => {
    // Es lo que hace que un email inexistente tarde lo mismo que uno real.
    await expect(gastarTiempoEquivalente('cualquier-cosa')).resolves.toBeUndefined();
  });

  it('un email que no existe y una contraseña mala tardan parecido', async () => {
    const hash = await hashearContrasena('la-correcta');

    const t0 = Date.now();
    await verificarContrasena('la-incorrecta', hash);
    const conUsuario = Date.now() - t0;

    const t1 = Date.now();
    await gastarTiempoEquivalente('la-incorrecta');
    const sinUsuario = Date.now() - t1;

    // Sin el hash de descarte la diferencia sería de dos órdenes de magnitud,
    // y alcanzaría para averiguar qué direcciones están registradas aunque el
    // mensaje de error sea idéntico. El margen es amplio a propósito: lo que
    // se vigila es que no vuelva a ser instantáneo.
    const mayor = Math.max(conUsuario, sinUsuario);
    const menor = Math.min(conUsuario, sinUsuario);
    expect(menor).toBeGreaterThan(20);
    expect(mayor / Math.max(menor, 1)).toBeLessThan(5);
  });
});

describe('el token de sesión', () => {
  it('va y vuelve con los mismos datos', async () => {
    const token = await crearToken(SESION);
    expect(await leerToken(token)).toEqual(SESION);
  });

  it('un token tocado a mano no sirve', async () => {
    const token = await crearToken(SESION);
    // Se cambia un carácter de la firma.
    const roto = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a');
    expect(await leerToken(roto)).toBeNull();
  });

  it('un token firmado con otro secreto no sirve', async () => {
    const token = await crearToken(SESION);

    process.env.JWT_SECRET = 'otro-secreto-completamente-distinto-de-32';
    try {
      // Esto es lo que impide que alguien se firme una sesión de
      // administradora por su cuenta.
      expect(await leerToken(token)).toBeNull();
    } finally {
      process.env.JWT_SECRET = SECRETO;
    }
  });

  it('un token vencido no sirve', async () => {
    // Se firma uno con vencimiento en el pasado, como el que tendría alguien
    // que dejó la pestaña abierta desde ayer.
    const { SignJWT } = await import('jose');
    const vencido = await new SignJWT({ email: SESION.email, name: SESION.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(SESION.userId)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60 * 24)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRETO));

    expect(await leerToken(vencido)).toBeNull();
  });

  it('la sesión dura ocho horas, no más', async () => {
    const { decodeJwt } = await import('jose');
    const carga = decodeJwt(await crearToken(SESION));
    const horas = ((carga.exp ?? 0) - (carga.iat ?? 0)) / 3600;
    expect(horas).toBeCloseTo(8, 1);
  });

  it('un token sin los datos que hacen falta no sirve', async () => {
    const { SignJWT } = await import('jose');
    // Firmado con el secreto bueno, pero sin `sub` ni nombre: si pasara, la
    // sesión quedaría a medias y el panel no sabría de quién es.
    const incompleto = await new SignJWT({ email: SESION.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRETO));

    expect(await leerToken(incompleto)).toBeNull();
  });

  it('cualquier cosa que no sea un token devuelve null en vez de lanzar', async () => {
    for (const basura of ['', 'no-soy-un-token', 'a.b.c', '{}']) {
      expect(await leerToken(basura)).toBeNull();
    }
  });
});

describe('la cookie', () => {
  it('es HttpOnly, SameSite=Strict y dura ocho horas', () => {
    const cookie = cookieDeSesion('un-token');

    // HttpOnly es lo que impide que un XSS se robe la sesión desde
    // JavaScript. SameSite=Strict es lo que la frena en un CSRF.
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain(`Max-Age=${8 * 3600}`);
  });

  it('en producción lleva Secure, y en local no', () => {
    const antes = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      expect(cookieDeSesion('t')).toContain('Secure');
      expect(cookieDeCierre()).toContain('Secure');

      process.env.NODE_ENV = 'development';
      // En local no hay HTTPS: con Secure el navegador no la guardaría.
      expect(cookieDeSesion('t')).not.toContain('Secure');
    } finally {
      if (antes === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = antes;
    }
  });

  it('la de cierre vacía el valor y la vence', () => {
    const cookie = cookieDeCierre();
    expect(cookie).toContain(`${NOMBRE_COOKIE}=;`);
    expect(cookie).toContain('Max-Age=0');
  });

  it('se lee entre otras cookies, y no se confunde con una parecida', () => {
    expect(leerCookie(`otra=1; ${NOMBRE_COOKIE}=elvalor; mas=2`)).toBe('elvalor');
    expect(leerCookie(`${NOMBRE_COOKIE}_falsa=x`)).toBeNull();
    expect(leerCookie('nada=1')).toBeNull();
    expect(leerCookie(null)).toBeNull();
    expect(leerCookie('')).toBeNull();
  });

  it('un token con puntos no se corta al leerlo', () => {
    // Un JWT tiene dos puntos y la cookie se parte por `=`: si se tomara solo
    // el primer trozo, toda sesión quedaría inválida.
    const token = 'aaa.bbb=ccc';
    expect(leerCookie(`${NOMBRE_COOKIE}=${token}`)).toBe(token);
  });
});

describe('el portón de los endpoints', () => {
  it('sin cookie responde 401 y no dice por qué', async () => {
    const r = await requerirSesion(peticionCon());
    expect(esRespuesta(r)).toBe(true);
    if (!esRespuesta(r)) return;

    expect(r.status).toBe(401);
    expect(r.headers.get('Cache-Control')).toBe('no-store');

    const cuerpo = (await r.json()) as { ok: boolean; error: string };
    expect(cuerpo.ok).toBe(false);
    // Nada de "ese usuario no existe" ni "token vencido": no se le informa a
    // quien prueba si iba por buen camino.
    expect(cuerpo.error).toBe('Necesitás iniciar sesión');
  });

  it('con un token inventado responde exactamente lo mismo', async () => {
    const sinCookie = await requerirSesion(peticionCon());
    const conBasura = await requerirSesion(peticionCon(`${NOMBRE_COOKIE}=inventado`));
    if (!esRespuesta(sinCookie) || !esRespuesta(conBasura)) throw new Error('deberían ser 401');

    expect(await conBasura.json()).toEqual(await sinCookie.json());
    expect(conBasura.status).toBe(sinCookie.status);
  });

  it('con una cookie válida devuelve la sesión', async () => {
    const token = await crearToken(SESION);
    const r = await requerirSesion(peticionCon(`${NOMBRE_COOKIE}=${token}`));

    expect(esRespuesta(r)).toBe(false);
    expect(r).toEqual(SESION);
  });
});

describe('el límite de intentos', () => {
  let db: Db;
  let cerrar: () => Promise<void>;
  const ip = 'hash-de-una-ip';

  beforeEach(async () => {
    const e = await crearBaseEfimera();
    db = e.db;
    cerrar = e.cerrar;
  });

  afterEach(async () => {
    await cerrar();
  });

  it('frena al sexto intento, no antes', async () => {
    for (let i = 0; i < LIMITE_ACCESO.maximo; i++) {
      const estado = await revisarLimite(db, 'login', ip, LIMITE_ACCESO);
      expect(estado.bloqueado, `el intento ${i + 1} debería pasar`).toBe(false);
      expect(estado.intentosRestantes).toBe(LIMITE_ACCESO.maximo - i);
      await registrarIntento(db, 'login', ip);
    }

    const cortado = await revisarLimite(db, 'login', ip, LIMITE_ACCESO);
    expect(cortado.bloqueado).toBe(true);
    expect(cortado.intentosRestantes).toBe(0);
    // Hay que poder decirle cuándo volver, o el mensaje no sirve de nada.
    expect(cortado.reintentarEn).toBeGreaterThan(0);
  });

  it('un acceso correcto borra el historial de fallos', async () => {
    for (let i = 0; i < LIMITE_ACCESO.maximo; i++) await registrarIntento(db, 'login', ip);
    expect((await revisarLimite(db, 'login', ip, LIMITE_ACCESO)).bloqueado).toBe(true);

    // Si no se limpiara, entrar bien y después equivocarse una vez dejaría a
    // la clienta afuera quince minutos.
    await limpiarIntentos(db, 'login', ip);
    expect((await revisarLimite(db, 'login', ip, LIMITE_ACCESO)).bloqueado).toBe(false);
  });

  it('los intentos de una IP no afectan a otra', async () => {
    for (let i = 0; i < LIMITE_ACCESO.maximo; i++) await registrarIntento(db, 'login', ip);

    expect((await revisarLimite(db, 'login', 'otra-ip', LIMITE_ACCESO)).bloqueado).toBe(false);
  });

  it('el ingreso y el formulario público cuentan por separado', async () => {
    for (let i = 0; i < LIMITE_ACCESO.maximo; i++) await registrarIntento(db, 'login', ip);

    // Si compartieran el contador, cinco intentos de ingreso dejarían al
    // visitante sin poder mandar una consulta (D-18).
    expect((await revisarLimite(db, 'leads', ip, LIMITE_ACCESO)).bloqueado).toBe(false);
  });
});

describe('la IP de quien pide', () => {
  it('no se guarda en claro', () => {
    const hash = hashearIp('190.1.2.3');
    expect(hash).not.toContain('190.1.2.3');
    expect(hash).toHaveLength(64);
    // El mismo origen tiene que dar el mismo hash, o no se podría contar.
    expect(hashearIp('190.1.2.3')).toBe(hash);
    expect(hashearIp('190.1.2.4')).not.toBe(hash);
  });

  it('el hash depende del secreto del proyecto', () => {
    const conUno = hashearIp('190.1.2.3');
    process.env.JWT_SECRET = 'otro-secreto-completamente-distinto-de-32';
    try {
      // La sal es lo que impide revertirlo con una tabla precalculada: el
      // espacio de direcciones IP es chico.
      expect(hashearIp('190.1.2.3')).not.toBe(conUno);
    } finally {
      process.env.JWT_SECRET = SECRETO;
    }
  });

  it('prefiere la cabecera de Netlify y tiene respaldos', () => {
    const con = (h: Record<string, string>) =>
      ipDeLaPeticion(new Request('https://ejemplo.test/', { headers: h }));

    expect(con({ 'x-nf-client-connection-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })).toBe(
      '1.1.1.1',
    );
    expect(con({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' })).toBe('2.2.2.2');
    // Sin cabeceras no se inventa una IP ni se cae.
    expect(con({})).toBe('desconocida');
  });
});
