/**
 * เพดาน page size ต่อคำขอ — ต้องสอดคล้องกับเซิร์ฟเวอร์:
 * - Zod listQuery: GET /users, /leave-requests, /approvals/pending → limit 1–100
 * - organizationController.parseLimit → max 200
 */
export const LIST_PAGE_LIMIT = {
  USERS: 100,
  LEAVE_REQUESTS: 100,
  APPROVALS_PENDING: 100,
  ORG_LIST: 200,
};

/** กันวนลูปหาก meta ผิดพลาด */
export const LIST_FETCH_MAX_PAGES = 50;

/**
 * ดึงทุกหน้าจนได้ครบตาม meta.totalPages
 * @param {(ctx: { page: number; limit: number }) => Promise<{ data?: unknown[]; meta?: { totalPages?: number } }>} fetchPage
 * @param {{ limit: number; maxPages?: number }} opts
 * @returns {Promise<unknown[]>}
 */
export async function fetchAllPagedList(fetchPage, opts) {
  const { limit, maxPages = LIST_FETCH_MAX_PAGES } = opts;
  const acc = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= maxPages) {
    const json = await fetchPage({ page, limit });
    const chunk = Array.isArray(json?.data) ? json.data : [];
    acc.push(...chunk);
    totalPages = Number(json?.meta?.totalPages) || 1;
    if (chunk.length === 0) break;
    page += 1;
  }
  return acc;
}

/** ตัด page/limit ออกจากพารามิเตอร์ก่อนส่งต่อให้ list แต่ละหน้า */
export function omitPagingKeys(params) {
  const { page: _p, limit: _l, ...rest } = params || {};
  return rest;
}
