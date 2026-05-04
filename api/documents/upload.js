const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { DOCUMENTS_BY_ID } = require("../_lib/documents");
const { ensureStorageDir, writeDocument } = require("../_lib/filesystem");
const { parseMultipartPdf } = require("../_lib/request");
const { getQueryParam } = require("../_lib/url");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const config = ensureConfig();
    if (!requireAuth(req, res, config)) {
      return;
    }

    const id = getQueryParam(req, "id");
    const documentDefinition = DOCUMENTS_BY_ID[id];
    if (!documentDefinition) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }

    const uploaded = await parseMultipartPdf(req);
    const isPdfByName = uploaded.fileName.toLowerCase().endsWith(".pdf");
    const isPdfByMime = uploaded.mimeType === "application/pdf";
    if (!isPdfByName && !isPdfByMime) {
      res.status(400).json({ error: "Solo se permiten archivos PDF." });
      return;
    }

    await ensureStorageDir(config.storageDir);
    await writeDocument(config.storageDir, documentDefinition.filename, uploaded.buffer);

    res.status(200).json({
      ok: true,
      id: documentDefinition.id,
      filename: documentDefinition.filename,
      url: `/docs/${encodeURIComponent(documentDefinition.filename)}`,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
