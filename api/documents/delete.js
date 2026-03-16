const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { createServiceClient } = require("../_lib/supabase");
const { DOCUMENTS_BY_ID } = require("../_lib/documents");

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

    const id = String(req.query.id || "");
    const documentDefinition = DOCUMENTS_BY_ID[id];
    if (!documentDefinition) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }

    const supabase = createServiceClient(config);
    const { error } = await supabase.storage
      .from(config.bucket)
      .remove([documentDefinition.filename]);

    if (error) {
      res.status(500).json({ error: `No se pudo borrar el PDF: ${error.message}` });
      return;
    }

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
