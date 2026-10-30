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
    // Falla ruidosamente a propósito. Si la variable no llega hasta acá
    // —por ejemplo, porque está cargada solo para la construcción y no para
    // las funciones— esta función no hace nada, y sin un error visible nadie
    // se entera hasta que el sitio aparece sin fotos.
    console.error('mantener-despierta: falta DATABASE_URL');
    return new Response('falta DATABASE_URL', { status: 500 });
  }

  // `max: 1` y vida corta: se abre, se pregunta y se cierra. No tiene sentido
  // sostener un pool para una consulta cada tres días.
  const sql = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10, ssl: 'require' });

  try {
    await sql`select 1`;
    console.log(`mantener-despierta: la base respondió · ${new Date().toISOString()}`);
    return new Response('ok', { status: 200 });
  } catch (error) {
    /*
      Devuelve 500, no 200.

      La primera versión devolvía 200 incluso al fallar, con el argumento de
      no ensuciar los registros por algo que se reintenta solo. **Fue un
      error.** Los tres finales devolvían éxito, así que Netlify no tenía
      forma de distinguir una ejecución buena de una rota — y la función
      estuvo sin funcionar hasta que el sitio apareció sin fotos.

      Un aviso cada tres días es ruido. Una base pausada es la clienta
      mostrando su catálogo sin una sola imagen.
    */
    console.error(
      'mantener-despierta: la base no respondió',
      error instanceof Error ? error.message : error,
    );
    return new Response('sin respuesta', { status: 500 });
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }
};

/**
 * Todos los días, a las 6 de la mañana UTC.
 *
 * Antes corría cada tres días, con el argumento de que el límite del plan
 * ronda la semana y eso dejaba margen. El margen resultó ser de dos intentos:
 * si fallaban los dos, el proyecto se pausaba. Y fallaron.
 *
 * Una consulta trivial por día no cuesta nada medible —el cómputo del mes
 * entero fue menos de un crédito de trescientos— y da siete oportunidades en
 * vez de dos. Para un mecanismo cuyo fallo deja el sitio de la clienta sin
 * fotos, el margen barato vale más que la elegancia.
 */
export const config = {
  schedule: '0 6 * * *',
};
