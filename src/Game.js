// src/Game.js
// import { INVALID_MOVE } from 'boardgame.io/core'; // ESM インポートエラー回避策

// カード生成関数（内部利用）
const createTroopDeck = () => {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const deck = [];
  colors.forEach(color => {
    for (let i = 1; i <= 10; i++) {
      deck.push({
        id: `troop-${color}-${i}`,
        type: 'troop',
        color: color,
        value: i,
        faceDown: false
      });
    }
  });
  return deck;
};

const createTacticDeck = () => {
  const tactics = [
    'Alexander', 'Darius', 'Companion', 'ShieldBearer', // Leaders
    'Fog', 'Mud', // Environment
    'Scout', 'Redeploy', 'Deserter', 'Traitor' // Guile
  ];
  return tactics.map(name => ({
    id: `tactic-${name.toLowerCase()}`,
    type: 'tactic',
    name: name,
    faceDown: false
  }));
};

import { drawCard, moveCard, claimFlag, shuffleDeck, endTurn } from './moves.js';

export const BattleLine = {
  name: 'battle-line',
  
  setup: ({ random }) => {
    const troopDeck = random.Shuffle(createTroopDeck());
    const tacticDeck = random.Shuffle(createTacticDeck());
    
    const players = {
      '0': { hand: troopDeck.splice(0, 7) },
      '1': { hand: troopDeck.splice(0, 7) }
    };
    
    const flags = Array(9).fill(null).map((_, i) => ({
      id: `flag-${i}`,
      owner: null,
      p0_slots: [],
      p1_slots: [],
      p0_tactic_slots: [],
      p1_tactic_slots: []
    }));

    return {
      players,
      troopDeck,
      tacticDeck,
      troopDiscard: [],
      tacticDiscard: [],
      tacticsField: { '0': [], '1': [] },
      scoutDrawCount: null,
      flags,
    };
  },

  moves: {
    drawCard,
    moveCard,
    claimFlag,
    shuffleDeck,
    endTurn
  },

  // ターン設定などはデフォルトでOK
};
