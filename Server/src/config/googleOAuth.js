const BASE_URL = process.env.BASE_URL || "http://localhost:5001";

module.exports = {
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL:
    process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`,
  frontendSuccessURL:
    process.env.FRONTEND_SUCCESS_URL || "http://localhost:5173/",
  frontendLoginURL:
    process.env.FRONTEND_LOGIN_URL || "http://localhost:5173/login",
  BASE_URL,
};
