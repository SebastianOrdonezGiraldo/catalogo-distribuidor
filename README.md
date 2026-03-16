# Catalogo Distribuidor

Proyecto estatico con panel administrador en `/admin` para reemplazar y borrar PDFs.

## Requisitos

- Node.js 20 o superior

## Variables de entorno

- `ADMIN_USERNAME`: usuario del panel administrador (default: `admin`)
- `ADMIN_PASSWORD`: contrasena del panel (obligatoria en produccion)
- `SESSION_SECRET`: secreto para cookies de sesion (obligatorio en produccion)
- `PDF_STORAGE_DIR`: directorio donde se guardan los PDFs (obligatorio en produccion)

En Render, para que los cambios en PDFs persistan entre reinicios/deploys, monta un disco persistente y usa su ruta en `PDF_STORAGE_DIR` (ejemplo: `/var/data/catalogos`).
En produccion el servidor exige `PDF_STORAGE_DIR`; si no existe, no inicia.

## Desarrollo local

```bash
npm install
npm run dev
```

## Produccion

```bash
npm install
npm start
```

## Configuracion en Render (persistencia real)

1. Crea un `Web Service` desde este repositorio.
2. En `Disks`, agrega un `Persistent Disk` y define un `Mount Path` (ejemplo: `/var/data/catalogos`).
3. En `Environment`, define:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `PDF_STORAGE_DIR` con el mismo `Mount Path` del disco.
4. Usa `npm start` como Start Command.
5. Haz deploy. En el primer arranque, los PDFs iniciales del repo se copian al disco persistente.

## Rutas clave

- `/`: sitio publico
- `/admin`: login de administrador
- `/admin/dashboard`: panel de gestion de PDFs
- `/docs/:filename`: entrega publica de PDF administrado
