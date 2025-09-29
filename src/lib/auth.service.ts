import { _postNoAuth } from '../lib/httpService';
import type { LoginRequest, LoginResponse } from '../types';
import { localStorageKeys } from '../utils/localStorageKeys';

export async function login(payload: { email: string; password: string }) {
  const endpoints = ['/api/auth/login', '/auth/login'];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const { token } = await _postNoAuth<{ token: string }, typeof payload>(ep, payload);
      localStorage.setItem(localStorageKeys.token, token);
      return token;
    } catch (e: any) {
      lastErr = e;
      if (!(e?.status === 404 || /404/.test(String(e?.message)))) break;
    }
  }
  throw lastErr || new Error('Login falló en todos los endpoints');
}

// Registro con fallback: primero intenta nuevo path /api/auth/register, si 404 prueba /auth/register
export async function register(payload: LoginRequest, signal?: AbortSignal): Promise<LoginResponse & { endpoint: string }> {
  const endpoints = ['/api/auth/register', '/auth/register'];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await _postNoAuth<LoginResponse, LoginRequest>(ep, payload, signal);
      return { ...res, endpoint: ep };
    } catch (e: any) {
      lastErr = e;
      // Probamos siguiente sólo si 404; si 401 significa credenciales malas o backend exige algo
      if (e?.status === 401) break;
      if (!(e?.status === 404 || /404/.test(String(e?.message)))) break;
    }
  }
  throw lastErr || new Error('Registro falló en todos los endpoints');
}