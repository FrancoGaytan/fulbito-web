import { _post } from '../lib/httpService';
import type { LoginRequest, LoginResponse } from '../types';
import { localStorageKeys } from '../utils/localStorageKeys';

export async function login(payload: { email: string; password: string }) {
  const { token } = await _post<{ token: string }, typeof payload>('/auth/login', payload)
  localStorage.setItem(localStorageKeys.token, token)
  return token
}

export const register = (payload: LoginRequest, signal?: AbortSignal) =>
  _post<LoginResponse, LoginRequest>('/api/auth/register', payload, signal);