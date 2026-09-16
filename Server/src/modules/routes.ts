import { Router, type Request, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import * as s from "../core/identity/schemas";
import { DomainError } from "../core/identity/access";
import { IdentityService } from "../core/identity/service";
import { ConstructionService } from "./construction/service";

export function createModuleRouter() {
  const db = require("../config/prisma") as PrismaClient;
  const { authMiddleware } = require("../middleware/authMiddleware");
  const identity = new IdentityService(db); const construction = new ConstructionService(db);
  const router = Router();
  const wrap = (work: (req: Request, user: string, org: string, request: string) => Promise<unknown>, status = 200): RequestHandler => async (req, res, next) => {
    try {
      const user = (req as Request & { user?: { id?: string } }).user?.id;
      if (!user || typeof user !== "string") throw new DomainError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบ");
      const result = await work(req, user, String(req.params.orgId ?? ""), randomUUID());
      if (result && typeof result === "object" && "meta" in result && "data" in result) res.status(status).json({ success: true, ...result, message: "สำเร็จ" });
      else res.status(status).json({ success: true, data: result, meta: null, message: "สำเร็จ" });
    } catch (error) {
      if (error instanceof ZodError) return next(new DomainError(400, "VALIDATION_ERROR", "ข้อมูลไม่ถูกต้อง", error.issues.map(({ path, message }) => ({ path, message }))));
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2003"].includes(error.code)) return next(new DomainError(409, "DATA_CONFLICT", "ข้อมูลซ้ำหรือความสัมพันธ์ของข้อมูลไม่ถูกต้อง"));
      next(error);
    }
  };
  const base = "/organizations/:orgId";
  router.get("/me/organizations", authMiddleware, wrap((_r, u) => identity.organizations(u)));
  router.get(`${base}/context`, authMiddleware, wrap((_r, u, o, t) => identity.context(u, o, t)));
  router.patch(base, authMiddleware, wrap((r, u, o, t) => identity.updateOrganization(u, o, t, s.organizationPatch.parse(r.body))));
  router.get(`${base}/members`, authMiddleware, wrap((r, u, o, t) => identity.members(u, o, t, s.memberQuery.parse(r.query))));
  router.post(`${base}/members`, authMiddleware, wrap((r, u, o, t) => identity.addMember(u, o, t, s.memberCreate.parse(r.body)), 201));
  router.patch(`${base}/members/:memberId`, authMiddleware, wrap((r, u, o, t) => identity.updateMember(u, o, t, String(r.params.memberId), s.memberPatch.parse(r.body))));
  router.get(`${base}/projects`, authMiddleware, wrap((r, u, o, t) => construction.projects(u, o, t, s.projectQuery.parse(r.query))));
  router.post(`${base}/projects`, authMiddleware, wrap((r, u, o, t) => construction.createProject(u, o, t, s.projectCreate.parse(r.body)), 201));
  router.put(`${base}/projects/:id/contract`, authMiddleware, wrap((r, u, o, t) => construction.contract(u, o, t, String(r.params.id), s.contractWrite.parse(r.body))));
  router.post(`${base}/projects/:id/transitions`, authMiddleware, wrap((r, u, o, t) => construction.transition(u, o, t, String(r.params.id), s.transition.parse(r.body))));
  router.get(`${base}/projects/:id/members`, authMiddleware, wrap((r, u, o, t) => construction.projectMembers(u, o, t, String(r.params.id))));
  router.put(`${base}/projects/:id/members/:memberId`, authMiddleware, wrap((r, u, o, t) => construction.assign(u, o, t, String(r.params.id), String(r.params.memberId), s.assignment.parse(r.body))));
  router.get(`${base}/projects/:id`, authMiddleware, wrap((r, u, o, t) => construction.project(u, o, t, String(r.params.id))));
  router.patch(`${base}/projects/:id`, authMiddleware, wrap(async (r, u, o, t) => {
    // Reject attempts to write protected known fields before generic schema validation.
    const row = await construction.project(u, o, t, String(r.params.id));
    if (!row.permissions.includes("project.write") || (r.body && ["contract", "contractNet", "contractVatRate", "contractVat", "contractGross"].some((key) => key in r.body) && !row.permissions.includes("project.contract.write"))) throw new DomainError(403, "FORBIDDEN", "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้");
    return construction.updateProject(u, o, t, String(r.params.id), s.projectPatch.parse(r.body));
  }));
  router.get(`${base}/suppliers`, authMiddleware, wrap((r, u, o, t) => construction.suppliers(u, o, t, s.supplierQuery.parse(r.query))));
  router.post(`${base}/suppliers`, authMiddleware, wrap((r, u, o, t) => construction.saveSupplier(u, o, t, null, s.supplierCreate.parse(r.body)), 201));
  router.get(`${base}/suppliers/:id`, authMiddleware, wrap((r, u, o, t) => construction.supplier(u, o, t, String(r.params.id))));
  router.patch(`${base}/suppliers/:id`, authMiddleware, wrap((r, u, o, t) => construction.saveSupplier(u, o, t, String(r.params.id), s.supplierPatch.parse(r.body))));
  router.get(`${base}/audit-events`, authMiddleware, wrap((r, u, o, t) => construction.audits(u, o, t, s.auditQuery.parse(r.query))));
  return router;
}
