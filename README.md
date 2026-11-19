# 3π Ori — Electronic Music Sessions

Sitio público y panel privado para administrar las sesiones, portadas y datos del artista.

## Stack

- Next.js 14, React y TypeScript
- Supabase Auth y Postgres con Row Level Security
- Supabase Storage para portadas y fotografía
- Cloudflare R2 para archivos MP3
- Vercel

## Desarrollo local

1. Instala Node.js 20 o posterior.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` y completa las variables.
4. Ejecuta `npm run dev` y abre `http://localhost:3000`.

El sitio público conserva una sesión de demostración si Supabase no está configurado. El panel requiere las variables de Supabase y R2.

## Supabase y acceso administrativo

1. Ejecuta `supabase-schema.sql` en el SQL Editor del proyecto. El script crea las tablas, activa RLS, configura las políticas y crea el bucket público `covers`.
2. En **Authentication → Providers**, habilita Email y contraseña.
3. Crea la cuenta administradora desde **Authentication → Users** (no hay registro público).
4. Autoriza el correo de esa cuenta ejecutando en SQL Editor:

   ```sql
   insert into public.site_admins (email) values ('tu-correo@ejemplo.com');
   ```

5. Inicia sesión en `https://3piori.com/admin`.

Las políticas verifican la cuenta autenticada en el servidor de base de datos. El cliente sólo usa la clave anon/publishable; nunca configures una `service_role` en el navegador.

## Archivos de audio en Cloudflare R2

1. Crea un bucket privado de almacenamiento llamado, por ejemplo, `3piori-audio`, y asígnale un dominio público para la entrega de audio (por ejemplo, `audio.3piori.com`).
2. Crea un token S3 de R2 con permisos de lectura y escritura limitado a ese bucket.
3. Configura las variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` y `NEXT_PUBLIC_AUDIO_BASE_URL`.
4. Configura CORS en el bucket para permitir `PUT` desde el dominio del sitio (y `localhost:3000` durante el desarrollo). Para la reproducción habilita `GET`/`HEAD`, solicitudes con `Range` y expón `Content-Range`, `Accept-Ranges` y `Content-Length`.

El panel firma las URLs de subida durante 10 minutos en el servidor y sube el MP3 directamente a R2. Las credenciales S3 nunca salen al navegador. Al eliminar o reemplazar una sesión, el panel elimina el archivo anterior de R2.

## Administración

- **Sesiones:** subir/reemplazar/quitar MP3, editar título, descripción, género, fecha, duración y portada; destacar, publicar u ocultar y eliminar sets.
- **Portadas:** carga directa a Supabase Storage, vista previa antes de guardar y asociación a cada sesión.
- **Información general:** edición de biografía, fotografía principal, email y enlaces a Instagram, SoundCloud y Mixcloud.

La portada y fotografía se publican desde el bucket `covers`. La portada de demostración permanece disponible localmente como alternativa.

## Despliegue en Vercel

Importa el proyecto y configura en Vercel las variables de `.env.example`, con valores reales para Supabase y Cloudflare R2. No subas `.env.local` ni credenciales al repositorio. Después de agregar el administrador en Supabase, el panel queda disponible en `/admin`.

Antes del lanzamiento reemplaza los datos de demostración, comprueba los permisos de publicación y confirma que tienes los derechos necesarios sobre cada grabación y la música incluida.
