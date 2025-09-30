import type { AbilityKey } from '../constants/abilities';
import { _del, _get, _post, _patch } from '../lib/httpService';
import type { Player } from '../types';

export const listPlayers = (signal?: AbortSignal) => _get<Player[]>('/players', signal)
export const listAllPlayers = (signal?: AbortSignal) => _get<Player[]>('/api/players/all', signal)

export const createPlayer = (
  name: string,
  nickname: string | undefined,
  abilities: Partial<Record<AbilityKey, number>>,
  signal?: AbortSignal
) =>
  _post<Player, { name: string; nickname?: string; abilities: Partial<Record<AbilityKey, number>> }>(
    '/players',
    { name, nickname, abilities },
    signal
  )

export const updateAbilities = (playerId: string, abilities: string[], signal?: AbortSignal) =>
  _post<Player, { abilities: string[] }>(`/api/players/${playerId}/abilities?_method=PATCH`, { abilities }, signal);

export const deletePlayer = (id: string) =>
  _del<{ message: string }>(`/players/${id}`);

export const claimPlayer = (id: string) =>
  _post<Player>(`/api/players/${id}/claim`);

export const unclaimPlayer = (id: string) =>
  _post<Player>(`/api/players/${id}/unclaim`);

async function firstOk<T>(fns: (() => Promise<T>)[]): Promise<T> {
  let lastErr: any = null
  for (const fn of fns) {
    try { return await fn() } catch (e: any) {
      lastErr = e
      if (!(e?.status === 404 || /404/.test(String(e?.message)))) break
    }
  }
  throw lastErr
}

export const getPlayer = (id: string, signal?: AbortSignal) =>
  firstOk<Player>([
    () => _get<Player>(`/api/players/${id}`, signal),
    () => _get<Player>(`/players/${id}`, signal),
  ])

export const updatePlayerSkills = (
  id: string,
  abilities: Partial<Record<AbilityKey, number>>,
  signal?: AbortSignal
) => firstOk<Player>([
  () => _patch<Player, { abilities: Partial<Record<AbilityKey, number>> }>(`/api/players/${id}/skills`, { abilities }, signal),
  () => _patch<Player, { abilities: Partial<Record<AbilityKey, number>> }>(`/players/${id}/skills`, { abilities }, signal),
])