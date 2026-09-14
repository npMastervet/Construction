const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("./prisma");
const { clientID, clientSecret, callbackURL } = require("./googleOAuth");
const { recordLoginAttempt } = require("../core/login-attempts/services/loginAttemptService");
const { getClientIp } = require("../utils/clientIp");

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) {
            return done(null, false, {
              reason: "no_email_from_google",
              email: null,
            });
          }

          // OAuth-only backend: allow only existing users from SQL
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              position: true,
              role: true,
              company: true,
              status: true,
              authProvider: true,
              passwordHash: true,
            },
          });

          if (!user) {
            return done(null, false, { reason: "email_not_found", email });
          }
          if (user.status !== "ACTIVE") {
            return done(null, false, {
              reason: "account_inactive",
              email,
              userId: user.id,
            });
          }

          const nextAuthProvider =
            user.authProvider === "LOCAL"
              ? user.passwordHash
                ? "BOTH"
                : "GOOGLE"
              : user.authProvider;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: profile.id || undefined,
              googleName: profile.displayName || null,
              avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
              lastLoginAt: new Date(),
              authProvider: nextAuthProvider,
            },
          });

          return done(null, user);
        } catch (err) {
          console.error("passport GoogleStrategy:", err);
          const em =
            profile?.emails?.[0]?.value?.toLowerCase().trim() || null;
          await recordLoginAttempt({
            email: em,
            status: "FAILURE",
            failureReason: "internal_error",
            ipAddress: getClientIp(req),
          });
          err.loginAttemptLogged = true;
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
