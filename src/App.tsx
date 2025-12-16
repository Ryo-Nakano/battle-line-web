import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { BattleLine } from './Game';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState } from './types';

const BattleLineBoard = ({ G, ctx, moves, playerID }: BoardProps<GameState>) => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Battle Line</h1>
      <p>Player: {playerID}</p>
      <div className="mt-4 p-4 border rounded bg-gray-100">
        Board Component Placeholder (Step 5)
      </div>
    </div>
  );
};

const App = Client({
  game: BattleLine,
  board: BattleLineBoard,
  multiplayer: Local(),
  debug: { collapsed: true },
});

export default App;