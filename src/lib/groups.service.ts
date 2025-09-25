import { _get, _post } from '../lib/httpService';
import type { Group } from '../types';

export const listGroups = () => _get<Group[]>('/groups')

export const createGroup = (name: string, description?: string) =>
  _post<Group>('/groups', description?.trim() ? { name, description } : { name })

export const addPlayerToGroup = (groupId: string, playerId: string, signal?: AbortSignal) =>
  _post<void, { playerId: string }>(`/api/groups/${groupId}/players`, { playerId }, signal);

export const joinGroup = (groupId: string) => _post(`/groups/${groupId}/join`)

export const addPlayersToGroup = (groupId: string, playerIds: string[]) =>
  _post<Group>(`/groups/${groupId}/players`, { playerIds })