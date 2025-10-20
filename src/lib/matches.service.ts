import { _del, _get, _post } from "../lib/httpService";
import type { Match, UUID, PlayerFeedback, GenerateTeamsResponse, RatingChange, MatchesGroupResponse, MyVotesResponse, VoteProgressResponse } from "../types";

/**
 * List matches belonging to a specific group along with meta (permissions).
 * @param groupId Group identifier
 * @param signal Optional AbortSignal
 * @returns MatchesGroupResponse containing matches and meta
 */
export const listByGroup = (groupId: UUID, signal?: AbortSignal) =>
  _get<MatchesGroupResponse>(`/matches/group/${groupId}`, signal);

/**
 * Create a new match for a group.
 * @param groupId Group id owning the match
 * @param participants Array of player ids initially signed
 * @param scheduledAt Optional ISO or date string to schedule
 * @returns Newly created Match
 */
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

/**
 * Delete a match.
 * @param id Match id
 * @param signal Optional AbortSignal
 * @returns Confirmation message
 */
export const deleteMatch = (id: UUID, signal?: AbortSignal) =>
  _del<{ message: string }>(`/matches/${id}`, signal);

/**
 * Add a player as participant to a match.
 * @param id Match id
 * @param playerId Player id
 * @param signal Optional AbortSignal
 */
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

/**
 * Generate teams for a match (optionally AI assisted) deterministically using a seed.
 * @param id Match id
 * @param opts Options: ai flag & seed number
 * @returns Teams generation response
 */
export const generateTeams = (id: UUID, opts?: { ai?: boolean; seed?: number }) => {
  //const ai = opts?.ai ? '1' : '0'
  const seed = typeof opts?.seed === 'number' ? opts!.seed : Date.now()
  return _post<GenerateTeamsResponse>(`/matches/${id}/generate-teams?ai=1&seed=${seed}`)
}

/**
 * Send textual/legacy feedback for a player in a match (if still supported).
 * @param id Match id
 * @param payload Player feedback payload
 * @param signal Optional AbortSignal
 */
export const sendFeedback = (
  id: UUID,
  payload: PlayerFeedback,
  signal?: AbortSignal
) => _post<void, PlayerFeedback>(`/matches/${id}/feedback`, payload, signal);

/**
 * Cast a performance vote for a player inside a match.
 * @param matchId Match id
 * @param playerId Player id
 * @param vote Vote value (up | neutral | down)
 * @param signal Optional AbortSignal
 * @returns Backend acknowledgement including stored vote info
 */
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

/**
 * Finalize match setting its final score and status.
 * @param id Match id
 * @param scoreA Team A score
 * @param scoreB Team B score
 * @returns Updated Match
 */
export const finalize = (id: UUID, scoreA: number, scoreB: number) =>
  _post<Match>(`/matches/${id}/finalize`, { scoreA, scoreB });

// Update already finalized result (allowed only if ratings not applied yet)
// Backend expected to allow PATCH semantics; using method override
/**
 * Update the already finalized score (only allowed while ratings not applied).
 * @param id Match id
 * @param scoreA New score for team A
 * @param scoreB New score for team B
 * @returns Updated match with amended result
 */
export const updateResult = (id: UUID, scoreA: number, scoreB: number) =>
  _post<Match>(`/matches/${id}/result?_method=PATCH`, { scoreA, scoreB });

/**
 * Apply accumulated votes to produce rating changes.
 * @param id Match id
 * @returns Count applied + array of rating changes
 */
export const applyRatings = (id: UUID) =>
  _post<{ applied: number; changes: RatingChange[] }>(`/matches/${id}/apply-ratings`);

/**
 * Apply ratings requiring all participants / voters to have completed votes.
 * @param id Match id
 * @returns Count applied + rating changes
 */
export const applyRatingsRequireFull = (id: UUID) =>
  _post<{ applied: number; changes: RatingChange[] }>(`/matches/${id}/apply-ratings?requireFull=1`);

/**
 * Retrieve current user's voting state for a match.
 * @param id Match id
 * @returns MyVotesResponse
 */
export const getMyVotes = (id: UUID) =>
  _get<MyVotesResponse>(`/matches/${id}/my-votes`);

/**
 * Retrieve overall vote progress across players & voters.
 * @param id Match id
 * @returns VoteProgressResponse with per-player and per-voter breakdown
 */
export const getVoteProgress = (id: UUID) =>
  _get<VoteProgressResponse>(`/matches/${id}/vote-progress`);
