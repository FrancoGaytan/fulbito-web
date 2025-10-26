import { _del, _get, _post } from '../lib/httpService';
import type { Group, GroupRankingResponse, MyMembershipsResponse, GroupMembership } from '../types';

/**
 * Fetch all groups visible to the current user.
 * @returns Array of Group objects
 */
export const listGroups = () => _get<Group[]>('/api/groups')

/**
 * Fetch a single group by id.
 * @param id Group identifier
 * @returns Group
 */
export const getGroup = (id: string) => _get<Group>(`/api/groups/${id}`)

/**
 * Create a new group.
 * @param name Group name
 * @param description Optional textual description
 * @returns Newly created Group
 */
export const createGroup = (name: string, description?: string) =>
  _post<Group>('/groups', description?.trim() ? { name, description } : { name })

/**
 * Add a single player to a group.
 * @param groupId Group id
 * @param playerId Player id to add
 * @param signal Optional AbortSignal
 */
export const addPlayerToGroup = (groupId: string, playerId: string, signal?: AbortSignal) =>
  _post<void, { playerId: string }>(`/api/groups/${groupId}/players`, { playerId }, signal);

/**
 * Current user joins the group.
 * @param groupId Group id
 */
export const joinGroup = (groupId: string) => _post(`/groups/${groupId}/join`)

/**
 * Bulk add multiple players to a group.
 * @param groupId Group id
 * @param playerIds Array of player ids
 * @returns Updated Group
 */
export const addPlayersToGroup = (groupId: string, playerIds: string[]) =>
  _post<Group>(`/groups/${groupId}/players`, { playerIds })

/**
 * Delete a group (requires permission).
 * @param id Group id
 * @returns Backend confirmation message
 */
export const deleteGroup = (id: string) => _del<{ message: string }>(`/groups/${id}`);

// ---------------- Contextual (multi-membership) helpers (LEGACY) ----------------
// getGroupPlayers DEPRECADO: reemplazado por getPlayers(spaceId?) en players.service.ts
// Se mantiene comentado como referencia de transición.
// export const getGroupPlayers = (groupId: string, signal?: AbortSignal) =>
//   _get<GroupPlayersResponse>(`/api/groups/${groupId}/players-context`, signal);

/**
 * Lightweight ranking (sin página dedicada todavía) que podremos usar para
 * enriquecer vistas de detalle. Incluye rating y stats agrupados.
 */
export const getGroupRanking = (groupId: string, signal?: AbortSignal) =>
  _get<GroupRankingResponse>(`/api/groups/${groupId}/ranking`, signal);

/** Crear membership explícito (normalmente backend lo hace al agregar player) */
export const createMembership = (groupId: string, playerId: string, signal?: AbortSignal) =>
  _post<GroupMembership, { playerId: string }>(`/api/groups/${groupId}/memberships`, { playerId }, signal);

/** Memberships del usuario autenticado para poblar selectores */
export const getMyMemberships = (signal?: AbortSignal) =>
  _get<MyMembershipsResponse>(`/api/memberships/me`, signal);