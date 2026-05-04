const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { DOCUMENTS_BY_ID } = require("../_lib/documents");
const { deleteDocument, ensureStorageDir } = require("../_lib/filesystem");
const { getQueryParam } = require("../_lib/url");

module.exports = async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
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

    await ensureStorageDir(config.storageDir);
    await deleteDocument(config.storageDir, documentDefinition.filename);

    res.status(200).json({
      ok: true,
      id: documentDefinition.id,
      filename: documentDefinition.filename,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
