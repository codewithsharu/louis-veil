const backendUrlFromEnv = import.meta.env.VITE_BACKEND_URL;
const devBackendUrlFromEnv = import.meta.env.VITE_DEV_BACKEND_URL;
const backendHostIpFromEnv = import.meta.env.VITE_BACKEND_HOST_IP;
const backendPortFromEnv = import.meta.env.VITE_BACKEND_PORT || "9001";
const backendProtocolFromEnv = import.meta.env.VITE_BACKEND_PROTOCOL || "http";
const fallbackBaseUrl = "/api";

const normalizeApiBaseUrl = (value) => {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed === "/api") return "";
  if (trimmed.endsWith("/api")) return trimmed.slice(0, -4);
  return trimmed;
};

const hostBasedBackendUrl = backendHostIpFromEnv
  ? `${backendProtocolFromEnv}://${backendHostIpFromEnv}:${backendPortFromEnv}`
  : "";

const preferredBaseUrl = import.meta.env.DEV
  ? (devBackendUrlFromEnv || hostBasedBackendUrl || fallbackBaseUrl)
  : (backendUrlFromEnv || hostBasedBackendUrl || fallbackBaseUrl);

const API_BASE_URL = normalizeApiBaseUrl(
  preferredBaseUrl
);

if (import.meta.env.DEV && !devBackendUrlFromEnv && !backendHostIpFromEnv) {
  console.warn("VITE_DEV_BACKEND_URL is not set. Falling back to /api (dev proxy target from VITE_DEV_BACKEND_URL).");
}

export { API_BASE_URL };