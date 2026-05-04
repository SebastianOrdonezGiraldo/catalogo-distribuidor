const path = require("path");

function readConfig() {
  const adminUsername = String(process.env.ADMIN_USERNAME || "admin").trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");
  const adminSessionSecret =
    String(process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "").trim();
  const storageDirInput = String(
    process.env.DOCUMENTS_DIR || path.join(process.cwd(), "storage", "documents"),
  ).trim();
  const storageDir = path.resolve(storageDirInput);

  return {
    adminUsername,
    adminPassword,
    adminSessionSecret,
    storageDir,
  };
}

function ensureConfig() {
  const config = readConfig();
  const missing = [];
  if (!config.adminPassword) missing.push("ADMIN_PASSWORD");
  if (!config.adminSessionSecret) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length > 0) {
    const error = new Error(
      `Faltan variables de entorno: ${missing.join(", ")}`,
    );
    error.statusCode = 500;
    throw error;
  }
  return config;
}

function ensureStorageConfig() {
  const config = readConfig();
  return config;
}

function ensureAuthConfig() {
  const config = readConfig();
  const missing = [];
  if (!config.adminPassword) missing.push("ADMIN_PASSWORD");
  if (!config.adminSessionSecret) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length > 0) {
    const error = new Error(
      `Faltan variables de entorno: ${missing.join(", ")}`,
    );
    error.statusCode = 500;
    throw error;
  }
  return config;
}

module.exports = {
  readConfig,
  ensureConfig,
  ensureStorageConfig,
  ensureAuthConfig,
};
