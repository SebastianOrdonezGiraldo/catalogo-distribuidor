const { ensureConfig } = require("./_lib/config");
const { createServiceClient } = require("./_lib/supabase");
const { DOCUMENTS_BY_FILENAME } = require("./_lib/documents");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Metodo no permitido.");
    return;
  }

  try {
    const filename = String(req.query.filename || "");
    const documentDefinition = DOCUMENTS_BY_FILENAME[filename];
    if (!documentDefinition) {
      res.status(404).send("Documento no encontrado.");
      return;
    }

    const config = ensureConfig();
    const supabase = createServiceClient(config);

    const { data, error } = await supabase.storage
      .from(config.bucket)
      .createSignedUrl(documentDefinition.filename, 60);

    if (error || !data?.signedUrl) {
      res.status(404).send("Documento no disponible.");
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    res.writeHead(302, { Location: data.signedUrl });
    res.end();
  } catch (_error) {
    res.status(500).send("Error interno.");
  }
};
