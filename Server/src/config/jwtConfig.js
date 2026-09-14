const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === "change_me_in_env") {
  throw new Error("Set a random JWT_SECRET of at least 32 characters in Server/.env.");
}
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

// Refresh tokens ใช้ DB-persisted hash (sha256) ไม่ใช่ JWT signature
// → JWT_REFRESH_SECRET ไม่จำเป็น (removed to avoid confusion)
const JWT_REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || "30", 10);

module.exports = {
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_DAYS,
};
