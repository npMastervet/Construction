// Seed ผู้ใช้ตั้งต้น — idempotent (รันซ้ำได้ ไม่สร้างซ้ำ)
//
// backend เป็น OAuth-only: Google login อนุญาตเฉพาะ email ที่มีอยู่ใน DB แล้ว
// การ seed จึงเป็นวิธี "เปิดสิทธิ์" ให้ผู้ใช้เข้าระบบได้ครั้งแรก
// ตอนล็อกอิน Google จะ match ด้วย email แล้วผูก googleId ให้เอง โดยไม่เขียนทับ role
//
// รัน: npm run db:seed  (หรือ prisma db seed)
const prisma = require("../src/config/prisma");

// รายชื่อผู้ใช้ตั้งต้น — เพิ่ม/แก้ที่นี่ แล้วรัน seed ซ้ำได้
const SEED_USERS = [
  {
    email: "np.mastervet@gmail.com",
    role: "ADMIN",
    displayName: "NP Mastervet",
    company: "MasterVet",
  },
];

async function main() {
  for (const u of SEED_USERS) {
    const email = u.email.toLowerCase().trim();
    const user = await prisma.user.upsert({
      where: { email },
      // อัปเดตเฉพาะฟิลด์ที่ seed คุม (role/status/authProvider) ให้ตรงเสมอ
      // ไม่แตะ googleId/lastLoginAt ที่ระบบ login เขียนไว้
      update: {
        role: u.role,
        status: "ACTIVE",
        authProvider: "GOOGLE",
        ...(u.displayName ? { displayName: u.displayName } : {}),
        ...(u.company ? { company: u.company } : {}),
      },
      create: {
        email,
        role: u.role,
        status: "ACTIVE",
        authProvider: "GOOGLE",
        displayName: u.displayName ?? null,
        ...(u.company ? { company: u.company } : {}),
      },
      select: { id: true, email: true, role: true, status: true, authProvider: true },
    });
    console.log(`seeded: ${user.email} (role=${user.role}, status=${user.status})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
