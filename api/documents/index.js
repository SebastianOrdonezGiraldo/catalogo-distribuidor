const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { createServiceClient } = require("../_lib/supabase");
const { DOCUMENTS } = require("../_lib/documents");
const { ensureBucketExists } = require("../_lib/storage");

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

    const supabase = createServiceClient(config);
    const bucketCheck = await ensureBucketExists(supabase, config.bucket);
    if (!bucketCheck.ok) {
      res.status(500).json({
        error: `No se pudo acceder al bucket '${config.bucket}': ${bucketCheck.error.message}`,
      });
      return;
    }

    const { data: files, error } = await supabase.storage
      .from(config.bucket)
      .list("", { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });

    if (error) {
      res.status(500).json({ error: `Error leyendo bucket: ${error.message}` });
      return;
    }

    const filesByName = Object.fromEntries((files || []).map((file) => [file.name, file]));

    const documents = DOCUMENTS.map((doc) => {
      const storageItem = filesByName[doc.filename] || null;

      return {
        ...doc,
        url: `/docs/${encodeURIComponent(doc.filename)}`,
        exists: Boolean(storageItem),
        size: storageItem?.metadata?.size || 0,
        updatedAt: storageItem?.updated_at || null,
      };
    });

    res.status(200).json({
      bucket: config.bucket,
      documents,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
