const { ensureStorageConfig } = require("./_lib/config");
const { createServiceClient } = require("./_lib/supabase");
const { DOCUMENTS_BY_FILENAME } = require("./_lib/documents");
const { getQueryParam } = require("./_lib/url");
const { ensureBucketExists } = require("./_lib/storage");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Metodo no permitido.");
    return;
  }

  try {
    const filename = getQueryParam(req, "filename");
    const documentDefinition = DOCUMENTS_BY_FILENAME[filename];
    if (!documentDefinition) {
      res.status(404).send("Documento no encontrado.");
      return;
    }

    const config = ensureStorageConfig();
    const supabase = createServiceClient(config);
    const bucketCheck = await ensureBucketExists(supabase, config.bucket);
    if (!bucketCheck.ok) {
      res.status(500).send(
        `No se pudo acceder al bucket '${config.bucket}': ${bucketCheck.error.message}`,
      );
      return;
    }

    const { data, error } = await supabase.storage
      .from(config.bucket)
      .download(documentDefinition.filename);

    if (error || !data) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("not found") || message.includes("does not exist")) {
        res.status(404).send("Documento no disponible.");
        return;
      }
      res.status(500).send(error?.message || "Error al descargar documento.");
      return;
    }

    const arrayBuffer = await data.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${documentDefinition.filename}"`,
    );
    res.setHeader("Content-Length", String(fileBuffer.length));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).send(fileBuffer);
  } catch (error) {
    if (error && error.statusCode) {
      res.status(error.statusCode).send(error.message);
      return;
    }
    res.status(500).send("Error interno.");
  }
};
