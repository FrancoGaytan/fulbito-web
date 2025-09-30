import { _del, _get, _post } from "../lib/httpService";
import type { Match, UUID, PlayerFeedback, GenerateTeamsResponse, RatingChange, MatchesGroupResponse } from "../types";

export const listByGroup = (groupId: UUID, signal?: AbortSignal) =>
  _get<MatchesGroupResponse>(`/matches/group/${groupId}`, signal);

export async function create(
  groupId: UUID,
  participants: UUID[],
  scheduledAt?: string
): Promise<Match> {
  const body: any = { groupId, participants };
  if (scheduledAt) {
    body.scheduledAt = new Date(scheduledAt).toISOString();
  }
  return _post<Match>('/matches', body);
}

export const deleteMatch = (id: UUID, signal?: AbortSignal) =>
  _del<{ message: string }>(`/matches/${id}`, signal);

export const addParticipant = (
  id: UUID,
  playerId: UUID,
  signal?: AbortSignal
) =>
  _post<void, { playerId: UUID }>(
    `/matches/${id}/participants`,
    { playerId },
    signal
  );

export const generateTeams = (id: UUID, opts?: { ai?: boolean; seed?: number }) => {
  const ai = opts?.ai ? '1' : '0'
  const seed = typeof opts?.seed === 'number' ? opts!.seed : Date.now()
  return _post<GenerateTeamsResponse>(`/matches/${id}/generate-teams?ai=${ai}&seed=${seed}`)
}

export const sendFeedback = (
  id: UUID,
  payload: PlayerFeedback,
  signal?: AbortSignal
) => _post<void, PlayerFeedback>(`/matches/${id}/feedback`, payload, signal);

export const finalize = (id: UUID, scoreA: number, scoreB: number) =>
  _post<Match>(`/matches/${id}/finalize`, { scoreA, scoreB });

export const applyRatings = (id: UUID) =>
  _post<{ applied: number; changes: RatingChange[] }>(`/matches/${id}/apply-ratings`);
