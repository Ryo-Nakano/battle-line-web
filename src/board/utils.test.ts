import { describe, it, expect } from 'vitest';
import { parseLocationId } from './utils';

describe('parseLocationId', () => {
  it('should parse hand ID', () => {
    expect(parseLocationId('hand-0')).toEqual({ area: 'hand', playerId: '0' });
    expect(parseLocationId('hand-1')).toEqual({ area: 'hand', playerId: '1' });
  });

  it('should parse board slot ID (p0_slots)', () => {
    expect(parseLocationId('flag-0-p0_slots')).toEqual({
      area: 'board',
      flagIndex: 0,
      slotType: 'p0_slots'
    });
  });

  it('should parse board slot ID (p1_slots)', () => {
    expect(parseLocationId('flag-8-p1_slots')).toEqual({
      area: 'board',
      flagIndex: 8,
      slotType: 'p1_slots'
    });
  });

  it('should parse board slot ID (p0_tactic_slots)', () => {
    expect(parseLocationId('flag-4-p0_tactic_slots')).toEqual({
      area: 'board',
      flagIndex: 4,
      slotType: 'p0_tactic_slots'
    });
  });

  it('should parse board slot ID (p1_tactic_slots)', () => {
    expect(parseLocationId('flag-4-p1_tactic_slots')).toEqual({
      area: 'board',
      flagIndex: 4,
      slotType: 'p1_tactic_slots'
    });
  });

  it('should parse deck ID', () => {
    expect(parseLocationId('deck-troop')).toEqual({ area: 'deck', deckType: 'troop' });
    expect(parseLocationId('deck-tactic')).toEqual({ area: 'deck', deckType: 'tactic' });
  });

  it('should parse discard ID', () => {
    expect(parseLocationId('discard')).toEqual({ area: 'discard' });
  });

  it('should return null for invalid IDs', () => {
    expect(parseLocationId('')).toBeNull();
    expect(parseLocationId('invalid')).toBeNull();
    expect(parseLocationId('hand')).toBeNull(); // missing id
    expect(parseLocationId('flag-0')).toBeNull(); // missing slotType
    expect(parseLocationId('flag-x-p0_slots')).toBeNull(); // invalid index
  });
});
