// Environment variables are inlined by Vite in the client bundle,
// but are provided as globals during SSR

// Prefer private endpoint in server environment
export const API_ENDPOINT =
  globalThis.process?.env?.API_ENDPOINT_PRIVATE ??
  (import.meta.env?.VITE_API_ENDPOINT as string) ??
  globalThis.process?.env?.VITE_API_ENDPOINT;
