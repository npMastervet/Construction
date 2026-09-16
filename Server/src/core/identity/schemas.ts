import { z } from "zod";
const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable().optional();
const version = z.number().int().positive();
export const rate = z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "วันที่ไม่ถูกต้อง").nullable().optional();
const role = z.enum(["OWNER", "ACCOUNTANT", "MEMBER"]);
const status = z.enum(["ACTIVE", "SUSPENDED"]);
const nonempty = (value: object) => Object.keys(value).some((key) => key !== "version");
export const pagination = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20), search: z.string().trim().max(200).default(""),
};
export const organizationPatch = z.object({ version, name: text(200).optional(), defaultVatRate: rate.optional() }).strict().refine(nonempty);
export const memberCreate = z.object({ email: z.string().trim().toLowerCase().email().max(254), displayName: text(200), role }).strict();
export const memberPatch = z.object({ version, role: role.optional(), status: status.optional() }).strict().refine(nonempty);
export const memberQuery = z.object({ ...pagination, role: role.optional(), status: status.optional() }).strict();
const projectFields = { name: text(200), clientName: text(200), clientContact: nullableText(500), location: nullableText(1000), startDate: date, endDate: date };
export const projectCreate = z.object({ ...projectFields, code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{0,39}$/) }).strict();
export const projectPatch = z.object({ ...z.object(projectFields).partial().shape, version }).strict().refine(nonempty);
export const projectQuery = z.object({ ...pagination, status: z.enum(["DRAFT", "QUOTATION", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(), sort: z.enum(["updatedAt:desc", "updatedAt:asc", "code:asc", "name:asc"]).default("updatedAt:desc") }).strict();
export const contractWrite = z.object({ version, netAmount: z.string().regex(/^\d{1,16}(?:\.\d{1,2})?$/), vatRate: rate }).strict();
export const transition = z.object({ version, to: z.enum(["DRAFT", "QUOTATION", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]), reason: text(2000).optional() }).strict();
export const assignment = z.object({ version: version.nullable(), role: z.enum(["MANAGER", "RECORDER", "VIEWER"]), canReadCosts: z.boolean().default(false), status }).strict().refine((value) => value.role === "VIEWER" || !value.canReadCosts, "canReadCosts ใช้เฉพาะ VIEWER");
const supplierFields = { name: text(200), taxId: z.string().regex(/^\d{13}$/).nullable().optional(), contactName: nullableText(200), telephone: nullableText(50), email: z.string().trim().email().max(254).nullable().optional(), address: nullableText(2000) };
export const supplierCreate = z.object(supplierFields).strict();
export const supplierPatch = z.object({ ...z.object(supplierFields).partial().shape, version, status: z.enum(["ACTIVE", "ARCHIVED"]).optional() }).strict().refine(nonempty);
export const supplierQuery = z.object({ ...pagination, status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE") }).strict();
export const auditQuery = z.object({ ...pagination, projectId: text(191).optional(), entityId: text(191).optional(), entityType: z.enum(["Organization", "OrganizationMember", "Project", "ProjectMember", "Supplier"]).optional(), from: z.iso.datetime().optional(), to: z.iso.datetime().optional() }).strict();
