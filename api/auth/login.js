const { ensureConfig } = require("../_lib/config");
const { createSessionToken, setSessionCookie } = require("../_lib/auth");
const { parseJsonBody } = require("../_lib/request");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const config = ensureConfig();
    const body = await parseJsonBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (
      username !== config.adminUsername ||
      password !== config.adminPassword
    ) {
      res.status(401).json({ error: "Credenciales invalidas." });
      return;
    }

    const token = createSessionToken(
      config.adminUsername,
      config.adminSessionSecret,
    );
    setSessionCookie(res, token);
    res.status(200).json({ ok: true, username: config.adminUsername });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Error interno." });
  }
};
