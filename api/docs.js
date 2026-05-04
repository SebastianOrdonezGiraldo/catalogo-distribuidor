const { ensureStorageConfig } = require("./_lib/config");
const { DOCUMENTS, DOCUMENTS_BY_FILENAME } = require("./_lib/documents");
const { readDocument, seedDocuments } = require("./_lib/filesystem");
const { getQueryParam } = require("./_lib/url");

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
    await seedDocuments(
      config.storageDir,
      process.cwd(),
      DOCUMENTS.map((document) => document.filename),
    );
    let fileBuffer;
    try {
      fileBuffer = await readDocument(config.storageDir, documentDefinition.filename);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        res.status(404).send("Documento no disponible.");
        return;
      }
      res.status(500).send(error.message || "Error al descargar documento.");
      return;
    }

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
