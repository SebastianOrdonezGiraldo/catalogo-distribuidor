function getQueryParam(req, name) {
  if (req && req.query && typeof req.query === "object") {
    const raw = req.query[name];
    if (Array.isArray(raw)) {
      return String(raw[0] || "");
    }
    return String(raw || "");
  }

  try {
    const parsed = new URL(req.url || "", "http://localhost");
    return String(parsed.searchParams.get(name) || "");
  } catch (_error) {
    return "";
  }
}

module.exports = {
  getQueryParam,
};
