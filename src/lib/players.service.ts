import type { AbilityKey } from '../constants/abilities';
import { _get, _post } from '../lib/httpService';
import type { Player } from '../types';

export const listPlayers = (signal?: AbortSignal) =>
  _get<Player[]>('/players', signal)

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

// Si usás PATCH para abilities:
export const updateAbilities = (playerId: string, abilities: string[], signal?: AbortSignal) =>
  _post<Player, { abilities: string[] }>(`/api/players/${playerId}/abilities?_method=PATCH`, { abilities }, signal);