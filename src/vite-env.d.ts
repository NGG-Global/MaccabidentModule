/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" allows DRAFT content to be shown in a production build (pilot use only). */
  readonly VITE_ALLOW_DRAFT?: string;
  /** "console" | "noop". Defaults to console in dev and noop in production. */
  readonly VITE_ANALYTICS_ADAPTER?: string;
}
