import { Prisma, type PrismaClient, type Project, type Supplier } from "@prisma/client";
import type { z } from "zod";
import * as s from "../../core/identity/schemas";
import { accessibleProject, audit, checkVersion, DomainError, literalSearch, meta, missing, permit, projectPermissions, projectScope, withOrganization, type Access, type Tx } from "../../core/identity/access";

// Multiplication may require 24 significant digits before the final cent rounding.
const MoneyDecimal = Prisma.Decimal.clone({ precision: 40, rounding: Prisma.Decimal.ROUND_HALF_UP });

function projectDto(row: Project, permissions: string[]) {
  const { id, code, name, clientName, location, startDate, endDate, status, version, createdAt, updatedAt } = row;
  return { id, code, name, clientName, location, startDate: startDate?.toISOString().slice(0, 10) ?? null, endDate: endDate?.toISOString().slice(0, 10) ?? null, status, version, createdAt, updatedAt, permissions,
    ...(permissions.includes("financial.read") ? { clientContact: row.clientContact, contract: row.contractNet === null ? null : { netAmount: row.contractNet.toFixed(2), vatRate: row.contractVatRate!.toFixed(6), vatAmount: row.contractVat!.toFixed(2), grossAmount: row.contractGross!.toFixed(2) } } : {}) };
}
function editable(row: Project) {
  if (["COMPLETED", "CANCELLED"].includes(row.status)) throw new DomainError(409, "PROJECT_CLOSED", "โครงการปิดแล้ว");
}
function dates(input: { startDate?: string | null; endDate?: string | null }, before?: Project) {
  const start = input.startDate === undefined ? before?.startDate : input.startDate ? new Date(input.startDate) : null;
  const end = input.endDate === undefined ? before?.endDate : input.endDate ? new Date(input.endDate) : null;
  if (start && end && end < start) throw new DomainError(400, "INVALID_DATES", "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
  return { startDate: start, endDate: end };
}
async function supplierAccess(tx: Tx, a: Access) {
  if (a.role !== "MEMBER") return "full";
  const roles = await tx.projectMember.findMany({ where: { organizationId: a.organizationId, organizationMemberId: a.memberId, status: "ACTIVE", role: { in: ["MANAGER", "RECORDER"] } }, select: { role: true } });
  permit(roles.length > 0);
  return roles.some((r) => r.role === "MANAGER") ? "full" : "basic";
}
function supplierDto(row: Supplier, level: string) {
  const { id, name, status, contactName, telephone, version, createdAt, updatedAt } = row;
  return { id, name, status, contactName, telephone, version, createdAt, updatedAt, ...(level === "full" ? { taxId: row.taxId, email: row.email, address: row.address } : {}) };
}
export class ConstructionService {
  constructor(private db: PrismaClient) {}
  run<T>(user: string, org: string, request: string, write: boolean, work: (tx: Tx, a: Access) => Promise<T>) { return withOrganization(this.db, user, org, request, write, work); }
  projects(user: string, org: string, request: string, q: z.infer<typeof s.projectQuery>) {
    return this.run(user, org, request, false, async (tx, a) => {
      const where: Prisma.ProjectWhereInput = { ...projectScope(a), status: q.status, ...(q.search ? { OR: ["code", "name", "clientName"].map((key) => ({ [key]: { contains: literalSearch(q.search) } })) } : {}) };
      const [field = "updatedAt", direction = "desc"] = q.sort.split(":");
      const rows = await tx.project.findMany({ where, include: { members: { where: { organizationMemberId: a.memberId, status: "ACTIVE" } } }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, orderBy: [{ [field]: direction }, { id: "asc" }] });
      return { data: rows.map((r) => projectDto(r, projectPermissions(a.role, r.members[0]?.role))), meta: meta(q.page, q.pageSize, await tx.project.count({ where })) };
    });
  }
  project(user: string, org: string, request: string, id: string) {
    return this.run(user, org, request, false, async (tx, a) => { const { project, permissions } = await accessibleProject(tx, a, id); return projectDto(project, permissions); });
  }
  createProject(user: string, org: string, request: string, input: z.infer<typeof s.projectCreate>) {
    return this.run(user, org, request, true, async (tx, a) => {
      permit(a.role === "OWNER");
      const row = await tx.project.create({ data: { ...input, ...dates(input), organizationId: org, createdByUserId: user } });
      await audit(tx, a, "Project", row.id, "project.create", { code: row.code, name: row.name, status: row.status }, row.id);
      return projectDto(row, projectPermissions(a.role));
    });
  }
  updateProject(user: string, org: string, request: string, id: string, input: z.infer<typeof s.projectPatch>) {
    return this.run(user, org, request, true, async (tx, a) => {
      const { project: before, permissions } = await accessibleProject(tx, a, id); permit(permissions.includes("project.write")); editable(before); checkVersion(before.version, input.version);
      const { version, ...data } = input; void version;
      const row = await tx.project.update({ where: { id }, data: { ...data, ...dates(input, before), version: { increment: 1 } } });
      await audit(tx, a, "Project", id, "project.update", { after: data }, id);
      return projectDto(row, permissions);
    });
  }
  contract(user: string, org: string, request: string, id: string, input: z.infer<typeof s.contractWrite>) {
    return this.run(user, org, request, true, async (tx, a) => {
      const { project, permissions } = await accessibleProject(tx, a, id); permit(permissions.includes("project.contract.write")); editable(project); checkVersion(project.version, input.version);
      const net = new MoneyDecimal(input.netAmount); const rate = new MoneyDecimal(input.vatRate);
      const vat = net.mul(rate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP); const gross = net.add(vat);
      if (gross.gt("9999999999999999.99")) throw new DomainError(400, "AMOUNT_OVERFLOW", "ยอดรวมเกินขนาดที่รองรับ");
      const row = await tx.project.update({ where: { id }, data: { contractNet: net, contractVatRate: rate, contractVat: vat, contractGross: gross, version: { increment: 1 } } });
      await audit(tx, a, "Project", id, "project.contract.update", { before: { net: project.contractNet, vatRate: project.contractVatRate }, after: { net, rate, vat, gross } }, id);
      return projectDto(row, permissions);
    });
  }
  transition(user: string, org: string, request: string, id: string, input: z.infer<typeof s.transition>) {
    return this.run(user, org, request, true, async (tx, a) => {
      const { project, permissions } = await accessibleProject(tx, a, id); permit(permissions.includes("project.transition")); checkVersion(project.version, input.version);
      if (a.role !== "OWNER") permit(project.status === "APPROVED" && input.to === "IN_PROGRESS");
      const pair = `${project.status}:${input.to}`;
      if (pair === "QUOTATION:APPROVED" || pair === "IN_PROGRESS:COMPLETED") throw new DomainError(409, "PRECONDITION_FAILED", "ต้องมี BOQ และการตรวจสอบต้นทุนก่อนดำเนินการขั้นนี้");
      const cancel = input.to === "CANCELLED" && ["DRAFT", "QUOTATION", "APPROVED", "IN_PROGRESS"].includes(project.status);
      if (!["DRAFT:QUOTATION", "QUOTATION:DRAFT", "APPROVED:IN_PROGRESS", "COMPLETED:IN_PROGRESS"].includes(pair) && !cancel) throw new DomainError(409, "INVALID_TRANSITION", "ไม่สามารถเปลี่ยนสถานะตามที่ระบุ");
      if ((cancel || pair === "COMPLETED:IN_PROGRESS") && !input.reason) throw new DomainError(400, "REASON_REQUIRED", "กรุณาระบุเหตุผล");
      const row = await tx.project.update({ where: { id }, data: { status: input.to, version: { increment: 1 } } });
      await audit(tx, a, "Project", id, "project.transition", { from: project.status, to: input.to, reason: input.reason }, id);
      return projectDto(row, permissions);
    });
  }
  projectMembers(user: string, org: string, request: string, id: string) {
    return this.run(user, org, request, false, async (tx, a) => {
      const { permissions } = await accessibleProject(tx, a, id); permit(permissions.includes("project.write"));
      const rows = await tx.projectMember.findMany({ where: { organizationId: org, projectId: id }, include: { member: { include: { user: { select: { id: true, displayName: true } } } } }, orderBy: { id: "asc" } });
      return rows.map(({ member, ...row }) => ({ ...row, user: member.user, membershipStatus: member.status }));
    });
  }
  assign(user: string, org: string, request: string, id: string, memberId: string, input: z.infer<typeof s.assignment>) {
    return this.run(user, org, request, true, async (tx, a) => {
      const { project, permissions } = await accessibleProject(tx, a, id); permit(permissions.includes("project.member.manage")); editable(project);
      const member = await tx.organizationMember.findFirst({ where: { id: memberId, organizationId: org, status: "ACTIVE", user: { status: "ACTIVE" } } }); if (!member) throw missing();
      const where = { projectId_organizationMemberId: { projectId: id, organizationMemberId: memberId } };
      const before = await tx.projectMember.findUnique({ where });
      if (before) checkVersion(before.version, input.version); else if (input.version !== null) throw new DomainError(409, "VERSION_CONFLICT", "รายการมอบหมายยังไม่มีอยู่");
      const { version, ...data } = input; void version;
      const row = before ? await tx.projectMember.update({ where, data: { ...data, version: { increment: 1 } } }) : await tx.projectMember.create({ data: { ...data, organizationId: org, projectId: id, organizationMemberId: memberId } });
      await audit(tx, a, "ProjectMember", row.id, "project.member.assign", { memberId, before: before ? { role: before.role, status: before.status, canReadCosts: before.canReadCosts } : null, after: data }, id);
      return row;
    });
  }
  suppliers(user: string, org: string, request: string, q: z.infer<typeof s.supplierQuery>) {
    return this.run(user, org, request, false, async (tx, a) => {
      const level = await supplierAccess(tx, a);
      const where: Prisma.SupplierWhereInput = { organizationId: org, status: q.status, ...(q.search ? { name: { contains: literalSearch(q.search) } } : {}) };
      const rows = await tx.supplier.findMany({ where, skip: (q.page - 1) * q.pageSize, take: q.pageSize, orderBy: [{ name: "asc" }, { id: "asc" }] });
      return { data: rows.map((row) => supplierDto(row, level)), meta: meta(q.page, q.pageSize, await tx.supplier.count({ where })) };
    });
  }
  supplier(user: string, org: string, request: string, id: string) {
    return this.run(user, org, request, false, async (tx, a) => { const level = await supplierAccess(tx, a); const row = await tx.supplier.findFirst({ where: { id, organizationId: org } }); if (!row) throw missing(); return supplierDto(row, level); });
  }
  saveSupplier(user: string, org: string, request: string, id: string | null, input: z.infer<typeof s.supplierCreate> | z.infer<typeof s.supplierPatch>) {
    return this.run(user, org, request, true, async (tx, a) => {
      permit(a.role === "OWNER" || a.role === "ACCOUNTANT");
      let row: Supplier;
      if (id && "version" in input) {
        const before = await tx.supplier.findFirst({ where: { id, organizationId: org } }); if (!before) throw missing(); checkVersion(before.version, input.version);
        const { version, ...data } = input; void version;
        row = await tx.supplier.update({ where: { id }, data: { ...data, version: { increment: 1 } } });
      } else { row = await tx.supplier.create({ data: { ...s.supplierCreate.parse(input), organizationId: org, createdByUserId: user } }); }
      await audit(tx, a, "Supplier", row.id, id ? "supplier.update" : "supplier.create", { after: input });
      return supplierDto(row, "full");
    });
  }
  audits(user: string, org: string, request: string, q: z.infer<typeof s.auditQuery>) {
    return this.run(user, org, request, false, async (tx, a) => {
      const scope: Prisma.AuditLogWhereInput = {};
      if (a.role === "ACCOUNTANT") scope.entityType = "Supplier";
      if (a.role === "MEMBER") {
        const assigned = await tx.projectMember.findMany({ where: { organizationMemberId: a.memberId, organizationId: org, role: "MANAGER", status: "ACTIVE" }, select: { projectId: true } });
        permit(assigned.length > 0); scope.projectId = { in: assigned.map((r) => r.projectId) }; scope.entityType = { in: ["Project", "ProjectMember"] };
      }
      if (q.projectId) await accessibleProject(tx, a, q.projectId);
      if (q.from && q.to && q.from > q.to) throw new DomainError(400, "INVALID_DATES", "ช่วงวันที่ไม่ถูกต้อง");
      const where: Prisma.AuditLogWhereInput = { organizationId: org, AND: [scope, { projectId: q.projectId, entityType: q.entityType, entityId: q.entityId }], occurredAt: { gte: q.from ? new Date(q.from) : undefined, lte: q.to ? new Date(q.to) : undefined }, ...(q.search ? { action: { contains: literalSearch(q.search) } } : {}) };
      return { data: await tx.auditLog.findMany({ where, skip: (q.page - 1) * q.pageSize, take: q.pageSize, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] }), meta: meta(q.page, q.pageSize, await tx.auditLog.count({ where })) };
    });
  }
}
