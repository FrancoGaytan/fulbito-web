import type { AbilityKey } from '../constants/abilities';
import { _del, _get, _post, _patch } from '../lib/httpService';
import type { Player } from '../types';

/**
 * List players (newer endpoint may be /players without /api; fallback handled elsewhere).
 * @param signal Optional AbortSignal
 * @returns Array of Player
 */
export const listPlayers = (signal?: AbortSignal) => _get<Player[]>('/players', signal)
/**
 * List all players (admin / full list endpoint).
 * @param signal Optional AbortSignal
 * @returns Array of Player
 */
export const listAllPlayers = (signal?: AbortSignal) => _get<Player[]>('/api/players/all', signal)

/**
 * Nuevo endpoint unificado contextual:
 * GET /api/players?spaceId=xxx
 * Si se pasa spaceId => cada player puede incluir contextMembership.
 * Si no se pasa => comportamiento global (sin contextMembership) manteniendo compat.
 */
export const getPlayers = (spaceId?: string, signal?: AbortSignal) => {
  const url = spaceId ? `/api/players?spaceId=${encodeURIComponent(spaceId)}` : '/api/players'
  return _get<Player[]>(url, signal).then(arr => arr.map(p => unifyPlayerShape(p)))
}

/** Normaliza diferencias de backend (claimedByUserId vs userId, id vs _id). */
function unifyPlayerShape(raw: any): Player {
  // Asegurar _id existe para UI (si viene id nada más)
  if (raw._id == null && raw.id != null) raw._id = raw.id
  // Normalizar userId
  if (raw.userId == null && raw.claimedByUserId != null) raw.userId = raw.claimedByUserId
  // Si existen campos de membership planos, mapear a contextMembership (backend actual ya manda nested, solo defensivo)
  if (!raw.contextMembership && raw.membershipId) {
    raw.contextMembership = {
      membershipId: raw.membershipId,
      rating: raw.ratingInSpace ?? raw.rating, // fallback
      gamesPlayed: raw.gamesPlayedInSpace,
      wins: raw.winsInSpace,
      draws: raw.drawsInSpace,
      losses: raw.lossesInSpace,
    }
  }
  return raw as Player
}

/**
 * Create a player entity optionally with nickname & abilities.
 * @param name Player name
 * @param nickname Optional nickname
 * @param abilities Partial abilities map
 * @param signal Optional AbortSignal
 * @returns Newly created Player
 */
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

/**
 * Update abilities using ability keys list (string[] variant).
 * @param playerId Player id
 * @param abilities Array of ability keys
 * @param signal Optional AbortSignal
 * @returns Updated Player
 */
export const updateAbilities = (playerId: string, abilities: string[], signal?: AbortSignal) =>
  _post<Player, { abilities: string[] }>(`/api/players/${playerId}/abilities?_method=PATCH`, { abilities }, signal);

/**
 * Delete player by id (permission required).
 * @param id Player id
 * @returns Confirmation message
 */
export const deletePlayer = (id: string) =>
  _del<{ message: string }>(`/players/${id}`);

/**
 * Claim a player linking it to current authenticated user.
 * @param id Player id
 * @returns Updated Player (with userId)
 */
export const claimPlayer = (id: string) =>
  _post<Player>(`/api/players/${id}/claim`);

/**
 * Unclaim a player detaching user ownership.
 * @param id Player id
 * @returns Updated Player
 */
export const unclaimPlayer = (id: string) =>
  _post<Player>(`/api/players/${id}/unclaim`);

/**
 * Execute functions sequentially until one resolves successfully.
 * Primarily used to try multiple endpoint variants transparently.
 * @param fns Array of thunks returning a Promise
 * @returns First successful resolution value
 * @throws Last captured error if all fail (or non-404 stops early)
 */
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

/**
 * Retrieve a single player trying both new and legacy routes.
 * @param id Player id
 * @param signal Optional AbortSignal
 * @returns Player
 */
export const getPlayer = (id: string, signal?: AbortSignal) =>
  firstOk<Player>([
    () => _get<Player>(`/api/players/${id}`, signal),
    () => _get<Player>(`/players/${id}`, signal),
  ])

/**
 * Update player skill numeric values (0..10) using partial map.
 * Tries new and legacy endpoints.
 * @param id Player id
 * @param abilities Partial ability map
 * @param signal Optional AbortSignal
 * @returns Updated Player
 */
export const updatePlayerSkills = (
  id: string,
  abilities: Partial<Record<AbilityKey, number>>,
  signal?: AbortSignal
) => firstOk<Player>([
  () => _patch<Player, { abilities: Partial<Record<AbilityKey, number>> }>(`/api/players/${id}/skills`, { abilities }, signal),
  () => _patch<Player, { abilities: Partial<Record<AbilityKey, number>> }>(`/players/${id}/skills`, { abilities }, signal),
])