/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_SYNC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
