import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { audit, DomainError } from "./access";

const schema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{0,39}$/), name: z.string().trim().min(1).max(200), email: z.string().trim().toLowerCase().email().max(254), displayName: z.string().trim().min(1).max(200) }).strict();
export async function bootstrapOrganization(db: PrismaClient, values: z.infer<typeof schema>) {
  const input = schema.parse(values);
  return db.$transaction(async (tx) => {
    const existing = await tx.organization.findUnique({ where: { code: input.code } });
    if (existing) {
      const owner = await tx.organizationMember.findFirst({ where: { organizationId: existing.id, role: "OWNER", status: "ACTIVE", user: { email: input.email, status: "ACTIVE" } } });
      if (!owner) throw new DomainError(409, "BOOTSTRAP_CONFLICT", "องค์กรมีอยู่แล้วและเจ้าของไม่ตรงกัน");
      return { organizationId: existing.id, memberId: owner.id, created: false };
    }
    const user = await tx.user.upsert({ where: { email: input.email }, update: {}, create: { email: input.email, displayName: input.displayName } });
    if (user.status !== "ACTIVE") throw new DomainError(409, "USER_UNAVAILABLE", "บัญชีเจ้าของไม่พร้อมใช้งาน");
    const organization = await tx.organization.create({ data: { code: input.code, name: input.name } });
    const member = await tx.organizationMember.create({ data: { organizationId: organization.id, userId: user.id, role: "OWNER" } });
    await audit(tx, { organizationId: organization.id, userId: user.id, memberId: member.id, role: "OWNER", requestId: "bootstrap-cli" }, "Organization", organization.id, "organization.bootstrap", { code: input.code, ownerMemberId: member.id });
    return { organizationId: organization.id, memberId: member.id, created: true };
  });
}
if (require.main === module) {
  require("dotenv").config();
  const args = process.argv.slice(2);
  const value = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const db = require("../../config/prisma") as PrismaClient;
  bootstrapOrganization(db, schema.parse({ code: value("--code"), name: value("--name"), email: value("--email"), displayName: value("--display-name") }))
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error: Error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => db.$disconnect());
}
