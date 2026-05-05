const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { DOCUMENTS } = require("../_lib/documents");
const { ensureStorageDir, getDocumentInfo } = require("../_lib/filesystem");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const config = ensureConfig();
    if (!requireAuth(req, res, config)) {
      return;
    }

    await ensureStorageDir(config.storageDir);

    const documents = await Promise.all(
      DOCUMENTS.map(async (doc) => {
        const storageItem = await getDocumentInfo(config.storageDir, doc.filename);

        return {
          ...doc,
          url: `/docs/${encodeURIComponent(doc.filename)}`,
          exists: storageItem.exists,
          size: storageItem.size,
          updatedAt: storageItem.updatedAt,
        };
      }),
    );

    res.status(200).json({
      storageDir: config.storageDir,
      documents,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
