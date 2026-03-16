const { ensureAuthConfig } = require("../_lib/config");
const { hasValidSession } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const config = ensureAuthConfig();
    const authenticated = hasValidSession(req, config);
    res.status(200).json({
      authenticated,
      username: authenticated ? config.adminUsername : null,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
