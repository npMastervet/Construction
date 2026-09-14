const prisma = require("../../../config/prisma");

const FAILURE_REASON_MAX = 500;
const IP_MAX = 64;

/**
 * @param {object} params
 * @param {string|null|undefined} params.email
 * @param {string|null|undefined} params.userId
 * @param {"SUCCESS"|"FAILURE"} params.status
 * @param {string|null|undefined} params.failureReason
 * @param {string|null|undefined} params.ipAddress
 */
async function recordLoginAttempt({
  email,
  userId = null,
  status,
  failureReason = null,
  ipAddress = null,
}) {
  let reason = failureReason ?? null;
  if (reason && reason.length > FAILURE_REASON_MAX) {
    reason = reason.slice(0, FAILURE_REASON_MAX);
  }
  let ip = ipAddress ?? null;
  if (ip && ip.length > IP_MAX) {
    ip = ip.slice(0, IP_MAX);
  }
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email ?? null,
        userId: userId ?? null,
        status,
        failureReason: status === "SUCCESS" ? null : reason,
        ipAddress: ip,
      },
    });
  } catch (e) {
    console.error("recordLoginAttempt failed:", e);
  }
}

module.exports = { recordLoginAttempt };
