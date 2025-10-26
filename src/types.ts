import type { AbilityKey } from "./constants/abilities";

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Common
export type UUID = string;

// Players
export type Ability =
  | "attack"
  | "defense"
  | "speed"
  | "technique"
  | "stamina"
  | string;

export interface Player {
  _id: UUID;
  name: string;
  abilities?: Partial<Record<AbilityKey, number>>;
  rating?: number;
  nickname?: string;
  gamesPlayed?: number;
  userId?: UUID;
  /** Nuevo backend: algunos endpoints devuelven claimedByUserId en vez de userId */
  claimedByUserId?: UUID;
  createdAt?: string;
  updatedAt?: string;
  stats?: PlayerStats;
  /** Membership contextual (rating + stats por espacio) si se llama con ?spaceId= */
  contextMembership?: PlayerContextMembership | null;
  /** @deprecated usar contextMembership?.rating */
  contextRating?: number;
  /** @deprecated usar contextMembership para derivar wins/draws/losses/gamesPlayed */
  contextStats?: PlayerStats;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  error?: string;
}

// ---------------- Contextual Membership (nuevo modelo unificado) ----------------
/**
 * Representa la membresía contextual que viene embebida en /api/players?spaceId=...
 * Se diferencia de GroupMembership legacy porque es mínima y orientada a UI.
 */
export interface PlayerContextMembership {
  membershipId: UUID;
  rating?: number;
  gamesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  // Futuro: lastMatchAt, streaks, etc.
}

// Groups

export interface Group {
  _id: UUID;
  name: string;
  members?: UUID[];
  players?: UUID[];
  createdAt?: string;
  updatedAt?: string;
  owner?: UUID;
  isOwner?: boolean;
  isMember?: boolean;
  canEdit?: boolean;
}

// Matches

export interface Team {
  name: string; 
  players: UUID[];
  score: number;
}

export type Vote = "up" | "neutral" | "down";

export interface Teams {
  teamA: UUID[];
  teamB: UUID[];
}
export type MatchStatus = "draft" | "in_progress" | "finished";

export interface Match {
  _id: UUID;
  groupId: UUID;
  participants: UUID[];
  teams?: Team[];
  status: 'pending' | 'finalized';
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  result?: MatchResult;
  feedback?: PlayerFeedback[];
  ratingApplied?: boolean;
  ratingChanges?: RatingChange[];
  owner?: UUID;
  isOwnerMatch?: boolean;
  canEdit?: boolean;
  myVotes?: UUID[];
}

// Health
export interface Health {
  ok: boolean;
}

export interface PlayerFeedback {
  playerId: UUID;
  vote: Vote;
  note?: string;
}

export interface GenerateTeamsResponse {
  teams: Team[];
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
  finalizedAt?: string;
}

export interface RatingChange {
  playerId: UUID;
  before: number;
  after: number;
  delta: number;
}

export interface MatchesGroupMeta {
  isOwner: boolean;
  isMember: boolean;
  canCreate: boolean;
  groupId: UUID;
}

export interface MatchesGroupResponse {
  matches: Match[];
  meta: MatchesGroupMeta;
}

export interface MyVoteEntry {
  playerId: UUID;
  vote: Vote;
  note?: string;
}

export interface MyVotesResponse {
  matchId: UUID;
  ratingApplied: boolean;
  ratingChanges?: RatingChange[];
  totalPlayers: number;
  myVotes: MyVoteEntry[];
  myVotedPlayerIds: UUID[];
  remainingPlayerIds: UUID[];
  completed: boolean;
}

export interface VoteProgressPerPlayer {
  playerId: UUID;
  totalVotes: number;
  distinctVoters: UUID[];
}
export interface VoteProgressPerVoter {
  userId: UUID;
  votedPlayerIds: UUID[];
  completed: boolean;
}
export interface VoteProgressResponse {
  matchId: UUID;
  perPlayer: VoteProgressPerPlayer[];
  perVoter: VoteProgressPerVoter[];
  allPlayersHaveAtLeastOneVote: boolean;
  allVotersCompletedAllPlayers: boolean;
}

// ---------------- Contextual Group Membership ----------------
/**
 * Relación jugador-grupo que introduce rating y estadísticas contextuales.
 * El backend genera un membership por cada jugador presente en un grupo.
 */
export interface GroupMembership {
  playerId: UUID;
  groupId: UUID;
  rating: number;
  /** Estadísticas agregadas (solo partidos del grupo) */
  stats?: PlayerStats;
  role?: string;               // Ej: 'admin', 'member'
  status?: string;             // Ej: 'active', 'inactive'
  createdAt?: string;
  updatedAt?: string;
}

/** Respuesta al pedir jugadores de un grupo con datos contextualizados */
// Legacy (Fase 1) GroupPlayersResponse eliminado: ahora /api/players?spaceId= retorna Player[] con contextMembership.

/** Ranking / leaderboard simple por grupo (no implementamos página dedicada Fase 1) */
export interface GroupRankingEntry {
  playerId: UUID;
  player?: Player;
  rating: number;
  wins: number; losses: number; draws: number; total: number;
}
export interface GroupRankingResponse {
  groupId: UUID;
  entries: GroupRankingEntry[];
  generatedAt?: string;
}

/** Memberships del usuario autenticado para poblar selectores u otros UI */
export interface MyMembershipsResponse {
  memberships: GroupMembership[];
}