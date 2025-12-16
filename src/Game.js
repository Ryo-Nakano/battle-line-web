// src/Game.js
// import { INVALID_MOVE } from 'boardgame.io/core'; // ESM import error workaround

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
      tactic_zone: []
    }));

    return {
      players,
      troopDeck,
      tacticDeck,
      discardPile: [],
      flags,
    };
  },

  moves: {
    // Step 3で実装するため、一旦空または既存のものを残す
    playCard: ({ G, ctx }, cardId) => {
        // 仮の実装
    }
  },

  // ターン設定などはデフォルトでOK
};
