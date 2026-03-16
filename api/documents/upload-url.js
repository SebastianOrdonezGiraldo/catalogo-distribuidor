const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { createServiceClient } = require("../_lib/supabase");
const { DOCUMENTS_BY_ID } = require("../_lib/documents");
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

    const supabase = createServiceClient(config);
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .createSignedUploadUrl(documentDefinition.filename, {
        upsert: true,
      });

    if (error || !data?.signedUrl) {
      res.status(500).json({
        error: `No se pudo generar URL de subida: ${error?.message || "Error desconocido."}`,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      id: documentDefinition.id,
      filename: documentDefinition.filename,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
