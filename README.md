# Catalogo Distribuidor (Vercel + Supabase)

Sitio estatico con panel administrador en `/admin` para reemplazar y borrar PDFs.
Los documentos se guardan en **Supabase Storage** y se sirven por `/docs/:filename`.

## Stack

- Hosting y funciones API: Vercel (`/api/*`)
- Almacenamiento de PDFs: Supabase Storage
- Autenticacion admin: cookie de sesion HTTP-only (usuario/contrasena por variables de entorno)

## Variables de entorno

Define estas variables en Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET` (default recomendado: `catalogos`)
- `ADMIN_USERNAME` (default local: `admin`)
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Referencia local: `.env.example`.

## Configuracion en Supabase

1. Crear bucket en Storage (ejemplo: `catalogos`).
2. Puedes dejar el bucket **privado**. La ruta `/docs/:filename` entrega el PDF desde backend.
3. Guardar en Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (no usar publishable key para escritura/borrado desde API)

## Configuracion en Vercel

1. Importar el repositorio en Vercel.
2. Runtime Node.js (default).
3. Agregar las variables de entorno del bloque anterior.
4. Deploy.

## Rutas

- `/`: pagina publica
- `/admin`: panel administrador
- `/api/auth/login`: login admin
- `/api/auth/logout`: logout admin
- `/api/auth/session`: valida sesion
- `/api/documents`: lista documentos
- `/api/documents/upload-url?id=<document-id>`: genera URL firmada para subir PDF directo a Supabase
- `/api/documents/delete?id=<document-id>`: borra PDF
- `/docs/:filename`: entrega estable del PDF sin URL temporal visible

## Desarrollo local

```bash
npm install
npx vercel dev
```

## Importante

- La `SUPABASE_SERVICE_ROLE_KEY` es secreta: solo backend (variables de entorno), nunca frontend.
- Si ya publicaste una clave por error, rota la clave en Supabase.
