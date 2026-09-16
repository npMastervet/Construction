import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { PageContainer } from "@/shared/components/motion/PageContainer";
import { BackForwardNav } from "@/components/ui/back-forward-nav";
import { FilterContentFade } from "@/shared/components/motion/FilterTransition";
import { ROUTES } from "@/routes/constants/routePaths";
import { api, type Organization, type Context, type Project, type Supplier, type Member, type AuditEvent } from "./api";
import { button, inputClass, Panel, EditForm, ErrorMessage, Pager } from "./components";
import { required, rate, optional } from "./formSchemas";

export default function WorkspacePage() {
  const user = useAuthStore((state) => state.user?.id); const { orgId } = useParams(); const navigate = useNavigate(); const cache = useQueryClient();
  const organizations = useQuery({ queryKey: ["business", user, "organizations"], queryFn: ({ signal }) => api<Organization[]>("/me/organizations", "GET", undefined, signal) });
  return <PageContainer className="max-w-4xl mx-auto p-4 space-y-6"><BackForwardNav layoutBreakpoint="lg" start={<div><h1 className="text-2xl font-bold">งานก่อสร้าง</h1><p className="text-sm text-muted-foreground">โครงการ ทีมงาน และผู้ขายของกิจการ</p></div>} />
    <ErrorMessage error={organizations.error} />
    <label className="block space-y-2"><span className="text-sm font-medium">กิจการ</span><select className={inputClass} value={orgId ?? ""} onChange={(e) => { cache.removeQueries({ queryKey: ["business", user, orgId] }); navigate(e.target.value ? ROUTES.CONSTRUCTION.ORGANIZATION(e.target.value) : ROUTES.MAIN); }}><option value="">เลือกกิจการ</option>{organizations.data?.data.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}</select></label>
    {organizations.isPending && <p role="status">กำลังโหลดกิจการ…</p>}
    {organizations.data?.data.length === 0 && <Panel title="ยังไม่มีกิจการที่คุณเข้าถึงได้"><p className="text-sm text-muted-foreground">กรุณาติดต่อเจ้าของกิจการเพื่อเพิ่มคุณเป็นสมาชิก</p></Panel>}
    {orgId && <OrganizationWorkspace key={orgId} org={orgId} user={user ?? ""} />}
  </PageContainer>;
}
function OrganizationWorkspace({ org, user }: { org: string; user: string }) {
  const [tab, setTab] = useState("projects"); const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [status, setStatus] = useState(""); const [editing, setEditing] = useState<Project | Supplier | Member | "new" | null>(null);
  const [settingsSnapshot, setSettingsSnapshot] = useState<Organization | null>(null);
  const cache = useQueryClient(); const base = `/organizations/${org}`; const key = ["business", user, org];
  const context = useQuery({ queryKey: [...key, "context"], queryFn: ({ signal }) => api<Context>(`${base}/context`, "GET", undefined, signal) });
  const permissions = context.data?.data.organizationPermissions ?? [];
  const allowed = tab === "projects" || (tab === "suppliers" && permissions.includes("supplier.read")) || (tab === "members" && permissions.includes("member.manage")) || (tab === "audit-events" && permissions.includes("audit.read"));
  const query = new URLSearchParams({ page: String(page), search, ...(status ? { status } : {}) }).toString();
  const list = useQuery({ queryKey: [...key, tab, page, search, status], queryFn: ({ signal }) => api<(Project | Supplier | Member | AuditEvent)[]>(`${base}/${tab}?${query}`, "GET", undefined, signal), enabled: Boolean(context.data) && allowed });
  const refresh = () => { setEditing(null); void cache.invalidateQueries({ queryKey: key }); };
  const switchTab = (value: string) => { if (value === "settings") setSettingsSnapshot(context.data?.data.organization ?? null); setTab(value); setPage(1); setStatus(value === "suppliers" ? "ACTIVE" : ""); setSearch(""); setEditing(null); };
  const canCreate = permissions.includes(tab === "projects" ? "project.create" : tab === "suppliers" ? "supplier.write" : tab === "members" ? "member.manage" : "-");
  if (context.isError) return <ErrorMessage error={context.error} />;
  if (!context.data) return <p role="status">กำลังโหลดสิทธิ์…</p>;
  const orgData = settingsSnapshot ?? context.data.data.organization;
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="ส่วนงาน">{[["projects", "โครงการ", true], ["suppliers", "ผู้ขาย", permissions.includes("supplier.read")], ["members", "สมาชิก", permissions.includes("member.manage")], ["settings", "ตั้งค่ากิจการ", permissions.includes("organization.write")], ["audit-events", "ประวัติ", permissions.includes("audit.read")]].filter((item) => item[2]).map(([value, label]) => <button key={String(value)} disabled={editing !== null} aria-pressed={tab === value} className={`${button} ${tab === value ? "bg-accent" : ""}`} onClick={() => switchTab(String(value))}>{label}</button>)}</div>
    {tab === "settings" ? <Panel title="ข้อมูลกิจการ"><EditForm schema={z.object({ name: required, defaultVatRate: rate })} fields={[{ name: "name", label: "ชื่อกิจการ" }, { name: "defaultVatRate", label: "อัตรา VAT เริ่มต้น (0–1)" }]} initial={{ name: orgData.name, defaultVatRate: orgData.defaultVatRate }} save={(v) => api(base, "PATCH", { ...v, version: orgData.version })} done={() => { refresh(); switchTab("projects"); }} /></Panel> : <>
      {!editing && <div className="flex flex-wrap items-end gap-3"><label className="min-w-40 flex-1 space-y-1"><span className="text-sm">ค้นหา</span><input className={inputClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>{tab !== "audit-events" && <label className="space-y-1"><span className="text-sm">สถานะ</span><select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{(tab === "projects" ? ["", "DRAFT", "QUOTATION", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] : tab === "suppliers" ? ["ACTIVE", "ARCHIVED"] : ["", "ACTIVE", "SUSPENDED"]).map((v) => <option key={v} value={v}>{v || "ทั้งหมด"}</option>)}</select></label>}{canCreate && <button className={button} onClick={() => setEditing("new")} aria-label="เพิ่มรายการ"><Plus className="h-4 w-4" /><span className="ml-2 hidden sm:inline">เพิ่มรายการ</span></button>}</div>}
      {editing && <Panel title={editing === "new" ? "เพิ่มรายการ" : "แก้ไขรายการ"}>
        {tab === "projects" && <EditForm fields={[{ name: "code", label: "รหัสโครงการ" }, { name: "name", label: "ชื่อโครงการ" }, { name: "clientName", label: "ชื่อลูกค้า" }]} schema={z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{0,39}$/, "ใช้ A–Z, 0–9, _ หรือ -"), name: required, clientName: required })} save={(v) => api(`${base}/projects`, "POST", v)} done={refresh} cancel={() => setEditing(null)} />}
        {tab === "members" && <MemberForm base={base} member={editing === "new" ? null : editing as Member} done={refresh} cancel={() => setEditing(null)} />}
        {tab === "suppliers" && <SupplierForm base={base} supplier={editing === "new" ? null : editing as Supplier} done={refresh} cancel={() => setEditing(null)} />}
      </Panel>}
      <ErrorMessage error={list.error} />
      <FilterContentFade fadeKey={`${org}-${tab}-${search}-${status}-${page}`}><div className="space-y-3" aria-busy={list.isFetching}>{list.isPending ? <p role="status">กำลังโหลด…</p> : list.isError ? null : list.data?.data.length === 0 ? <Panel title="ยังไม่มีรายการ"><p className="text-sm text-muted-foreground">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p></Panel> : list.data?.data.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        {tab === "projects" ? <Link className="flex-1 hover:underline" to={ROUTES.CONSTRUCTION.PROJECT(org, row.id)}><strong>{(row as Project).code} · {(row as Project).name}</strong><p className="text-sm text-muted-foreground">{(row as Project).clientName} · {(row as Project).status}</p></Link> : tab === "members" ? <div><strong>{(row as Member).user.displayName}</strong><p className="text-sm text-muted-foreground">{(row as Member).user.email} · {(row as Member).role} · {(row as Member).status}</p></div> : tab === "suppliers" ? <div><strong>{(row as Supplier).name}</strong><p className="text-sm text-muted-foreground">{(row as Supplier).contactName} · {(row as Supplier).telephone} · {(row as Supplier).status}</p></div> : <details className="w-full"><summary className="cursor-pointer">{(row as AuditEvent).action} · {new Date((row as AuditEvent).occurredAt).toLocaleString("th-TH")}</summary><p className="mt-2 break-all text-xs">ผู้ดำเนินการ: {(row as AuditEvent).actorUserId}</p><pre className="mt-2 overflow-auto text-xs">{JSON.stringify((row as AuditEvent).changes, null, 2)}</pre></details>}
        {canCreate && tab !== "projects" && <button className={button} disabled={editing !== null} onClick={() => setEditing(row as Supplier | Member)}>แก้ไข</button>}
      </div>)}</div></FilterContentFade>
      {!editing && list.data && <Pager page={page} pages={list.data.meta?.totalPages ?? 1} change={setPage} />}
    </>}
  </div>;
}
function MemberForm({ base, member, done, cancel }: { base: string; member: Member | null; done: () => void; cancel: () => void }) {
  return <EditForm schema={member ? z.object({ role: z.enum(["OWNER", "ACCOUNTANT", "MEMBER"]), status: z.enum(["ACTIVE", "SUSPENDED"]) }) : z.object({ email: z.string().trim().email(), displayName: required, role: z.enum(["OWNER", "ACCOUNTANT", "MEMBER"]) })} fields={[...(member ? [{ name: "status", label: "สถานะ", options: ["ACTIVE", "SUSPENDED"] }] : [{ name: "email", label: "อีเมล", type: "email" }, { name: "displayName", label: "ชื่อสมาชิก" }]), { name: "role", label: "บทบาทในกิจการ", options: ["MEMBER", "ACCOUNTANT", "OWNER"] }]} initial={member ? { role: member.role, status: member.status } : { role: "MEMBER" }} save={(v) => api(`${base}/members${member ? `/${member.id}` : ""}`, member ? "PATCH" : "POST", { ...v, ...(member ? { version: member.version } : {}) })} done={done} cancel={cancel} />;
}
function SupplierForm({ base, supplier, done, cancel }: { base: string; supplier: Supplier | null; done: () => void; cancel: () => void }) {
  return <EditForm schema={z.object({ name: required, taxId: z.string().regex(/^(?:\d{13})?$/, "เลขผู้เสียภาษี 13 หลัก"), contactName: z.string().max(200), telephone: z.string().max(50), email: z.union([z.literal(""), z.string().email().max(254)]), address: optional, status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE") })} fields={[{ name: "name", label: "ชื่อผู้ขาย" }, { name: "taxId", label: "เลขผู้เสียภาษี" }, { name: "contactName", label: "ผู้ติดต่อ" }, { name: "telephone", label: "โทรศัพท์" }, { name: "email", label: "อีเมล", type: "email" }, { name: "address", label: "ที่อยู่" }, ...(supplier ? [{ name: "status", label: "สถานะ", options: ["ACTIVE", "ARCHIVED"] }] : [])]} initial={{ name: supplier?.name ?? "", taxId: supplier?.taxId ?? "", contactName: supplier?.contactName ?? "", telephone: supplier?.telephone ?? "", email: supplier?.email ?? "", address: supplier?.address ?? "", ...(supplier ? { status: supplier.status } : {}) }} save={(v) => api(`${base}/suppliers${supplier ? `/${supplier.id}` : ""}`, supplier ? "PATCH" : "POST", { ...Object.fromEntries(Object.entries(v).filter(([k]) => supplier || k !== "status").map(([k, value]) => [k, value || null])), ...(supplier ? { version: supplier.version } : {}) })} done={done} cancel={cancel} />;
}
