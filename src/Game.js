import {
  COLORS,
  TROOP_VALUES,
  TACTIC_IDS,
  CARD_TYPES,
  PLAYER_IDS,
  GAME_CONFIG,
  SLOTS,
  PHASES,
  MINIGAME_CONFIG
} from './constants.js';
import { ActivePlayers } from 'boardgame.io/dist/esm/core.js';
import {
  drawCard,
  drawAndEndTurn,
  moveCard,
  claimFlag,
  shuffleDeck,
  endTurn,
  sortHand,
  resolveDeserter,
  resolveTraitor,
  cancelGuileTactic,
  pickCard,
  chooseOrder
} from './moves.js';

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

  setup: ({ random }, setupData) => {
    // Validate room name if provided
    if (setupData?.roomName) {
      const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_]{1,8}$/;
      if (!IDENTIFIER_PATTERN.test(setupData.roomName)) {
        throw new Error('Invalid Room Name. Use 1-8 alphanumeric characters or underscores.');
      }
    }

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

    // Mini-game setup
    const minigameCards = random.Shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, MINIGAME_CONFIG.CARD_COUNT);

    return {
      players,
      troopDeck,
      tacticDeck,
      troopDiscard: [],
      tacticDiscard: [],
      tacticsField: { [PLAYER_IDS.P0]: [], [PLAYER_IDS.P1]: [] },
      scoutDrawCount: null,
      scoutReturnCount: null,
      activeGuileTactic: null,
      flags,
      minigame: {
        cards: minigameCards,
        picked: { [PLAYER_IDS.P0]: null, [PLAYER_IDS.P1]: null },
        winner: null,
      },
      startPlayer: null,
      playerNames: { [PLAYER_IDS.P0]: null, [PLAYER_IDS.P1]: null },
    };
  },

  phases: {
    [PHASES.DETERMINATION]: {
      start: true,
      turn: { activePlayers: ActivePlayers.ALL },
      moves: {
        pickCard: {
          move: pickCard,
          ignoreTurn: true
        },
        chooseOrder,
        setName: {
          move: ({ G, playerID }, name) => {
            G.playerNames[playerID] = name;
          },
          ignoreTurn: true
        }
      },
      next: PHASES.MAIN,
    },
    [PHASES.MAIN]: {
      moves: {
        drawCard,
        drawAndEndTurn,
        moveCard,
        claimFlag,
        shuffleDeck,
        endTurn,
        sortHand,
        resolveDeserter,
        resolveTraitor,
        cancelGuileTactic,
        setName: {
          move: ({ G, playerID }, name) => {
            G.playerNames[playerID] = name;
          },
          ignoreTurn: true
        }
      },
      turn: {
        order: {
          first: ({ G }) => Number(G.startPlayer || 0),
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        }
      }
    }
  }
};