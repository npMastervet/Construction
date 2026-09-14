import path from "path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
)

// ถอดรหัส versionDate (base64 ของ ISO timestamp) ที่ scripts/bump-version.mjs เขียนไว้
const decodeVersionDate = (value) => {
  if (typeof value !== "string" || !value) return null
  try {
    const iso = Buffer.from(value, "base64").toString("utf-8")
    return Number.isNaN(Date.parse(iso)) ? null : iso
  } catch {
    return null
  }
}
const versionDateIso = decodeVersionDate(pkg.versionDate)

// แปลงวันที่อัปเวอร์ชันเป็นรหัสสั้น ~5 ตัว (base36 ของจำนวนนาที epoch) สำหรับโชว์บน UI แทนวันที่จริง
const encodeVersionCode = (iso) => {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : Math.floor(t / 60000).toString(36)
}
const versionCode = encodeVersionCode(versionDateIso)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "")
  const appNameFromEnv = (env.VITE_APP_NAME || "").trim()
  const appName = appNameFromEnv || "Construction Cost Manager"
  // Install icons use dedicated PNGs, independent of the optional display logo.
  const icon192 = "/icon-192x192.png"
  const icon512 = "/icon-512x512.png"
  const iconMaskable = "/icon-512x512-maskable.png"

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __VERSION_CODE__: JSON.stringify(versionCode),
    },
    plugins: [
      react(),
      {
        name: "construction-html-title",
        transformIndexHtml(html) {
          const safeName = appName.replace(/[&<>"']/g, (character) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
          })[character])
          return html.replace("<title>Construction Cost Manager</title>", `<title>${safeName}</title>`)
        },
      },
      // Opt-in bundle analyzer: `ANALYZE=true vite build` writes dist/stats.html.
      // Off by default so normal builds stay clean; the HTML is git-ignored, not committed.
      process.env.ANALYZE === "true" &&
        visualizer({
          filename: "dist/stats.html",
          template: process.env.ANALYZE_TEMPLATE || "treemap",
          gzipSize: true,
          brotliSize: true,
        }),
      VitePWA({
        // autoUpdate: SW ใหม่ skipWaiting + clientsClaim อัตโนมัติ แล้ว reload หน้าเองตอน activated
        // (Phase 1) ยังคง PwaUpdateBanner ไว้ 1 รอบ deploy เพื่อพา client ที่ติดตั้ง SW แบบ prompt เดิมข้ามมา
        registerType: "autoUpdate",
        manifest: {
          name: appName,
          short_name: appName,
          description: "ระบบบริหารต้นทุนงานก่อสร้างและรีโนเวท",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          lang: "th",
          icons: [
            {
              src: icon192,
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: icon512,
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: iconMaskable,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallbackDenylist: [/^\/api\//],
          // Workbox default is 2 MiB; large single chunks fail the build without this.
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: { "/api": { target: "http://localhost:5001", changeOrigin: true } },
    },
    build: {
      modulePreload: {
        resolveDependencies(filename, deps, context) {
          if (context.hostType !== "html") return deps
          return deps.filter((dep) => !/\/?(charts|excel|flow)-[^/]+\.js$/.test(dep))
        },
      },
      rollupOptions: {
        output: {
          hoistTransitiveImports: false,
          // Split rarely-changing / heavy vendor libraries into their own chunks
          // for better long-term browser caching. Heavy libs (charts/excel/flow)
          // only load when a lazy route that uses them is visited.
          //
          // Function form (not the object form) is used deliberately: it matches by
          // node_modules path, so sub-paths like `react-dom/client` are captured too
          // — the object form missed those and leaked react-dom into the entry chunk.
          //
          // NOTE: no broad `radix` chunk on purpose — Radix/shadcn is used app-wide,
          // so bundling it into one shared vendor file would bloat the initial route.
          manualChunks(id) {
            // Rollup's CJS interop helper is a VIRTUAL module (`\0commonjsHelpers.js`) —
            // no `node_modules` in its id, so it falls through to automatic placement and
            // Rollup can park it in any chunk. When it landed in `charts`, the `react`
            // chunk had to import it back, creating a `react` <-> `charts` cycle: `charts`
            // evaluated first and read React while its binding was still `undefined`
            // (`Cannot access property "forwardRef" of undefined` at module init).
            // Pinning it to `react` keeps the dependency one-way: everything -> react.
            if (id.includes("commonjsHelpers")) return "react"
            if (!id.includes("node_modules")) return undefined
            const nm = id.split("node_modules/").pop()
            if (/^(react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)(\/|$)/.test(nm)) return "react"
            if (/^(class-variance-authority|clsx|tailwind-merge)(\/|$)/.test(nm)) return "ui-utils"
            if (nm.startsWith("@tanstack/react-query")) return "query"
            if (nm.startsWith("recharts") || nm.startsWith("d3-") || nm.startsWith("victory-")) return "charts"
            if (nm.startsWith("xlsx")) return "excel"
            if (nm.startsWith("reactflow") || nm.startsWith("@reactflow/") || nm.startsWith("@dagrejs/")) return "flow"
            if (nm.startsWith("framer-motion")) return "motion"
            if (nm.startsWith("zod") || nm.startsWith("react-hook-form") || nm.startsWith("@hookform/")) return "forms"
            return undefined
          },
        },
      },
    },
  }
})
