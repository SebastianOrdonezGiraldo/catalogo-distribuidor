const crypto = require("crypto");

const COOKIE_NAME = "catalog_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function isSecureCookie() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionToken(username, secret) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${username}|${issuedAt}`;
  const encodedPayload = toBase64Url(payload);
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const parsed = {};
  for (const pair of raw.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    parsed[key] = decodeURIComponent(value);
  }
  return parsed;
}

function verifySessionToken(token, expectedUsername, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (signature !== expectedSignature) {
    return false;
  }

  let username = "";
  let issuedAt = 0;
  try {
    const payload = fromBase64Url(encodedPayload);
    const [tokenUsername, tokenIssuedAt] = payload.split("|");
    username = tokenUsername;
    issuedAt = Number(tokenIssuedAt);
  } catch (_error) {
    return false;
  }

  if (!username || Number.isNaN(issuedAt) || username !== expectedUsername) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > SESSION_TTL_SECONDS) {
    return false;
  }

  return true;
}

function buildCookie(value, maxAgeSeconds) {
  const securePart = isSecureCookie() ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${securePart}`;
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", buildCookie(token, SESSION_TTL_SECONDS));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", buildCookie("", 0));
}

function hasValidSession(req, config) {
  const cookies = parseCookies(req);
  return verifySessionToken(
    cookies[COOKIE_NAME],
    config.adminUsername,
    config.adminSessionSecret,
  );
}

function requireAuth(req, res, config) {
  if (hasValidSession(req, config)) {
    return true;
  }
  res.status(401).json({ error: "No autorizado." });
  return false;
}

module.exports = {
  createSessionToken,
  hasValidSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
};
