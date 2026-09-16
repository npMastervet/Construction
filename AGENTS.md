# Construction Cost Manager

## Scope and architecture

Derived from BaseReactAuth commit 366e065904b531528cd6ab0a44bb1fa237868e69.
Read SYSTEM_REBUILD_BLUEPRINT.md for the target, and docs/foundation-status.md for actual implementation.
Current milestone: organization/project foundation implemented; see docs/phase-2-status.md for tested scope and runtime prerequisites.
Core must never import business modules. Keep Client/src/components/ui in place.
All new application logic uses TypeScript; inherited JS may remain with checkJs disabled.
Organization/project authorization uses active memberships from the database. Legacy roles/company enums are temporary and never grant business access.

## Commands

Root: npm run setup, npm run install:all, npm run dev:client, npm run dev:server.
Checks: npm run check. Prisma: npm run prisma:generate --prefix Server and npm run prisma:validate --prefix Server.
Client build includes typecheck. Server build emits TS and inherited JS to dist; start uses dist/index.js.
Do not commit secrets, node_modules, dist or local artifacts. Prisma migrations MUST be committed.
Schema changes need a migration and regenerated Prisma client; never reset an existing database to make a test pass.

## Backend

Entry: Server/src/index.ts; composition: Server/src/app.ts; business registration: Server/src/modules/index.ts.
Express routes -> controllers -> services -> Prisma. Services enforce access and transaction rules.
API envelope: { success, data, meta, message }. Service errors attach statusCode/code/details.
Specific routes precede /:id. Apply auth per route; avoid global auth intercepting unrelated routers.
Preserve atomic refresh rotation. Current session transport is inherited localStorage/hash; cookie/OAuth hardening remains pending.
Runtime config is validated before legacy auth modules load. No fallback JWT secret or login bypass.

## Frontend

Use @/ imports; paths belong to Client/src/routes/constants/routePaths.js.
API calls use core/auth/lib/apiClient; server state uses TanStack Query, auth uses Zustand.
Public config: shared/lib/appConfig.ts. Lazy-load new business routes and heavy dependencies.
Do not put developer setup instructions or mock business statistics in product screens.
Use PageContainer with max-w-4xl mx-auto p-4 space-y-6 (max-w-6xl for dashboards).
Use BackForwardNav with layoutBreakpoint=lg for headers; group actions and collapse button labels on mobile.
Filtered results use FilterContentFade; keep controls outside and include all criteria in fadeKey.
Forms use React Hook Form + Zod; repeat validation at Backend. Preserve unsaved input across refetches.
Extend both JWT-preload and fetched-profile shapes when adding auth profile fields.
