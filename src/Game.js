// src/Game.js
import { playCard } from './moves.js';

export const MyGame = {
  name: 'my-card-game',
  setup: () => ({
    // 初期状態
    hands: {},
    board: [],
  }),
  moves: {
    playCard,
  },
  turn: {
    minMoves: 1,
    maxMoves: 1,
  },
};
