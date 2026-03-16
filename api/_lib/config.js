function readConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_BUCKET || "catalogos";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminSessionSecret =
    process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "";

  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!adminPassword) missing.push("ADMIN_PASSWORD");
  if (!adminSessionSecret) missing.push("ADMIN_SESSION_SECRET");

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
  if (config.missing.length > 0) {
    const error = new Error(
      `Faltan variables de entorno: ${config.missing.join(", ")}`,
    );
    error.statusCode = 500;
    throw error;
  }
  return config;
}

module.exports = {
  readConfig,
  ensureConfig,
};
