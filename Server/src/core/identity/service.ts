import { Prisma, type PrismaClient } from "@prisma/client";
import type { z } from "zod";
import * as schemas from "./schemas";
import { activeUser, audit, checkVersion, DomainError, literalSearch, meta, missing, organizationPermissions, permit, withOrganization } from "./access";

const userSelect = { id: true, email: true, displayName: true } as const;
export class IdentityService {
  constructor(private db: PrismaClient) {}
  async organizations(userId: string) {
    await activeUser(this.db, userId);
    const rows = await this.db.organization.findMany({ where: { status: "ACTIVE", members: { some: { userId, status: "ACTIVE" } } }, orderBy: { name: "asc" } });
    return rows.map((row) => ({ ...row, defaultVatRate: row.defaultVatRate.toFixed(6) }));
  }
  context(userId: string, org: string, requestId: string) {
    return withOrganization(this.db, userId, org, requestId, false, async (tx, access) => {
      const organization = await tx.organization.findUniqueOrThrow({ where: { id: org } });
      const member = await tx.organizationMember.findUniqueOrThrow({ where: { id: access.memberId } });
      const permissions = organizationPermissions(access.role);
      if (access.role === "MEMBER") {
        const assignments = await tx.projectMember.findMany({ where: { organizationId: org, organizationMemberId: member.id, status: "ACTIVE" }, select: { role: true } });
        if (assignments.some((row) => row.role === "MANAGER" || row.role === "RECORDER")) permissions.push("supplier.read");
        if (assignments.some((row) => row.role === "MANAGER")) permissions.push("audit.read");
      }
      return { organization: { ...organization, defaultVatRate: organization.defaultVatRate.toFixed(6) }, membership: { id: member.id, role: member.role, status: member.status, version: member.version }, organizationPermissions: permissions };
    });
  }
  updateOrganization(userId: string, org: string, requestId: string, input: z.infer<typeof schemas.organizationPatch>) {
    return withOrganization(this.db, userId, org, requestId, true, async (tx, access) => {
      permit(access.role === "OWNER");
      const before = await tx.organization.findUniqueOrThrow({ where: { id: org } }); checkVersion(before.version, input.version);
      const { version, ...data } = input; void version;
      const row = await tx.organization.update({ where: { id: org }, data: { ...data, version: { increment: 1 } } });
      await audit(tx, access, "Organization", org, "organization.update", { before: { name: before.name, defaultVatRate: before.defaultVatRate }, after: data });
      return { ...row, defaultVatRate: row.defaultVatRate.toFixed(6) };
    });
  }
  members(userId: string, org: string, requestId: string, query: z.infer<typeof schemas.memberQuery>) {
    return withOrganization(this.db, userId, org, requestId, false, async (tx, access) => {
      permit(access.role === "OWNER");
      const where: Prisma.OrganizationMemberWhereInput = { organizationId: org, role: query.role, status: query.status, ...(query.search ? { user: { OR: [{ email: { contains: literalSearch(query.search) } }, { displayName: { contains: literalSearch(query.search) } }] } } : {}) };
      const rows = await tx.organizationMember.findMany({ where, include: { user: { select: userSelect } }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { id: "asc" } });
      return { data: rows.map(({ id, user, role, status, version }) => ({ id, user, role, status, version })), meta: meta(query.page, query.pageSize, await tx.organizationMember.count({ where })) };
    });
  }
  addMember(userId: string, org: string, requestId: string, input: z.infer<typeof schemas.memberCreate>) {
    return withOrganization(this.db, userId, org, requestId, true, async (tx, access) => {
      permit(access.role === "OWNER");
      const user = await tx.user.upsert({ where: { email: input.email }, update: {}, create: { email: input.email, displayName: input.displayName } });
      if (user.status !== "ACTIVE") throw new DomainError(409, "USER_UNAVAILABLE", "บัญชีนี้ยังไม่พร้อมใช้งาน");
      if (await tx.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: org, userId: user.id } } })) throw new DomainError(409, "MEMBER_EXISTS", "สมาชิกมีอยู่แล้ว");
      const row = await tx.organizationMember.create({ data: { organizationId: org, userId: user.id, role: input.role }, include: { user: { select: userSelect } } });
      await audit(tx, access, "OrganizationMember", row.id, "member.create", { role: row.role, status: row.status });
      return { id: row.id, user: row.user, role: row.role, status: row.status, version: row.version };
    });
  }
  updateMember(userId: string, org: string, requestId: string, memberId: string, input: z.infer<typeof schemas.memberPatch>) {
    return withOrganization(this.db, userId, org, requestId, true, async (tx, access) => {
      permit(access.role === "OWNER");
      const before = await tx.organizationMember.findFirst({ where: { organizationId: org, id: memberId } }); if (!before) throw missing();
      checkVersion(before.version, input.version);
      if ((input.role && input.role !== "OWNER") || input.status === "SUSPENDED") {
        if (before.role === "OWNER" && before.status === "ACTIVE" && await tx.organizationMember.count({ where: { organizationId: org, role: "OWNER", status: "ACTIVE", user: { status: "ACTIVE" }, id: { not: memberId } } }) === 0) throw new DomainError(409, "LAST_OWNER", "ต้องมีเจ้าของกิจการที่ใช้งานได้อย่างน้อยหนึ่งคน");
      }
      const { version, ...data } = input; void version;
      const row = await tx.organizationMember.update({ where: { id: memberId }, data: { ...data, version: { increment: 1 } }, include: { user: { select: userSelect } } });
      await audit(tx, access, "OrganizationMember", row.id, "member.update", { before: { role: before.role, status: before.status }, after: data });
      return { id: row.id, user: row.user, role: row.role, status: row.status, version: row.version };
    });
  }
}
