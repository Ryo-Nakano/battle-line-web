import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { BattleLine } from './Game';
import { BattleLineBoard } from './board/Board';
import type { GameState } from './types';

const { protocol, hostname } = window.location;
const server = import.meta.env.VITE_SERVER_URL || `${protocol}//${hostname}:8000`;

const App = Client<GameState>({
  game: BattleLine,
  board: BattleLineBoard,
  multiplayer: SocketIO({ server }),
  debug: true,
});

export default App;