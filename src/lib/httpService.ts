// httpService.ts
import { localStorageKeys } from "../utils/localStorageKeys";
import { buildError, parseJsonSafe } from "../utils/serviceUtils";

// Lee VITE_API_URL (prod) y cae a VITE_API_BASE_URL (legacy)
const RAW = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "").trim();
// Quita barra final
const BASE = RAW.replace(/\/+$/, "");

// Construye URL: agrega una sola barra y limpia la inicial de `path`
function u(path: string): string {
  let clean = String(path ?? "").replace(/^\/+/, "");
  // Evita doble /api cuando BASE ya termina en /api y la ruta también empieza con api/
  if (/\/api$/i.test(BASE) && /^api\//i.test(clean)) {
    // console.warn sólo en dev para ayudar a detectar mala config
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[httpService] Normalizando ruta para evitar /api/api: BASE=%s path=%s', BASE, path);
    }
    clean = clean.substring(4); // quita 'api/'
  }
  return BASE ? `${BASE}/${clean}` : `/${clean}`; // si BASE vacío, usa relativo
}

function getToken(): string | null {
  return localStorage.getItem(localStorageKeys.token);
}

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

// Variante sin Authorization (para login / register)
function buildHeadersNoAuth(json: boolean) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
  } as Record<string, string>;
}

function baseConfig(json: boolean): RequestInit {
  return {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin", // usamos JWT en localStorage, no cookies
    headers: buildHeaders(json),
  };
}

function handle401(res: Response) {
  if (res.status === 401) {
    // Limpiamos token inválido
    localStorage.removeItem(localStorageKeys.token);
    // Evitar redirecciones mientras el usuario está en pantallas públicas de auth
    const PUBLIC_AUTH_PATHS = ["/login", "/register"];
    if (!PUBLIC_AUTH_PATHS.includes(location.pathname)) {
      location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
}

export async function _get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(u(path), {
    ...baseConfig(true),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("GET/POST/PUT/DELETE request failed");
  return (await response.json()) as T;
}

export async function __getFiles(path: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(u(path), {
    ...baseConfig(false),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("GET Files request failed");
  return await response.blob();
}

export async function _post<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(u(path), {
    ...baseConfig(true),
    method: "POST",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    // Intentamos extraer mensaje del backend
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

export async function _postNoAuth<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(u(path), {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: buildHeadersNoAuth(true),
    method: "POST",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  // Para no-auth, si devuelve 401 NO redirigimos automáticamente; sólo lanzamos error
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

export async function _postFiles<T = any>(formFile: File | Blob, path: string, signal?: AbortSignal): Promise<T> {
  const formData = new FormData();
  formData.append("file", formFile);
  const response = await fetch(u(path), {
    ...baseConfig(false),
    method: "POST",
    signal,
    body: formData,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("POST Files request failed");
  return (await response.json()) as T;
}

export async function _put<T, P = any>(path: string, payload?: P, signal?: AbortSignal): Promise<T> {
  const response = await fetch(u(path), {
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

export async function _del<T = void>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(u(path), {
    ...baseConfig(true),
    method: "DELETE",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw buildError(response, data?.message || "DELETE request failed");
  }
  // si el backend devuelve 200 con JSON { message: ... }
  if (response.status === 204) return undefined as T;
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await response.json()) as T;
  return undefined as T;
}