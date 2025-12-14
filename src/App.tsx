import React from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
// @ts-ignore
import { MyGame } from './Game.js';
import type { GameState } from './types';
import type { BoardProps } from 'boardgame.io/react';

// 仮のボードコンポーネント
const BattleLineBoard = ({ G, ctx, moves, playerID }: BoardProps<GameState>) => {
  console.log('Rendering Board', { G, ctx, playerID });
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Battle Line (Debug)</h1>
      <p>Player ID: {playerID}</p>
      <p>Current Turn: {ctx.currentPlayer}</p>
      <div className="mt-4">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => moves.playCard('some-card-id')}
        >
          Play Card Action
        </button>
      </div>
      <pre className="mt-4 bg-gray-100 p-2 rounded">
        {JSON.stringify(G, null, 2)}
      </pre>
    </div>
  );
};

// クライアントの作成
const BattleLineClient = Client({
  game: MyGame,
  board: BattleLineBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true,
});

const App = () => {
  const playerID = new URLSearchParams(window.location.search).get('playerID') || '0';

  return (
    <div>
      <BattleLineClient playerID={playerID} />
    </div>
  );
};

export default App;