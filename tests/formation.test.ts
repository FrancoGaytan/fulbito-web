import { describe, expect, it } from 'vitest';
import { createDefaultFormation, getHorizontalPositions } from '../src/utils/formation';

describe('formation helpers', () => {
  it('centers a single player in the row', () => {
    expect(getHorizontalPositions(1)).toEqual([50]);
  });

  it('distributes two players evenly across the row', () => {
    expect(getHorizontalPositions(2)).toEqual([100 / 3, 200 / 3]);
  });

  it('creates a balanced default formation for any roster size', () => {
    for (let playerCount = 0; playerCount <= 22; playerCount += 1) {
      const formation = createDefaultFormation(playerCount);
      expect(Object.values(formation).reduce((sum, count) => sum + count, 0)).toBe(playerCount);
      expect(formation.goalkeeper).toBe(playerCount > 0 ? 1 : 0);
    }
  });
});
