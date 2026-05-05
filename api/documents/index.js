const { ensureConfig } = require("../_lib/config");
const { requireAuth } = require("../_lib/auth");
const { getDocumentsPayload } = require("../_lib/documentListPayload");

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

    const { documents } = await getDocumentsPayload(config.storageDir);

    res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Vary", "Cookie");

    res.status(200).json({
      storageDir: config.storageDir,
      documents,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
