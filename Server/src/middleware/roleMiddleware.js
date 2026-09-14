const prisma = require("../config/prisma");

const ROLE_LEVELS = {
  USER: 1,
  HR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

function isValidRole(role) {
  return Object.prototype.hasOwnProperty.call(ROLE_LEVELS, role);
}

function requireMinRole(minRole) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!isValidRole(minRole)) {
        return res.status(500).json({ success: false, message: "Invalid role policy" });
      }

      const actor = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, role: true, status: true },
      });

      if (!actor) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
      if (actor.status !== "ACTIVE") {
        return res.status(403).json({ success: false, message: "Account is not active" });
      }
      if (!isValidRole(actor.role)) {
        return res.status(403).json({ success: false, message: "Invalid role" });
      }

      if (ROLE_LEVELS[actor.role] < ROLE_LEVELS[minRole]) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }

      req.actor = actor;
      return next();
    } catch (err) {
      console.error("requireMinRole error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
}

module.exports = {
  ROLE_LEVELS,
  requireMinRole,
};
