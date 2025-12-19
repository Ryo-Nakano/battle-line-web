import { describe, it, expect, beforeEach, vi } from 'vitest';
import { drawCard, moveCard, claimFlag, shuffleDeck } from './moves';
import { INVALID_MOVE } from 'boardgame.io/core';

// 必要であれば INVALID_MOVE をモックするが、まずは実際のインポートを試みる。
// 失敗した場合は以下のようにする:
// vi.mock('boardgame.io/core', () => ({ INVALID_MOVE: 'INVALID_MOVE' }));

describe('Moves', () => {
  let G;
  let ctx;

  beforeEach(() => {
    // Game.js の setup と同様の初期状態を設定
    G = {
      players: {
        '0': { hand: [] },
        '1': { hand: [] },
      },
      troopDeck: [
        { id: 't1', type: 'troop', value: 1 },
        { id: 't2', type: 'troop', value: 2 },
      ],
      tacticDeck: [{ id: 'tc1', type: 'tactic' }],
      troopDiscard: [],
      tacticDiscard: [],
      flags: Array(9).fill(null).map((_, i) => ({
        id: `flag-${i}`,
        owner: null,
        p0_slots: [],
        p1_slots: [],
        tactic_zone: [],
      })),
    };
    ctx = {
      currentPlayer: '0',
      random: {
        Shuffle: (arr) => [...arr].reverse(), // シャッフルのモック
      },
    };
  });

  describe('drawCard', () => {
    it('should draw a card from troop deck', () => {
      drawCard({ G, ctx }, 'troop');
      expect(G.players['0'].hand).toHaveLength(1);
      expect(G.players['0'].hand[0].id).toBe('t2'); // ポップされたカード
      expect(G.troopDeck).toHaveLength(1);
    });

    it('should return INVALID_MOVE if deck is empty', () => {
      G.troopDeck = [];
      const result = drawCard({ G, ctx }, 'troop');
      expect(result).toBe(INVALID_MOVE);
    });
  });

  describe('moveCard', () => {
    beforeEach(() => {
      // セットアップ: プレイヤーはカードを1枚持っている
      G.players['0'].hand = [{ id: 'c1', type: 'troop' }];
    });

    it('should move card from hand to board (p0_slots)', () => {
      const result = moveCard({ G, ctx }, {
        cardId: 'c1',
        from: { area: 'hand', playerId: '0' },
        to: { area: 'board', flagIndex: 0, slotType: 'p0_slots' }
      });

      expect(result).not.toBe(INVALID_MOVE);
      expect(G.players['0'].hand).toHaveLength(0);
      expect(G.flags[0].p0_slots).toHaveLength(1);
      expect(G.flags[0].p0_slots[0].id).toBe('c1');
    });

    it('should fail if card not in source', () => {
      const result = moveCard({ G, ctx }, {
        cardId: 'non-existent',
        from: { area: 'hand', playerId: '0' },
        to: { area: 'board', flagIndex: 0, slotType: 'p0_slots' }
      });
      expect(result).toBe(INVALID_MOVE);
    });

    // --- Step 6 Tests ---

    it('should move card to tactic_zone', () => {
        const result = moveCard({ G, ctx }, {
            cardId: 'c1',
            from: { area: 'hand', playerId: '0' },
            to: { area: 'board', flagIndex: 0, slotType: 'tactic_zone' }
        });
        expect(result).not.toBe(INVALID_MOVE);
        expect(G.flags[0].tactic_zone).toHaveLength(1);
    });

    it('should allow returning card from hand to deck (Scout)', () => {
        const result = moveCard({ G, ctx }, {
            cardId: 'c1',
            from: { area: 'hand', playerId: '0' },
            to: { area: 'deck', deckType: 'troop' }
        });
        expect(result).not.toBe(INVALID_MOVE);
        expect(G.players['0'].hand).toHaveLength(0);
        expect(G.troopDeck).toHaveLength(3); // 元の2枚 + 戻した1枚
        expect(G.troopDeck[G.troopDeck.length - 1].id).toBe('c1'); // トップに追加されているか
    });

    it('should NOT allow returning card from board to deck', () => {
        // まず盤面に置く
        G.flags[0].p0_slots = [{ id: 'c1', type: 'troop' }];
        G.players['0'].hand = [];

        const result = moveCard({ G, ctx }, {
            cardId: 'c1',
            from: { area: 'board', flagIndex: 0, slotType: 'p0_slots' },
            to: { area: 'deck', deckType: 'troop' }
        });
        expect(result).toBe(INVALID_MOVE);
    });

    it('should fail if returning card to wrong deck type', () => {
        const result = moveCard({ G, ctx }, {
            cardId: 'c1', // type: 'troop'
            from: { area: 'hand', playerId: '0' },
            to: { area: 'deck', deckType: 'tactic' }
        });
        expect(result).toBe(INVALID_MOVE);
    });

    it('should move card from hand to discard', () => {
        const result = moveCard({ G, ctx }, {
            cardId: 'c1',
            from: { area: 'hand', playerId: '0' },
            to: { area: 'discard', deckType: 'troop' }
        });
        expect(result).not.toBe(INVALID_MOVE);
        expect(G.troopDiscard).toHaveLength(1);
    });

    it('should fail if discarding to wrong pile type', () => {
        const result = moveCard({ G, ctx }, {
            cardId: 'c1', // type: 'troop'
            from: { area: 'hand', playerId: '0' },
            to: { area: 'discard', deckType: 'tactic' }
        });
        expect(result).toBe(INVALID_MOVE);
    });

    it('should move card from board to hand (retrieve)', () => {
        // まず盤面に置く
        G.flags[0].p0_slots = [{ id: 'c1', type: 'troop' }];
        G.players['0'].hand = [];

        const result = moveCard({ G, ctx }, {
            cardId: 'c1',
            from: { area: 'board', flagIndex: 0, slotType: 'p0_slots' },
            to: { area: 'hand', playerId: '0' }
        });
        expect(result).not.toBe(INVALID_MOVE);
        expect(G.players['0'].hand).toHaveLength(1);
        expect(G.flags[0].p0_slots).toHaveLength(0);
    });
  });

  describe('claimFlag', () => {
    it('should toggle flag owner', () => {
      claimFlag({ G, ctx }, 0);
      expect(G.flags[0].owner).toBe('0');

      claimFlag({ G, ctx }, 0);
      expect(G.flags[0].owner).toBe(null);
    });
  });

  describe('shuffleDeck', () => {
    it('should shuffle the deck', () => {
      // モックのシャッフルは配列を反転させる
      const initialTop = G.troopDeck[G.troopDeck.length - 1];
      shuffleDeck({ G, ctx, random: ctx.random }, 'troop'); // random は呼び出し方によって ctx に含まれるか直接渡される
      // boardgame.io は最初の引数オブジェクトとして { G, ctx, random, events... } を渡す。
      // 分割代入: shuffleDeck({ G, random }, ...).
      
      const newTop = G.troopDeck[G.troopDeck.length - 1];
      expect(newTop.id).not.toBe(initialTop.id);
      expect(G.troopDeck[0].id).toBe('t2'); // t1 が最後（トップ）になるはず（反転してるので）-> いや、array[length-1] が通常トップ。
      // 初期: [t1, t2]. pop -> t2.
      // シャッフル（反転）: [t2, t1]. pop -> t1.
    });
  });
});