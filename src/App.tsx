import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { BattleLine } from './Game';
import { BattleLineBoard } from './board/Board';
import type { GameState } from './types';

const App = Client<GameState>({
  game: BattleLine,
  board: BattleLineBoard,
  multiplayer: Local(),
});

export default App;