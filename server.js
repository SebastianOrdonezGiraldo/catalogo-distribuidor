require("dotenv").config();

const express = require("express");
const path = require("path");

const authLoginHandler = require("./api/auth/login");
const authLogoutHandler = require("./api/auth/logout");
const authSessionHandler = require("./api/auth/session");
const { ensureStorageConfig } = require("./api/_lib/config");
const { DOCUMENTS } = require("./api/_lib/documents");
const { ensureStorageDir, seedBundledDocumentsOnce } = require("./api/_lib/filesystem");
const documentsDeleteHandler = require("./api/documents/delete");
const documentsIndexHandler = require("./api/documents/index");
const documentsUploadHandler = require("./api/documents/upload");
const docsHandler = require("./api/docs");

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = __dirname;

app.use((req, _res, next) => {
  req.url = req.originalUrl || req.url;
  next();
});

app.use("/api/auth/login", express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(rootDir, "admin", "index.html"));
});

app.get("/docs/:filename", (req, res) => {
  req.query = {
    ...req.query,
    filename: req.params.filename,
  };
  docsHandler(req, res);
});

app.post("/api/auth/login", authLoginHandler);
app.post("/api/auth/logout", authLogoutHandler);
app.get("/api/auth/session", authSessionHandler);

app.get("/api/documents", documentsIndexHandler);
app.post("/api/documents/upload", documentsUploadHandler);
app.delete("/api/documents/delete", documentsDeleteHandler);

app.use("/admin", express.static(path.join(rootDir, "admin")));
app.use(express.static(rootDir));

async function prepareStorageOnce() {
  try {
    const config = ensureStorageConfig();
    await ensureStorageDir(config.storageDir);
    await seedBundledDocumentsOnce(
      config.storageDir,
      process.cwd(),
      DOCUMENTS.map((document) => document.filename),
    );
  } catch (error) {
    console.error(`No se pudo inicializar DOCUMENTS_DIR: ${error.message}`);
  }
}

prepareStorageOnce().finally(() => {
  app.listen(port, () => {
    console.log(`Catalogo disponible en http://localhost:${port}`);
  });
});
