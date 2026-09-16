import { authFetch } from "@/core/auth/lib/apiClient";
export interface Envelope<T> { data: T; meta: { page: number; pageSize: number; total: number; totalPages: number } | null }
export function api<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<Envelope<T>> { return authFetch(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal }); }
export interface Organization { id: string; code: string; name: string; defaultVatRate: string; version: number }
export interface Context { organization: Organization; membership: { id: string; role: string }; organizationPermissions: string[] }
export interface Project { id: string; code: string; name: string; clientName: string; clientContact?: string | null; location: string | null; startDate: string | null; endDate: string | null; status: string; version: number; permissions: string[]; contract?: { netAmount: string; vatRate: string; vatAmount: string; grossAmount: string } | null }
export interface Member { id: string; role: string; status: string; version: number; user: { id: string; displayName: string; email: string } }
export interface Assignment { id: string; organizationMemberId: string; role: string; status: string; canReadCosts: boolean; version: number; user: { displayName: string } }
export interface Supplier { id: string; name: string; contactName: string | null; telephone: string | null; taxId?: string | null; email?: string | null; address?: string | null; status: string; version: number }
export interface AuditEvent { id: string; action: string; occurredAt: string; actorUserId: string; entityType: string; entityId: string; changes: unknown }
