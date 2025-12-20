import { 
  COLORS, 
  TROOP_VALUES, 
  TACTIC_IDS, 
  CARD_TYPES, 
  PLAYER_IDS, 
  GAME_CONFIG,
  SLOTS 
} from './constants.js';
import { drawCard, drawAndEndTurn, moveCard, claimFlag, shuffleDeck, endTurn } from './moves.js';

// カード生成関数（内部利用）
const createTroopDeck = () => {
  const deck = [];
  Object.values(COLORS).forEach(color => {
    TROOP_VALUES.forEach(value => {
      deck.push({
        id: `${CARD_TYPES.TROOP}-${color}-${value}`,
        type: CARD_TYPES.TROOP,
        color: color,
        value: value,
        faceDown: false
      });
    });
  });
  return deck;
};

const createTacticDeck = () => {
  const tactics = Object.values(TACTIC_IDS);
  return tactics.map(name => ({
    id: `${CARD_TYPES.TACTIC}-${name.toLowerCase()}`,
    type: CARD_TYPES.TACTIC,
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
      [PLAYER_IDS.P0]: { hand: troopDeck.splice(0, GAME_CONFIG.HAND_SIZE) },
      [PLAYER_IDS.P1]: { hand: troopDeck.splice(0, GAME_CONFIG.HAND_SIZE) }
    };
    
    const flags = Array(GAME_CONFIG.FLAG_COUNT).fill(null).map((_, i) => ({
      id: `flag-${i}`,
      owner: null,
      [SLOTS.P0]: [],
      [SLOTS.P1]: [],
      [SLOTS.P0_TACTIC]: [],
      [SLOTS.P1_TACTIC]: []
    }));

    return {
      players,
      troopDeck,
      tacticDeck,
      troopDiscard: [],
      tacticDiscard: [],
      tacticsField: { [PLAYER_IDS.P0]: [], [PLAYER_IDS.P1]: [] },
      scoutDrawCount: null,
      flags,
    };
  },

  moves: {
    drawCard,
    drawAndEndTurn,
    moveCard,
    claimFlag,
    shuffleDeck,
    endTurn
  },
};