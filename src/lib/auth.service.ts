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

// -------- Password Reset (código 6 dígitos) --------

interface RequestResetResponse { ok: boolean; message: string; devCode?: string }
interface VerifyResetResponse { resetSessionToken: string }
interface ResetPasswordResponse { ok: boolean; token?: string }

export function requestResetCode(email: string) {
  return _postNoAuth<RequestResetResponse, { email: string }>(
    '/api/auth/request-reset-code',
    { email }
  ).catch(async (e) => {
    // fallback por si aún está sin /api/ prefijo
    if (e?.status === 404) {
      return _postNoAuth<RequestResetResponse, { email: string }>(
        '/auth/request-reset-code',
        { email }
      );
    }
    throw e;
  });
}

export function verifyResetCode(email: string, code: string) {
  return _postNoAuth<VerifyResetResponse, { email: string; code: string }>(
    '/api/auth/verify-reset-code',
    { email, code }
  ).catch(async (e) => {
    if (e?.status === 404) {
      return _postNoAuth<VerifyResetResponse, { email: string; code: string }>(
        '/auth/verify-reset-code',
        { email, code }
      );
    }
    throw e;
  });
}

export function resetPassword(email: string, resetSessionToken: string, newPassword: string) {
  return _postNoAuth<ResetPasswordResponse, { email: string; resetSessionToken: string; newPassword: string }>(
    '/api/auth/reset-password',
    { email, resetSessionToken, newPassword }
  ).catch(async (e) => {
    if (e?.status === 404) {
      return _postNoAuth<ResetPasswordResponse, { email: string; resetSessionToken: string; newPassword: string }>(
        '/auth/reset-password',
        { email, resetSessionToken, newPassword }
      );
    }
    throw e;
  });
}