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