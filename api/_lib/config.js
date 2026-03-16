function readConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_BUCKET || "catalogos";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminSessionSecret =
    process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "";

  const missing = [];

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    bucket,
    adminUsername,
    adminPassword,
    adminSessionSecret,
    missing,
  };
}

function ensureConfig() {
  const config = readConfig();
  const missing = [];
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
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
  const missing = [];
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    const error = new Error(
      `Faltan variables de entorno: ${missing.join(", ")}`,
    );
    error.statusCode = 500;
    throw error;
  }
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
