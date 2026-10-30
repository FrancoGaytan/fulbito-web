export type FormationRole = 'goalkeeper' | 'defenders' | 'midfielders' | 'forwards';

export interface FormationCounts {
  goalkeeper: number;
  defenders: number;
  midfielders: number;
  forwards: number;
}

export function getTeamLinePositions(team: 'A' | 'B'): Record<FormationRole, number> {
  return team === 'A'
    ? { goalkeeper: 91, defenders: 79, midfielders: 67, forwards: 55 }
    : { goalkeeper: 9, defenders: 21, midfielders: 33, forwards: 45 };
}

export function createDefaultFormation(playerCount: number): FormationCounts {
  if (playerCount <= 0) {
    return { goalkeeper: 0, defenders: 0, midfielders: 0, forwards: 0 };
  }

  const outfieldCount = playerCount - 1;
  const defenders = Math.ceil(outfieldCount / 3);
  const midfielders = Math.ceil((outfieldCount - defenders) / 2);

  return {
    goalkeeper: 1,
    defenders,
    midfielders,
    forwards: outfieldCount - defenders - midfielders,
  };
}

export function getHorizontalPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [50];

  const step = 100 / (count + 1);
  return Array.from({ length: count }, (_, index) => step * (index + 1));
}
