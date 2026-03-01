// Environment variables are inlined by Vite in the client bundle,
// but are provided as globals during SSR

export const API_ENDPOINT =
  (import.meta.env?.VITE_API_ENDPOINT as string) ??
  globalThis.process?.env?.VITE_API_ENDPOINT;
