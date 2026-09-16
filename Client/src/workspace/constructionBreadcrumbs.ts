import { matchPath } from "react-router-dom";
import { ROUTES } from "@/routes/constants/routePaths";
export function constructionBreadcrumbs(path: string): { to: string | null; label: string }[] | null {
  const project = matchPath(ROUTES.CONSTRUCTION.PROJECT_PARAM, path);
  if (project?.params.orgId) return [{ to: ROUTES.CONSTRUCTION.ORGANIZATION(project.params.orgId), label: "โครงการ" }, { to: null, label: "รายละเอียดโครงการ" }];
  if (matchPath(ROUTES.CONSTRUCTION.ORGANIZATION_PARAM, path)) return [{ to: null, label: "พื้นที่กิจการ" }];
  return null;
}
