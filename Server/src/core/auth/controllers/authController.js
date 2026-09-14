const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../../../config/prisma");
const {
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_DAYS,
} = require("../../../config/jwtConfig");
const {
  frontendSuccessURL,
  frontendLoginURL,
} = require("../../../config/googleOAuth");
const { recordLoginAttempt } = require("../../login-attempts/services/loginAttemptService");
const { getClientIp } = require("../../../utils/clientIp");

function issueAccessToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    displayName: user.displayName || null,
    googleName: user.googleName || null,
    role: user.role || null,
    company: user.company || null,
    position: user.position || null,
  }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
}

async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(64).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
  return raw;
}

function redirectError(res, errorCode) {
  const url = `${frontendLoginURL}?error=${encodeURIComponent(errorCode)}`;
  return res.redirect(url);
}

function normalizeReturnTo(rawReturnTo) {
  if (typeof rawReturnTo !== "string") return null;
  const value = rawReturnTo.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login")) return null;
  return value;
}

async function authGoogleCallback(req, res) {
  try {
    if (!req.user) return redirectError(res, "unauthorized_user");

    const accessToken = issueAccessToken(req.user);
    const refreshToken = await createRefreshToken(req.user.id);
    const returnTo = normalizeReturnTo(req.authReturnTo);
    const hashParams = new URLSearchParams({ accessToken, refreshToken });
    if (returnTo) hashParams.set("returnTo", returnTo);
    const hash = hashParams.toString();
    await recordLoginAttempt({
      email: req.user.email,
      userId: req.user.id,
      status: "SUCCESS",
      failureReason: null,
      ipAddress: getClientIp(req),
    });
    return res.redirect(`${frontendSuccessURL}#${hash}`);
  } catch (err) {
    console.error("authGoogleCallback error:", err);
    if (req.user?.email) {
      await recordLoginAttempt({
        email: req.user.email,
        userId: req.user.id,
        status: "FAILURE",
        failureReason: "server_error",
        ipAddress: getClientIp(req),
      });
    }
    return redirectError(res, "server_error");
  }
}

async function getCurrentUser(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        nickName: true,
        googleName: true,
        avatarUrl: true,
        position: true,
        telephone: true,
        role: true,
        company: true,
        status: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function refreshTokenHandler(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ success: false, message: "refreshToken is required" });
    }

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Atomic rotation ใน transaction เดียว — ป้องกัน race condition จาก concurrent refresh
    const result = await prisma.$transaction(async (tx) => {
      // 1. revoke token เก่าแบบ atomic — ใช้ updateMany เพื่อให้ where ตรวจ revokedAt+expiresAt ได้
      //    ถ้าอีก request เข้ามาพร้อมกันด้วย hash เดียวกัน จะมีแค่อันเดียวที่ count > 0
      const revoked = await tx.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 0) {
        throw Object.assign(
          new Error("Invalid or expired refresh token"),
          { statusCode: 401 }
        );
      }

      // 2. โหลด record เพื่อเอา userId
      const record = await tx.refreshToken.findUnique({ where: { tokenHash } });

      // 3. โหลด user + ตรวจ status
      const user = await tx.user.findUnique({
        where: { id: record.userId },
        select: {
          id: true, email: true, displayName: true, googleName: true,
          role: true, company: true, position: true, status: true,
        },
      });
      if (!user || user.status !== "ACTIVE") {
        throw Object.assign(new Error("User is not active"), { statusCode: 401 });
      }

      // 4. สร้าง refresh token ใหม่ภายใน tx เดียวกัน
      const raw = crypto.randomBytes(64).toString("hex");
      const newHash = crypto.createHash("sha256").update(raw).digest("hex");
      const expiresAt = new Date(Date.now() + JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
      await tx.refreshToken.create({
        data: { tokenHash: newHash, userId: user.id, expiresAt },
      });

      return { user, newRefreshToken: raw };
    });

    const newAccessToken = issueAccessToken(result.user);

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: result.newRefreshToken,
        expiresIn: JWT_ACCESS_EXPIRES_IN,
      },
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: err.message });
    }
    console.error("refreshTokenHandler error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken && typeof refreshToken === "string") {
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  authGoogleCallback,
  getCurrentUser,
  refreshTokenHandler,
  logout,
};
