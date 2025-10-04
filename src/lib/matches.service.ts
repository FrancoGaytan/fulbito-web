import { _del, _get, _post } from "../lib/httpService";
import type { Match, UUID, PlayerFeedback, GenerateTeamsResponse, RatingChange, MatchesGroupResponse, MyVotesResponse, VoteProgressResponse } from "../types";

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

export const voteMatchPlayer = (
  matchId: UUID,
  playerId: UUID,
  vote: 'up' | 'neutral' | 'down',
  signal?: AbortSignal
) => _post<{ message: string; vote: { playerId: UUID; vote: string } }, { playerId: UUID; vote: string }>(
  `/matches/${matchId}/feedback`,
  { playerId, vote },
  signal
);

export const finalize = (id: UUID, scoreA: number, scoreB: number) =>
  _post<Match>(`/matches/${id}/finalize`, { scoreA, scoreB });

// Update already finalized result (allowed only if ratings not applied yet)
// Backend expected to allow PATCH semantics; using method override
export const updateResult = (id: UUID, scoreA: number, scoreB: number) =>
  _post<Match>(`/matches/${id}/result?_method=PATCH`, { scoreA, scoreB });

export const applyRatings = (id: UUID) =>
  _post<{ applied: number; changes: RatingChange[] }>(`/matches/${id}/apply-ratings`);

export const applyRatingsRequireFull = (id: UUID) =>
  _post<{ applied: number; changes: RatingChange[] }>(`/matches/${id}/apply-ratings?requireFull=1`);

export const getMyVotes = (id: UUID) =>
  _get<MyVotesResponse>(`/matches/${id}/my-votes`);

export const getVoteProgress = (id: UUID) =>
  _get<VoteProgressResponse>(`/matches/${id}/vote-progress`);
