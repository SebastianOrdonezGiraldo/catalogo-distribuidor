const express = require("express");
const session = require("express-session");
const createMemoryStore = require("memorystore");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const PDF_STORAGE_DIR = process.env.PDF_STORAGE_DIR || "";
const STORAGE_DIR = PDF_STORAGE_DIR ? path.resolve(PDF_STORAGE_DIR) : ROOT_DIR;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

if (IS_PRODUCTION && !ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD es obligatorio en produccion.");
}

if (IS_PRODUCTION && !SESSION_SECRET) {
  throw new Error("SESSION_SECRET es obligatorio en produccion.");
}

if (IS_PRODUCTION && !PDF_STORAGE_DIR) {
  throw new Error(
    "PDF_STORAGE_DIR es obligatorio en produccion para persistencia de documentos.",
  );
}

if (!IS_PRODUCTION && !ADMIN_PASSWORD) {
  // Solo para entorno local de desarrollo.
  console.warn(
    "[WARN] ADMIN_PASSWORD no esta definido. En local se usara 'admin123'.",
  );
}

const EFFECTIVE_PASSWORD = ADMIN_PASSWORD || "admin123";
const EFFECTIVE_SESSION_SECRET = SESSION_SECRET || "dev-session-secret";
const MemoryStore = createMemoryStore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 24 * 60 * 60 * 1000,
});

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const DOCUMENTS = [
  {
    id: "catalogo-distribuidor",
    label: "Catalogo Distribuidor",
    filename: "catalogo-distribuidor.pdf",
  },
  {
    id: "catalogo-cliente-final",
    label: "Catalogo Cliente Final",
    filename: "catalogo-cliente-final.pdf",
  },
  {
    id: "catalogo-regimen-simplificado",
    label: "Catalogo Regimen Simplificado",
    filename: "catalogo-regimen-simplificado.pdf",
  },
  {
    id: "catalogo-sin-precios",
    label: "Catalogo Sin Precios",
    filename: "catalogo-sin-precios.pdf",
  },
  {
    id: "catalogo-sin-precios-regimen-simplificado",
    label: "Catalogo Sin Precios Regimen Simplificado",
    filename: "catalogo-sin-precios-regimen-simplificado.pdf",
  },
];

const DOCUMENTS_BY_ID = Object.fromEntries(
  DOCUMENTS.map((doc) => [doc.id, doc]),
);
const DOCUMENTS_BY_FILENAME = Object.fromEntries(
  DOCUMENTS.map((doc) => [doc.filename, doc]),
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    name: "catalog_admin_session",
    secret: EFFECTIVE_SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const byMime = file.mimetype === "application/pdf";
    const byName = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (!byMime && !byName) {
      cb(new Error("Solo se permiten archivos PDF."));
      return;
    }
    cb(null, true);
  },
});

function getDocumentPath(doc) {
  return path.join(STORAGE_DIR, doc.filename);
}

function seedDocumentsIntoStorage() {
  if (STORAGE_DIR === ROOT_DIR) {
    return;
  }

  for (const doc of DOCUMENTS) {
    const targetPath = getDocumentPath(doc);
    if (fs.existsSync(targetPath)) {
      continue;
    }
    const repoPath = path.join(ROOT_DIR, doc.filename);
    if (!fs.existsSync(repoPath)) {
      continue;
    }
    fs.copyFileSync(repoPath, targetPath);
    console.log(`[SEED] ${doc.filename} copiado al almacenamiento persistente.`);
  }
}

seedDocumentsIntoStorage();

function getDocumentMeta(doc) {
  const absolutePath = getDocumentPath(doc);
  try {
    const stat = fs.statSync(absolutePath);
    return {
      ...doc,
      url: `/docs/${encodeURIComponent(doc.filename)}`,
      exists: stat.isFile(),
      size: stat.isFile() ? stat.size : 0,
      updatedAt: stat.isFile() ? stat.mtime.toISOString() : null,
    };
  } catch (_error) {
    return {
      ...doc,
      url: `/docs/${encodeURIComponent(doc.filename)}`,
      exists: false,
      size: 0,
      updatedAt: null,
    };
  }
}

