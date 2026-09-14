import React from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROUTES } from "@/routes/constants/routePaths";
import { Home } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * @typedef {{ to: string | null; label: string }} BreadcrumbCrumb
 */

/**
 * เส้นทางที่ต้องการ breadcrumb แบบกำหนดเอง (มีหน้าแม่ที่ไม่ตรงกับ URL segment)
 *
 * ลำดับสำคัญ: path ที่เจาะจงต้องมาก่อน path ที่มี `:param`
 * มิฉะนั้น `…/items/new` จะถูกจับเป็น `…/items/:id`
 *
 *   { path: ROUTES.MY_MODULE.DETAIL_PARAM,
 *     crumbs: [{ to: ROUTES.MY_MODULE.LIST, label: "รายการ" },
 *              { to: null, label: "รายละเอียด" }] }
 *
 * เส้นทางที่ไม่อยู่ในลิสต์นี้จะถูกสร้าง breadcrumb อัตโนมัติจาก URL segment
 * โดยแปลชื่อผ่าน SEGMENT_LABELS ด้านล่าง
 */
const ROUTE_MATCHERS = [
  { path: ROUTES.MAIN, crumbs: [{ to: null, label: "หน้าหลัก" }] },
];

/** แปลชื่อ URL segment เป็นภาษาไทย — ใช้ตอนสร้าง breadcrumb อัตโนมัติ */
const SEGMENT_LABELS = {
  admin: "ผู้ดูแลระบบ",
  users: "ผู้ใช้",
};

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * @param {string} pathname
 * @returns {BreadcrumbCrumb[]}
 */
function fallbackCrumbs(pathname) {
  const norm = normalizePathname(pathname);
  const parts = norm.split("/").filter(Boolean);
  /** @type {BreadcrumbCrumb[]} */
  const crumbs = [];
  let acc = "";
  for (let i = 0; i < parts.length; i += 1) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    const raw = parts[i];
    const looksLikeId = /^[0-9a-f-]{20,}$/i.test(raw) || /^\d+$/.test(raw);
    const label = looksLikeId
      ? "รายละเอียด"
      : SEGMENT_LABELS[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
    crumbs.push({ to: isLast ? null : acc, label });
  }
  return crumbs;
}

/**
 * @param {string} pathname
 * @returns {BreadcrumbCrumb[]}
 */
function resolveCrumbs(pathname) {
  const norm = normalizePathname(pathname);

  for (const def of ROUTE_MATCHERS) {
    const m = matchPath({ path: def.path, end: true, caseSensitive: false }, norm);
    if (m) {
      return def.crumbs;
    }
  }

  return fallbackCrumbs(norm);
}

export default function AutoBreadcrumbs() {
  const { pathname } = useLocation();
  const tailCrumbs = resolveCrumbs(pathname);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-x-auto sm:flex-wrap [scrollbar-width:thin]">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              to={ROUTES.MAIN}
              className="inline-flex items-center"
              aria-label="หน้าหลัก"
            >
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {tailCrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="min-w-0 max-w-[min(100%,14rem)] sm:max-w-none">
              {crumb.to ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.to} className="truncate block">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className={cn("truncate block")}>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
