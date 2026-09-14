const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwtConfig");

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")?.[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName || null,
      role: decoded.role || null,
      company: decoded.company || null,
      position: decoded.position || null,
      startDate: decoded.startDate || null,
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

module.exports = { authMiddleware };