function isAuthenticated(req) {
  return Boolean(req.session && req.session.authenticated === true);
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  res.redirect("/admin?error=auth");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLoginPage(errorCode) {
  let errorText = "";
  if (errorCode === "auth") {
    errorText = "Debes iniciar sesion para entrar al panel.";
  } else if (errorCode === "invalid") {
    errorText = "Usuario o contrasena incorrectos.";
  }

  const errorBanner = errorText
    ? `<div class="alert">${escapeHtml(errorText)}</div>`
    : "";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Catalogos</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #0f172a, #1e3a8a);
        padding: 20px;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 24px;
      }
      p {
        margin: 0 0 20px;
        color: #334155;
      }
      .alert {
        background: #ffe4e6;
        color: #9f1239;
        border: 1px solid #fecdd3;
        border-radius: 10px;
        padding: 10px 12px;
        margin-bottom: 16px;
        font-size: 14px;
      }
      label {
        display: block;
        font-size: 14px;
        margin-bottom: 6px;
        color: #0f172a;
      }
      input {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 11px 12px;
        margin-bottom: 14px;
        font-size: 14px;
      }
      button {
        width: 100%;
        border: none;
        border-radius: 10px;
        padding: 12px;
        color: #fff;
        background: #2563eb;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover { background: #1d4ed8; }
      small {
        display: block;
        margin-top: 12px;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Panel Administrador</h1>
      <p>Ingresa para administrar los archivos PDF.</p>
      ${errorBanner}
      <form method="post" action="/admin/login">
        <label for="username">Usuario</label>
        <input id="username" name="username" autocomplete="username" required />
        <label for="password">Contrasena</label>
        <input id="password" type="password" name="password" autocomplete="current-password" required />
        <button type="submit">Ingresar</button>
      </form>
      <small>Configura ADMIN_USERNAME y ADMIN_PASSWORD en Render.</small>
    </main>
  </body>
</html>`;
}

function renderDashboardPage(username) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Catalogos</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: #f1f5f9;
        color: #0f172a;
      }
      .wrap {
        max-width: 1100px;
        margin: 28px auto;
        padding: 0 16px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0;
        font-size: 28px;
      }
      .user {
        color: #334155;
        font-size: 14px;
      }
      .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
      }
      .toolbar {
        padding: 14px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .status {
        font-size: 14px;
        color: #334155;
      }
      .status.ok { color: #166534; }
      .status.err { color: #b91c1c; }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border-bottom: 1px solid #e2e8f0;
        padding: 12px;
        text-align: left;
        vertical-align: top;
        font-size: 14px;
      }
      th {
        background: #f8fafc;
        font-size: 13px;
        color: #475569;
      }
      tr:last-child td { border-bottom: none; }
      .pill {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .pill.ok {
        background: #dcfce7;
        color: #166534;
      }
      .pill.err {
        background: #fee2e2;
        color: #991b1b;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .btn, .file-input {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 10px;
        background: #fff;
        font-size: 13px;
      }
      .btn {
        cursor: pointer;
      }
      .btn.primary {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .btn.danger {
        background: #ef4444;
        color: #fff;
        border-color: #ef4444;
      }
      .btn.ghost {
        background: #fff;
      }
      .btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .logout {
        display: inline-block;
      }
      .logout button {
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .hint {
        margin-top: 12px;
        font-size: 13px;
        color: #475569;
      }
      @media (max-width: 800px) {
        th, td { font-size: 12px; padding: 10px; }
        .top { flex-direction: column; align-items: flex-start; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="top">
        <div>
          <h1>Administracion de PDFs</h1>
          <div class="user">Sesion activa: ${escapeHtml(username)}</div>
        </div>
        <form class="logout" method="post" action="/admin/logout">
          <button type="submit">Cerrar sesion</button>
        </form>
      </div>

      <section class="card">
        <div class="toolbar">
          <div class="status" id="status">Cargando documentos...</div>
          <button class="btn ghost" id="refresh-button" type="button">Actualizar lista</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Ultima actualizacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="documents-body"></tbody>
        </table>
      </section>

      <p class="hint">
        Al reemplazar un archivo se mantiene el mismo nombre publico. El boton del home usa
        <code>/docs/catalogo-distribuidor.pdf</code>.
      </p>
    </div>

    <script>
      const body = document.getElementById("documents-body");
      const status = document.getElementById("status");
      const refreshButton = document.getElementById("refresh-button");

      function formatBytes(size) {
        if (!size) return "-";
        const kb = size / 1024;
        if (kb < 1024) return kb.toFixed(1) + " KB";
        return (kb / 1024).toFixed(2) + " MB";
      }

      function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        return date.toLocaleString("es-CO");
      }

      async function apiRequest(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "No fue posible completar la accion.");
        }
        return data;
      }

      function setStatus(text, variant) {
        status.textContent = text;
        status.classList.remove("ok", "err");
        if (variant) status.classList.add(variant);
      }

      function attachRowHandlers() {
        const uploadForms = document.querySelectorAll("form[data-upload-id]");
        for (const form of uploadForms) {
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const id = form.dataset.uploadId;
            const fileInput = form.querySelector("input[type=file]");
            if (!fileInput.files.length) {
              setStatus("Selecciona un PDF antes de subirlo.", "err");
              return;
            }
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("pdf", file);
            try {
              setStatus("Subiendo " + file.name + "...", "");
              await apiRequest("/admin/api/documents/" + encodeURIComponent(id) + "/upload", {
                method: "POST",
                body: formData
              });
              setStatus("PDF actualizado correctamente.", "ok");
              await loadDocuments();
            } catch (error) {
              setStatus(error.message, "err");
            }
          });
        }

        const deleteButtons = document.querySelectorAll("button[data-delete-id]");
        for (const button of deleteButtons) {
          button.addEventListener("click", async () => {
            const id = button.dataset.deleteId;
            const docLabel = button.dataset.docLabel;
            if (!confirm("Se borrara " + docLabel + ". Deseas continuar?")) {
              return;
            }
            try {
              setStatus("Borrando documento...", "");
              await apiRequest("/admin/api/documents/" + encodeURIComponent(id), {
                method: "DELETE"
              });
              setStatus("Documento borrado correctamente.", "ok");
              await loadDocuments();
            } catch (error) {
              setStatus(error.message, "err");
            }
          });
        }
      }

      function renderRows(documents) {
        if (!documents.length) {
          body.innerHTML = "<tr><td colspan='5'>No hay documentos configurados.</td></tr>";
          return;
        }
        body.innerHTML = documents.map((doc) => {
          const state = doc.exists
            ? "<span class='pill ok'>Disponible</span>"
            : "<span class='pill err'>No disponible</span>";
          const viewButton = doc.exists
            ? "<a class='btn ghost' href='" + doc.url + "' target='_blank' rel='noopener noreferrer'>Ver PDF</a>"
            : "<button class='btn ghost' type='button' disabled>Ver PDF</button>";
          const deleteDisabled = doc.exists ? "" : "disabled";
          return "<tr>" +
            "<td>" + doc.label + "</td>" +
            "<td><strong>" + doc.filename + "</strong><br /><small>" + formatBytes(doc.size) + "</small></td>" +
            "<td>" + state + "</td>" +
            "<td>" + formatDate(doc.updatedAt) + "</td>" +
            "<td>" +
              "<div class='actions'>" +
                "<form data-upload-id='" + doc.id + "'>" +
                  "<input class='file-input' type='file' accept='.pdf,application/pdf' required /> " +
                  "<button class='btn primary' type='submit'>Reemplazar</button>" +
                "</form>" +
                viewButton +
                "<button class='btn danger' type='button' data-delete-id='" + doc.id + "' data-doc-label='" + doc.label + "' " + deleteDisabled + ">Borrar</button>" +
              "</div>" +
            "</td>" +
          "</tr>";
        }).join("");
        attachRowHandlers();
      }

      async function loadDocuments() {
        try {
          const data = await apiRequest("/admin/api/documents");
          renderRows(data.documents || []);
          setStatus("Documentos cargados.", "ok");
        } catch (error) {
          setStatus(error.message, "err");
        }
      }

      refreshButton.addEventListener("click", () => {
        loadDocuments();
      });

      loadDocuments();
    </script>
  </body>
</html>`;
}

app.get("/admin", (req, res) => {
  if (isAuthenticated(req)) {
    res.redirect("/admin/dashboard");
    return;
  }
  const errorCode = typeof req.query.error === "string" ? req.query.error : "";
  res.status(200).send(renderLoginPage(errorCode));
});

app.post("/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (username === ADMIN_USERNAME && password === EFFECTIVE_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    res.redirect("/admin/dashboard");
    return;
  }

  res.redirect("/admin?error=invalid");
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

app.get("/admin/dashboard", requireAuth, (req, res) => {
  const username = req.session.username || ADMIN_USERNAME;
  res.status(200).send(renderDashboardPage(username));
});

app.get("/admin/api/documents", requireAuth, (_req, res) => {
  res.json({
    documents: DOCUMENTS.map(getDocumentMeta),
  });
});

app.post("/admin/api/documents/:id/upload", requireAuth, (req, res) => {
  const definition = DOCUMENTS_BY_ID[req.params.id];
  if (!definition) {
    res.status(404).json({ error: "Documento no encontrado." });
    return;
  }

  upload.single("pdf")(req, res, async (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El PDF supera el limite de 25 MB."
          : error.message || "No se pudo subir el archivo.";
      res.status(400).json({ error: message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Debes seleccionar un archivo PDF." });
      return;
    }

    const destination = getDocumentPath(definition);
    try {
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.writeFile(destination, req.file.buffer);
      res.json({
        ok: true,
        document: getDocumentMeta(definition),
      });
    } catch (_writeError) {
      res.status(500).json({ error: "No se pudo guardar el PDF." });
    }
  });
});

app.delete("/admin/api/documents/:id", requireAuth, async (req, res) => {
  const definition = DOCUMENTS_BY_ID[req.params.id];
  if (!definition) {
    res.status(404).json({ error: "Documento no encontrado." });
    return;
  }

  const targetPath = getDocumentPath(definition);
  try {
    await fs.promises.unlink(targetPath);
    res.json({
      ok: true,
      document: getDocumentMeta(definition),
    });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      res.status(400).json({ error: "El archivo no existe para borrar." });
      return;
    }
    res.status(500).json({ error: "No se pudo borrar el archivo." });
  }
});

app.get("/docs/:filename", (req, res) => {
  const filename = path.basename(String(req.params.filename || ""));
  const definition = DOCUMENTS_BY_FILENAME[filename];
  if (!definition) {
    res.status(404).send("Documento no encontrado.");
    return;
  }

  const absolutePath = getDocumentPath(definition);
  res.sendFile(absolutePath, (error) => {
    if (!error) {
      return;
    }
    if (error.code === "ENOENT") {
      res.status(404).send("Documento no disponible.");
      return;
    }
    res.status(500).send("Error al abrir documento.");
  });
});

app.use(express.static(ROOT_DIR, { index: false }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.use((_req, res) => {
  res.status(404).send("Not found.");
});

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
  console.log(`Directorio de documentos: ${STORAGE_DIR}`);
});
