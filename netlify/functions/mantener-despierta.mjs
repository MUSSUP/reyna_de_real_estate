import postgres from 'postgres';

/**
 * Mantiene despierto el proyecto de Supabase.
 *
 * El plan gratuito **pausa el proyecto tras unos días sin actividad**. Cuando
 * eso pasa, el sitio público sigue en pie —es estático (D-04)— pero las fotos
 * desaparecen, porque se sirven desde el almacenamiento de Supabase en el
 * momento en que alguien mira la página. O sea: la web se rompe sola, sin que
 * nadie la toque, y se ve rota para cualquiera que entre.
 *
 * Ya pasó dos veces durante el desarrollo. Entregarlo así significa que a la
 * clienta le va a pasar la primera semana que no entre al panel.
 *
 * Esta función corre cada tres días y hace **una consulta trivial**: alcanza
 * para que el proyecto cuente como activo. No lee ni escribe datos del sitio.
 */

export default async () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    // Sin credencial no hay nada que hacer, pero tampoco se falla ruidosamente:
    // esta función no debe ensuciar los registros todos los días.
    console.warn('mantener-despierta: falta DATABASE_URL');
    return new Response('sin configurar', { status: 200 });
  }

  // `max: 1` y vida corta: se abre, se pregunta y se cierra. No tiene sentido
  // sostener un pool para una consulta cada tres días.
  const sql = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10 });

  try {
    await sql`select 1`;
    console.warn('mantener-despierta: la base respondió');
    return new Response('ok', { status: 200 });
  } catch (error) {
    // Se registra y se devuelve 200 igual: si devolviera error, Netlify
    // marcaría la ejecución como fallida y mandaría avisos por algo que se
    // va a reintentar solo en tres días.
    console.error(
      'mantener-despierta: la base no respondió',
      error instanceof Error ? error.message : error,
    );
    return new Response('sin respuesta', { status: 200 });
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }
};

/**
 * Cada tres días, a las 6 de la mañana UTC.
 *
 * El límite del plan gratuito ronda la semana de inactividad; tres días deja
 * margen para que una ejecución falle sin que el proyecto se pause.
 */
export const config = {
  schedule: '0 6 */3 * *',
};
