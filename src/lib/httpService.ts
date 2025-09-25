import { localStorageKeys } from "../utils/localStorageKeys";

const baseURL = import.meta.env.VITE_API_BASE_URL;

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

function baseConfig(json: boolean): RequestInit {
  return {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: buildHeaders(json),
  };
}

function handle401(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem(localStorageKeys.token);
    if (location.pathname !== "/login") location.href = "/login";
    throw new Error("Unauthorized");
  }
}

export async function _get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    ...baseConfig(true),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("GET/POST/PUT/DELETE request failed");
  return (await response.json()) as T;
}

export async function __getFiles(
  path: string,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await fetch(`${baseURL}${path}`, {
    ...baseConfig(false),
    method: "GET",
    signal,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("GET Files request failed");
  return await response.blob();
}

export async function _post<T, P = any>(
  path: string,
  payload?: P,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    ...baseConfig(true),
    method: "POST",
    signal,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("POST request failed");
  return (await response.json()) as T;
}

export async function _postFiles<T = any>(
  formFile: File | Blob,
  path: string,
  signal?: AbortSignal
): Promise<T> {
  const formData = new FormData();
  formData.append("file", formFile);
  const response = await fetch(`${baseURL}${path}`, {
    ...baseConfig(false),
    method: "POST",
    signal,
    body: formData,
  });
  if (response.status === 401) handle401(response);
  if (!response.ok) throw new Error("POST Files request failed");
  return (await response.json()) as T;
}
