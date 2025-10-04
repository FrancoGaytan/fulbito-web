import { _del, _get, _post } from '../lib/httpService';
import type { Group } from '../types';

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