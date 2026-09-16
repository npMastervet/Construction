import { Prisma, type PrismaClient, type OrganizationRole, type ProjectRole } from "@prisma/client";

export class DomainError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const missing = () => new DomainError(404, "NOT_FOUND", "ไม่พบข้อมูลหรือไม่มีสิทธิ์เข้าถึง");
export function permit(allowed: boolean) {
  if (!allowed) throw new DomainError(403, "FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้");
}
export function checkVersion(actual: number, expected: number | null) {
  if (actual !== expected) throw new DomainError(409, "VERSION_CONFLICT", "ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุด", { currentVersion: actual });
}
export type Tx = Prisma.TransactionClient;
export interface Access {
  userId: string;
  organizationId: string;
  memberId: string;
  role: OrganizationRole;
  requestId: string;
}
export async function activeUser(tx: Tx, userId: string) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user || user.status !== "ACTIVE") throw new DomainError(401, "UNAUTHENTICATED", "บัญชีไม่พร้อมใช้งาน");
}
export async function withOrganization<T>(db: PrismaClient, userId: string, organizationId: string, requestId: string, write: boolean, work: (tx: Tx, access: Access) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    // All membership/project mutations lock the same organization row. Revocation,
    // last-owner checks and business writes are serialized, not read-then-write races.
    if (write) await tx.$queryRaw`SELECT id FROM organization WHERE id = ${organizationId} FOR UPDATE`;
    await activeUser(tx, userId);
    const membership = await tx.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } }, include: { organization: true },
    });
    if (!membership || membership.status !== "ACTIVE" || membership.organization.status !== "ACTIVE") throw missing();
    return work(tx, { userId, organizationId, memberId: membership.id, role: membership.role, requestId });
  }, { maxWait: 10000, timeout: 15000 });
}
export function organizationPermissions(role: OrganizationRole) {
  if (role === "OWNER") return ["organization.read", "organization.write", "member.manage", "project.create", "supplier.read", "supplier.write", "audit.read"];
  if (role === "ACCOUNTANT") return ["organization.read", "supplier.read", "supplier.write", "audit.read"];
  return ["organization.read"];
}
export function projectPermissions(role: OrganizationRole, projectRole?: ProjectRole) {
  if (role === "OWNER") return ["project.read", "project.write", "project.contract.write", "project.transition", "project.member.manage", "financial.read", "audit.read"];
  if (role === "ACCOUNTANT") return ["project.read", "financial.read"];
  if (projectRole === "MANAGER") return ["project.read", "project.write", "project.transition", "financial.read", "audit.read"];
  return ["project.read"];
}
export function projectScope(access: Access): Prisma.ProjectWhereInput {
  return { organizationId: access.organizationId, ...(access.role === "MEMBER" ? {
    members: { some: { organizationMemberId: access.memberId, status: "ACTIVE" } },
  } : {}) };
}
export async function accessibleProject(tx: Tx, access: Access, id: string) {
  const project = await tx.project.findFirst({ where: { ...projectScope(access), id }, include: {
    members: { where: { organizationMemberId: access.memberId, status: "ACTIVE" } },
  } });
  if (!project) throw missing();
  return { project, permissions: projectPermissions(access.role, project.members[0]?.role) };
}
export async function audit(tx: Tx, access: Access, entityType: string, entityId: string, action: string, changes: unknown, projectId?: string) {
  await tx.auditLog.create({ data: {
    organizationId: access.organizationId, actorUserId: access.userId, requestId: access.requestId,
    projectId, entityType, entityId, action,
    changes: JSON.parse(JSON.stringify(changes)) as Prisma.InputJsonValue,
  } });
}
export function meta(page: number, pageSize: number, total: number) { return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }; }
export function literalSearch(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }
