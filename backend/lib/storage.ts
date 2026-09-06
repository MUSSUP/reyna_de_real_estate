/**
 * Almacenamiento de archivos.
 *
 * Se define primero la interfaz y después la implementación en S3. El proyecto
 * arranca en Supabase Storage pero puede mudarse a MinIO en un VPS propio
 * (RNF-07): quien quiera cambiar de proveedor escribe otra implementación de
 * `Almacenamiento` y no toca nada más.
 *
 * En la base se guarda SIEMPRE la ruta, nunca la URL completa: el origen puede
 * cambiar y las rutas guardadas seguirían apuntando al proveedor viejo.
 */
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { leerEnv } from './entorno';

export interface Almacenamiento {
  /** Guarda un archivo y devuelve la ruta con la que quedó. */
  guardar(ruta: string, contenido: Buffer, tipoMime: string): Promise<string>;
  /** Borra un archivo. No falla si ya no está. */
  borrar(ruta: string): Promise<void>;
  /** URL pública para mostrar el archivo. */
  urlPublica(ruta: string): string;
}

interface ConfiguracionS3 {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  urlPublicaBase?: string | undefined;
}

function leerConfiguracion(): ConfiguracionS3 {
  const endpoint = leerEnv('STORAGE_ENDPOINT');
  const bucket = leerEnv('STORAGE_BUCKET');
  const accessKey = leerEnv('STORAGE_ACCESS_KEY');
  const secretKey = leerEnv('STORAGE_SECRET_KEY');

  // Se nombra la variable que falta, nunca su valor.
  const faltantes = [
    ['STORAGE_ENDPOINT', endpoint],
    ['STORAGE_BUCKET', bucket],
    ['STORAGE_ACCESS_KEY', accessKey],
    ['STORAGE_SECRET_KEY', secretKey],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
  }

  return {
    endpoint: endpoint as string,
    bucket: bucket as string,
    accessKey: accessKey as string,
    secretKey: secretKey as string,
    region: leerEnv('STORAGE_REGION') ?? 'us-east-1',
    urlPublicaBase: leerEnv('STORAGE_PUBLIC_URL'),
  };
}

export function crearAlmacenamientoS3(config = leerConfiguracion()): Almacenamiento {
  const cliente = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    // Necesario para MinIO y Supabase: sin esto el bucket va en el subdominio.
    forcePathStyle: true,
  });

  return {
    async guardar(ruta, contenido, tipoMime) {
      await cliente.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: ruta,
          Body: contenido,
          ContentType: tipoMime,
          // Un año: las rutas incluyen un identificador único, así que el
          // contenido de una ruta dada nunca cambia.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return ruta;
    },

    async borrar(ruta) {
      await cliente.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: ruta }));
    },

    urlPublica(ruta) {
      const base = config.urlPublicaBase ?? `${config.endpoint}/${config.bucket}`;
      return `${base.replace(/\/+$/, '')}/${ruta}`;
    },
  };
}
