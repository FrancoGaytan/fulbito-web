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
  | string; // si tu API admite otras, lo dejamos abierto

export interface Player {
  _id: UUID;
  name: string;
  abilities?: Partial<Record<AbilityKey, number>>;
  rating?: number;
  nickname?: string;
  gamesPlayed?: number; // número de partidos finalizados jugados
  userId?: UUID; // usuario que reclamó este player (multi-user)
  createdAt?: string;
  updatedAt?: string;
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
  // Nuevos flags de acceso
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
  // Nuevos campos feature ratings/feedback
  feedback?: PlayerFeedback[];
  ratingApplied?: boolean;
  ratingChanges?: RatingChange[];
  // Nuevos flags backend
  owner?: UUID;
  isOwnerMatch?: boolean;
  canEdit?: boolean;
  // Votos del usuario actual (playerIds ya calificados por este usuario)
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

// Shape nuevo listado matches por grupo
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

// Votación por usuario (nuevo endpoint /matches/:id/my-votes)
export interface MyVoteEntry {
  playerId: UUID;
  vote: Vote;
  note?: string;
}

export interface MyVotesResponse {
  matchId: UUID;
  ratingApplied: boolean;
  ratingChanges?: RatingChange[]; // presente si ya se aplicaron
  totalPlayers: number;
  myVotes: MyVoteEntry[]; // detalle
  myVotedPlayerIds: UUID[]; // redundante / conveniente
  remainingPlayerIds: UUID[];
  completed: boolean; // true si votó a todos
}

// Progreso global (nuevo endpoint /matches/:id/vote-progress)
export interface VoteProgressPerPlayer {
  playerId: UUID;
  totalVotes: number;
  distinctVoters: UUID[]; // userIds
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