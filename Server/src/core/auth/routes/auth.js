const crypto  = require("crypto");
const jwt     = require("jsonwebtoken");
const express = require("express");
const passport = require("../../../config/passportGoogle");
const {
  authGoogleCallback,
  getCurrentUser,
  refreshTokenHandler,
  logout,
} = require("../controllers/authController");
const { authMiddleware } = require("../../../middleware/authMiddleware");
const { authLimiter, refreshLimiter } = require("../../../middleware/rateLimitMiddleware");
const { clientID, clientSecret, frontendLoginURL } = require("../../../config/googleOAuth");
const { JWT_SECRET } = require("../../../config/jwtConfig");
const { recordLoginAttempt } = require("../../login-attempts/services/loginAttemptService");
const { getClientIp } = require("../../../utils/clientIp");

const router = express.Router();

function normalizeReturnTo(rawReturnTo) {
  if (typeof rawReturnTo !== "string") return null;
  const value = rawReturnTo.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login")) return null;
  return value;
}

router.get("/auth/google", authLimiter, (req, res, next) => {
  if (!clientID || !clientSecret) {
    return res.status(503).json({
      success: false,
      message:
        "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }

  const returnTo = normalizeReturnTo(req.query?.returnTo);
  const allowedPrompt = req.query.prompt === "select_account" ? "select_account" : undefined;

  // สร้าง signed state เพื่อป้องกัน OAuth CSRF (Login CSRF attack)
  // — ฝัง nonce ที่ random + sign ด้วย JWT_SECRET (stateless, ไม่ต้อง session/cookie)
  // — callback จะตรวจว่า state มาจากเซิร์ฟเวอร์ของเราจริงหรือไม่
  const statePayload = {
    nonce: crypto.randomBytes(16).toString("hex"),
    ...(returnTo ? { returnTo } : {}),
  };
  const signedState = jwt.sign(statePayload, JWT_SECRET, { expiresIn: "10m" });

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    state: signedState,
    ...(allowedPrompt && { prompt: allowedPrompt }),
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  // ตรวจ OAuth state — ป้องกัน CSRF
  // state ต้องเป็น JWT ที่ sign โดยเซิร์ฟเวอร์ของเราเอง
  let returnTo = null;
  const rawState = req.query?.state;

  if (!rawState) {
    return res.redirect(`${frontendLoginURL}?error=missing_oauth_state`);
  }

  try {
    const stateData = jwt.verify(rawState, JWT_SECRET);
    returnTo = normalizeReturnTo(stateData?.returnTo);
  } catch {
    return res.redirect(`${frontendLoginURL}?error=invalid_oauth_state`);
  }

  return passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      if (err) {
        if (!err.loginAttemptLogged) {
          await recordLoginAttempt({
            email: null,
            status: "FAILURE",
            failureReason: err.message || "oauth_error",
            ipAddress: getClientIp(req),
          });
        }
        return next(err);
      }
      if (!user) {
        const reason = info?.reason || "unauthorized_user";
        const params = new URLSearchParams({ error: reason });
        if (returnTo) params.set("returnTo", returnTo);
        await recordLoginAttempt({
          email: info?.email ?? null,
          userId: info?.userId ?? null,
          status: "FAILURE",
          failureReason: reason,
          ipAddress: getClientIp(req),
        });
        return res.redirect(`${frontendLoginURL}?${params.toString()}`);
      }
      req.user = user;
      req.authReturnTo = returnTo;
      return authGoogleCallback(req, res);
    }
  )(req, res, next);
});

router.get("/auth/current-user", authMiddleware, getCurrentUser);
router.post("/auth/refresh", refreshLimiter, refreshTokenHandler);
router.post("/auth/logout", logout);

module.exports = router;
