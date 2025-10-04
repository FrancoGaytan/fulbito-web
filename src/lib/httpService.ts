import { localStorageKeys } from "../utils/localStorageKeys";
import { buildError, parseJsonSafe } from "../utils/serviceUtils";

const RAW = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "").trim();
const BASE = RAW.replace(/\/+$/, "");

/**
 * Build fully qualified API URL from relative path.
 * Normalizes double /api/api cases in dev.
 * @param path Raw path (can start with slash)
 * @returns Absolute URL string to fetch
 */
function buildUrl(path: string): string {
  let clean = String(path ?? "").replace(/^\/+/, "");
  if (/\/api$/i.test(BASE) && /^api\//i.test(clean)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[httpService] Normalizando ruta para evitar /api/api: BASE=%s path=%s', BASE, path);
    }
    clean = clean.substring(4);
  }
  return BASE ? `${BASE}/${clean}` : `/${clean}`;
}

/**
 * Read JWT token from storage.
 * @returns Token string or null
 */
function getToken(): string | null {
  return localStorage.getItem(localStorageKeys.token);
}

/**
 * Compose authenticated headers.
 * @param json Whether to include JSON content-type
 * @returns Headers record
 */
function buildHeaders(json: boolean) {
  const token = getToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token
      ? {
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        }
      : {}),
  } as Record<string, string>;
}

/**
 * Headers for endpoints that must not include Authorization.
 * @param json Whether to include JSON content-type
 */
function buildHeadersNoAuth(json: boolean) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
  } as Record<string, string>;
}

/**
 * Base request init with mode/cache/credentials and dynamic headers.
 * @param json Include JSON content-type & accept
 */
function baseConfig(json: boolean): RequestInit {
  return {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: buildHeaders(json),
  };
}

/**
 * Unified 401 handler: clears token and redirects to /login (except on auth pages).
 * @param res Fetch response
 * @throws Always throws after redirect scheduling
 */
function handle401(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem(localStorageKeys.token);
    const PUBLIC_AUTH_PATHS = ["/login", "/register"];
    if (!PUBLIC_AUTH_PATHS.includes(location.pathname)) {
      location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
}

/**
 * HTTP GET helper with error normalization.
 * @param path Relative API path
 * @param signal Optional AbortSignal
 * @returns Parsed JSON body
 */
export async function _get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(true),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    try {
      const data = await parseJsonSafe(response);
      const msg = data?.message || `GET ${path} failed (${response.status})`;
      throw buildError(response, msg);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`GET ${path} failed (${response.status})`);
    }
  }
  return (await response.json()) as T;
}

/**
 * GET a binary/blob resource.
 * @param path Resource path
 * @param signal Optional AbortSignal
 * @returns Blob response
 */
export async function __getFiles(path: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(false),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("GET Files request failed");
  return await response.blob();
}

/**
 * HTTP POST helper (JSON body) with auth.
 * @param path Relative path
 * @param payload Optional JSON serializable payload
 * @param signal AbortSignal
 */
export async function _post<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(true),
    method: "POST",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    try {
      const data = await parseJsonSafe(response);
      const msg = data?.message || `POST ${path} failed (${response.status})`;
      throw buildError(response, msg);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`POST ${path} failed (${response.status})`);
    }
  }
  return (await response.json()) as T;
}

/**
 * HTTP POST helper without Authorization header.
 * @param path Relative path
 * @param payload Optional payload
 * @param signal AbortSignal
 */
export async function _postNoAuth<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: buildHeadersNoAuth(true),
    method: "POST",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) {
    const data = await parseJsonSafe(response);
    const msg = data?.message || `POST ${path} unauthorized`;
    throw buildError(response, msg);
  }
  if (!response.ok) {
    try {
      const data = await parseJsonSafe(response);
      const msg = data?.message || `POST ${path} failed (${response.status})`;
      throw buildError(response, msg);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`POST ${path} failed (${response.status})`);
    }
  }
  return (await response.json()) as T;
}

/**
 * Upload a single file via multipart/form-data under key "file".
 * @param formFile File/Blob
 * @param path Upload endpoint
 * @param signal Optional AbortSignal
 */
export async function _postFiles<T = any>(formFile: File | Blob, path: string, signal?: AbortSignal): Promise<T> {
  const formData = new FormData();
  formData.append("file", formFile);
  const response = await fetch(buildUrl(path), {
    ...baseConfig(false),
    method: "POST",
    signal,
    body: formData,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("POST Files request failed");
  return (await response.json()) as T;
}

/**
 * HTTP PUT helper.
 * @param path Relative path
 * @param payload Optional body
 * @param signal AbortSignal
 */
export async function _put<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(true),
    method: "PUT",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw buildError(response, data?.message || "PUT request failed");
  }
  return (await response.json()) as T;
}

/**
 * HTTP PATCH helper.
 * @param path Relative path
 * @param payload Optional body
 * @param signal AbortSignal
 */
export async function _patch<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(true),
    method: "PATCH",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw buildError(response, data?.message || "PATCH request failed");
  }
  return (await response.json()) as T;
}

/**
 * HTTP DELETE helper.
 * @param path Relative path
 * @param signal AbortSignal
 * @returns Parsed JSON body (if any) or undefined
 */
export async function _del<T = void>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...baseConfig(true),
    method: "DELETE",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw buildError(response, data?.message || "DELETE request failed");
  }
  if (response.status === 204) return undefined as T;
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await response.json()) as T;
  return undefined as T;
}