const IP_MAX = 64;

/**
 * Best-effort client IP from Express request (honors X-Forwarded-For when present).
 * @param {import("express").Request|null|undefined} req
 * @returns {string|null}
 */
function getClientIp(req) {
  if (!req) return null;
  const xf = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (xf) {
    const first = String(xf).split(",")[0].trim();
    if (first) return first.slice(0, IP_MAX);
  }
  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (socketIp) return String(socketIp).replace(/^::ffff:/, "").slice(0, IP_MAX);
  return null;
}

module.exports = { getClientIp };
