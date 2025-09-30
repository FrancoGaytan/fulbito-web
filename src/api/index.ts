import type { Group, Player, Match, Teams, PlayerFeedback, UUID } from '../types';
import { _get, _post } from '../lib/httpService';


export const api = {
// Groups
listGroups: () => _get<Group[]>('/api/groups'),
createGroup: (payload: Pick<Group, 'name'>) => _post<Group>('/groups', payload),

// Players
listPlayers: () => _get<Player[]>('/players'),
createPlayer: (payload: Pick<Player, 'name' | 'nickname'>) => _post<Player>('/players', payload),
addPlayerToGroup: (groupId: UUID, playerId: UUID) => _post(`/api/groups/${groupId}/players`, { playerId }),

// Matches
listMatches: () => _get<Match[]>('/matches'),
createMatch: (payload: { groupId: UUID; playerIds: UUID[]; date: string }) => _post<Match>('/matches', payload),
getMatch: (id: UUID) => _get<Match>(`/matches/${id}`),
generateTeams: (id: UUID) => _post<Teams>(`/matches/${id}/generate-teams`),
sendFeedback: (id: UUID, payload: PlayerFeedback) => _post(`/matches/${id}/feedback`, payload),
finishMatch: (id: UUID, result: { teamA: number; teamB: number }) => _post(`/matches/${id}/finish`, result),
}