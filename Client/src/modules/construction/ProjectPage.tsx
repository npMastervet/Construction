import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { PageContainer } from "@/shared/components/motion/PageContainer";
import { BackForwardNav } from "@/components/ui/back-forward-nav";
import { ROUTES } from "@/routes/constants/routePaths";
import { api, type Project, type Assignment, type Member } from "./api";
import { button, Panel, EditForm, ErrorMessage, type Field } from "./components";
import { required, rate } from "./formSchemas";

export default function ProjectPage() {
  const { orgId = "", projectId = "" } = useParams(); const user = useAuthStore((s) => s.user?.id); const cache = useQueryClient();
  const base = `/organizations/${orgId}/projects/${projectId}`; const key = ["business", user, orgId];
  const project = useQuery({ queryKey: [...key, "project", projectId], queryFn: ({ signal }) => api<Project>(base, "GET", undefined, signal) });
  const [editing, setEditing] = useState<{ mode: string; snapshot: Project } | null>(null);
  const refresh = () => { setEditing(null); void cache.invalidateQueries({ queryKey: key }); };
  const row = project.data?.data;
  return <PageContainer className="max-w-4xl mx-auto p-4 space-y-6"><BackForwardNav layoutBreakpoint="lg" start={<div><Link className="text-sm text-muted-foreground hover:underline" to={ROUTES.CONSTRUCTION.ORGANIZATION(orgId)}>โครงการทั้งหมด</Link><h1 className="text-2xl font-bold">{row ? `${row.code} · ${row.name}` : "ข้อมูลโครงการ"}</h1></div>} />
    <ErrorMessage error={project.error} />{project.isPending && <p role="status">กำลังโหลดโครงการ…</p>}
    {row && !project.isError && <div className="space-y-6">
      <Panel title="ข้อมูลโครงการ"><dl className="grid gap-3 sm:grid-cols-2">{[["ลูกค้า", row.clientName], ["สถานะ", row.status], ["สถานที่", row.location], ["วันเริ่มต้น", row.startDate], ["วันสิ้นสุด", row.endDate], ...("clientContact" in row ? [["ข้อมูลติดต่อลูกค้า", row.clientContact]] : [])].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words">{value || "—"}</dd></div>)}</dl>
        <div className="flex flex-wrap gap-2">{row.permissions.includes("project.write") && !["CANCELLED", "COMPLETED"].includes(row.status) && <button className={button} disabled={!!editing} onClick={() => setEditing({ mode: "project", snapshot: row })}>แก้ไขข้อมูล</button>}{row.permissions.includes("project.transition") && row.status !== "CANCELLED" && <button className={button} disabled={!!editing} onClick={() => setEditing({ mode: "transition", snapshot: row })}>เปลี่ยนสถานะ</button>}</div>
      </Panel>
      {row.permissions.includes("financial.read") && <Panel title="มูลค่าสัญญา"><div className="grid gap-4 sm:grid-cols-3">{[["ก่อน VAT", row.contract?.netAmount], ["VAT", row.contract?.vatAmount], ["รวม VAT", row.contract?.grossAmount]].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value ? `${value} บาท` : "ยังไม่ระบุ"}</p></div>)}</div>{row.permissions.includes("project.contract.write") && !["COMPLETED", "CANCELLED"].includes(row.status) && <button className={button} disabled={!!editing} onClick={() => setEditing({ mode: "contract", snapshot: row })}>แก้ไขสัญญา</button>}</Panel>}
      {editing && <Panel title={editing.mode === "contract" ? "แก้ไขสัญญา" : editing.mode === "transition" ? "เปลี่ยนสถานะ" : "แก้ไขข้อมูลโครงการ"}><ProjectForm mode={editing.mode} row={editing.snapshot} base={base} done={refresh} cancel={() => setEditing(null)} /></Panel>}
      {row.permissions.includes("project.write") && <Team org={orgId} base={base} cacheKey={key} writable={row.permissions.includes("project.member.manage") && !["COMPLETED", "CANCELLED"].includes(row.status)} />}
    </div>}
  </PageContainer>;
}
function ProjectForm({ mode, row, base, done, cancel }: { mode: string; row: Project; base: string; done: () => void; cancel: () => void }) {
  if (mode === "contract") return <EditForm schema={z.object({ netAmount: z.string().regex(/^\d{1,16}(?:\.\d{1,2})?$/, "ระบุยอดไม่ติดลบและทศนิยมไม่เกิน 2 ตำแหน่ง"), vatRate: rate })} fields={[{ name: "netAmount", label: "ยอดก่อน VAT (บาท)" }, { name: "vatRate", label: "อัตรา VAT (0–1)" }]} initial={{ netAmount: row.contract?.netAmount ?? "0.00", vatRate: row.contract?.vatRate ?? "0" }} save={(v) => api(`${base}/contract`, "PUT", { ...v, version: row.version })} done={done} cancel={cancel} />;
  if (mode === "transition") {
    const owner = row.permissions.includes("project.contract.write");
    const options = owner ? ({ DRAFT: ["QUOTATION", "CANCELLED"], QUOTATION: ["DRAFT", "APPROVED", "CANCELLED"], APPROVED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["COMPLETED", "CANCELLED"], COMPLETED: ["IN_PROGRESS"] } as Record<string, string[]>)[row.status] ?? [] : row.status === "APPROVED" ? ["IN_PROGRESS"] : [];
    if (!options.length) return <p>ยังไม่มีการเปลี่ยนสถานะที่คุณดำเนินการได้ <button className={button} onClick={cancel}>ปิด</button></p>;
    return <><p className="text-sm text-muted-foreground">การอนุมัติต้องมี BOQ ที่อนุมัติแล้ว ส่วนการปิดงานต้องผ่านการตรวจสอบต้นทุน</p><EditForm schema={z.object({ to: required, reason: z.string().trim().max(2000) }).refine((v) => (v.to !== "CANCELLED" && row.status !== "COMPLETED") || v.reason.length > 0, { path: ["reason"], message: "กรุณาระบุเหตุผล" })} fields={[{ name: "to", label: "สถานะใหม่", options }, { name: "reason", label: "เหตุผล" }]} initial={{ to: options[0]!, reason: "" }} save={(v) => api(`${base}/transitions`, "POST", { to: v.to, ...(v.reason ? { reason: v.reason } : {}), version: row.version })} done={done} cancel={cancel} /></>;
  }
  const date = z.string().refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v), "วันที่ไม่ถูกต้อง");
  return <EditForm schema={z.object({ name: required, clientName: required, clientContact: z.string().max(500), location: z.string().max(1000), startDate: date, endDate: date }).refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น" })} fields={[{ name: "name", label: "ชื่อโครงการ" }, { name: "clientName", label: "ชื่อลูกค้า" }, { name: "clientContact", label: "ข้อมูลติดต่อลูกค้า" }, { name: "location", label: "สถานที่" }, { name: "startDate", label: "วันเริ่มต้น", type: "date" }, { name: "endDate", label: "วันสิ้นสุด", type: "date" }]} initial={{ name: row.name, clientName: row.clientName, clientContact: row.clientContact ?? "", location: row.location ?? "", startDate: row.startDate ?? "", endDate: row.endDate ?? "" }} save={(v) => api(base, "PATCH", { ...Object.fromEntries(Object.entries(v).map(([key, value]) => [key, value || null])), version: row.version })} done={done} cancel={cancel} />;
}
function Team({ org, base, cacheKey, writable }: { org: string; base: string; cacheKey: (string | undefined)[]; writable: boolean }) {
  const cache = useQueryClient(); const [editing, setEditing] = useState<Assignment | "new" | null>(null);
  const [memberPage, setMemberPage] = useState(1);
  const team = useQuery({ queryKey: [...cacheKey, base, "members"], queryFn: ({ signal }) => api<Assignment[]>(`${base}/members`, "GET", undefined, signal) });
  const members = useQuery({ queryKey: [...cacheKey, "members", "assignable", memberPage], queryFn: ({ signal }) => api<Member[]>(`/organizations/${org}/members?status=ACTIVE&pageSize=100&page=${memberPage}`, "GET", undefined, signal), enabled: writable && editing === "new" });
  const existing = editing && editing !== "new" ? editing : null;
  const fields: Field[] = [...(!existing ? [{ name: "memberId", label: "สมาชิกกิจการ", options: [{ value: "", label: "เลือกสมาชิก" }, ...(members.data?.data ?? []).map((m) => ({ value: m.id, label: m.user.displayName }))] }] : []), { name: "role", label: "บทบาทในโครงการ", options: ["VIEWER", "RECORDER", "MANAGER"] }, { name: "status", label: "สถานะ", options: ["ACTIVE", "SUSPENDED"] }, { name: "canReadCosts", label: "อนุญาตอ่านต้นทุน (เฉพาะ VIEWER)", options: ["false", "true"] }];
  return <Panel title="ทีมโครงการ"><ErrorMessage error={team.error} />{team.isPending && <p role="status">กำลังโหลดทีม…</p>}{team.data?.data.map((m) => <div className="flex flex-wrap justify-between gap-2 border-b pb-3" key={m.id}><span>{m.user.displayName} · {m.role} · {m.status}</span>{writable && <button className={button} disabled={!!editing} onClick={() => setEditing(m)}>แก้ไข</button>}</div>)}{team.data?.data.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีการมอบหมายสมาชิก</p>}{writable && !editing && <button className={button} onClick={() => setEditing("new")}>มอบหมายสมาชิก</button>}
    {editing === "new" && <><ErrorMessage error={members.error} /><p className="text-sm">เลือกสมาชิกจากรายชื่อด้านล่าง</p><div className="flex gap-2"><button className={button} disabled={memberPage <= 1} onClick={() => setMemberPage((p) => p - 1)}>ก่อนหน้า</button><button className={button} disabled={memberPage >= (members.data?.meta?.totalPages ?? 1)} onClick={() => setMemberPage((p) => p + 1)}>ถัดไป</button></div></>}
    {editing && <EditForm fields={fields} schema={z.object({ memberId: existing ? z.string() : required, role: z.enum(["VIEWER", "RECORDER", "MANAGER"]), status: z.enum(["ACTIVE", "SUSPENDED"]), canReadCosts: z.enum(["false", "true"]) }).refine((v) => v.role === "VIEWER" || v.canReadCosts === "false", { path: ["canReadCosts"], message: "ใช้ได้เฉพาะ VIEWER" })} initial={{ memberId: "", role: existing?.role ?? "VIEWER", status: existing?.status ?? "ACTIVE", canReadCosts: String(existing?.canReadCosts ?? false) }} save={(v) => api(`${base}/members/${existing?.organizationMemberId ?? v.memberId}`, "PUT", { version: existing?.version ?? null, role: v.role, status: v.status, canReadCosts: v.canReadCosts === "true" })} done={() => { setEditing(null); void cache.invalidateQueries({ queryKey: cacheKey }); }} cancel={() => setEditing(null)} />}
  </Panel>;
}
