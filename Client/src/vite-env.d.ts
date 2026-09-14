/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __VERSION_CODE__: string | null;

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_LOGO_URL?: string;
  readonly VITE_API_URL?: string;
}
