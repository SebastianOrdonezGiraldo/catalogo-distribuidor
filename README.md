# Catalogo Distribuidor (Node.js + almacenamiento local)

Sitio estatico con panel administrador en `/admin` para reemplazar y borrar PDFs.
Los documentos se guardan en el disco del servidor y se sirven por `/docs/:filename`.

## Stack

- Servidor web y API: Node.js + Express
- Almacenamiento de PDFs: filesystem local del VPS
- Autenticacion admin: cookie de sesion HTTP-only

## Variables de entorno

Define estas variables en tu VPS:

- `PORT` (opcional, default: `3000`)
- `DOCUMENTS_DIR` (opcional, default: `./storage/documents`)
- `ADMIN_USERNAME` (default local: `admin`)
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Referencia local: `.env.example`.

## Rutas

- `/`: pagina publica
- `/admin`: panel administrador
- `/api/auth/login`: login admin
- `/api/auth/logout`: logout admin
- `/api/auth/session`: valida sesion
- `/api/documents`: lista documentos
- `/api/documents/upload?id=<document-id>`: reemplaza o crea un PDF
- `/api/documents/delete?id=<document-id>`: borra PDF
- `/docs/:filename`: entrega el PDF publicado

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en VPS

1. Instala dependencias con `npm install`.
2. Define las variables de entorno.
3. Crea un directorio persistente para `DOCUMENTS_DIR`.
4. Levanta la app con `npm start`.
5. Publica el puerto con Nginx, Caddy o tu reverse proxy.

En el primer arranque, la app copia automaticamente a `DOCUMENTS_DIR` cualquier PDF base que ya exista en la raiz del proyecto.

## Importante

- Los PDFs quedan en el disco del servidor. Si recreas el contenedor o la maquina sin volumen persistente, se pierden.
- `DOCUMENTS_DIR` debe apuntar a una ruta con permisos de lectura y escritura para el proceso Node.
