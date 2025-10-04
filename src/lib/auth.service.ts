import { _postNoAuth } from '../lib/httpService';
import type { LoginRequest, LoginResponse } from '../types';
import { localStorageKeys } from '../utils/localStorageKeys';

/**
 * Attempt user login trying modern and legacy endpoints sequentially.
 * Stops early on first non-404 (except 401) error.
 * @param payload Object containing email & password.
 * @returns The JWT token string on success (also persisted in localStorage).
 */
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
/**
 * Register a new user using new /api path with graceful fallback to legacy path.
 * @param payload LoginRequest containing email & password
 * @param signal Optional AbortSignal to cancel request
 * @returns LoginResponse plus the effective endpoint used
 */
export async function register(payload: LoginRequest, signal?: AbortSignal): Promise<LoginResponse & { endpoint: string }> {
  const endpoints = ['/api/auth/register', '/auth/register'];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await _postNoAuth<LoginResponse, LoginRequest>(ep, payload, signal);
      return { ...res, endpoint: ep };
    } catch (e: any) {
      lastErr = e;
      if (e?.status === 401) break;
      if (!(e?.status === 404 || /404/.test(String(e?.message)))) break;
    }
  }
  throw lastErr || new Error('Registro falló en todos los endpoints');
}

// Password Reset

interface RequestResetResponse { ok: boolean; message: string; devCode?: string }
interface VerifyResetResponse { resetSessionToken: string }
interface ResetPasswordResponse { ok: boolean; token?: string }

/**
 * Request a password reset code to be sent to the supplied email.
 * Falls back to legacy endpoint if modern one ( /api/... ) returns 404.
 * @param email Email address of the account
 * @returns Response with ok flag, message and optional devCode (in non-prod)
 */
export function requestResetCode(email: string) {
  return _postNoAuth<RequestResetResponse, { email: string }>(
    '/api/auth/request-reset-code',
    { email }
  ).catch(async (e) => {
    if (e?.status === 404) {
      return _postNoAuth<RequestResetResponse, { email: string }>(
        '/auth/request-reset-code',
        { email }
      );
    }
    throw e;
  });
}

/**
 * Verify a previously requested reset code.
 * @param email Email used in the reset request
 * @param code Code received by the user
 * @returns Reset session token allowing password change
 */
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

/**
 * Complete the password reset using session token from verify step.
 * @param email Account email
 * @param resetSessionToken Token obtained from verify endpoint
 * @param newPassword New password to set
 * @returns Operation result (may include new auth token if backend issues one)
 */
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