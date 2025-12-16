import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
// @ts-expect-error Game.js is not typed
import { BattleLine } from './Game.js';
import type { GameState } from './types';
import type { BoardProps } from 'boardgame.io/react';

// 仮のボードコンポーネント
const BattleLineBoard = ({ G, ctx, moves, playerID }: BoardProps<GameState>) => {
  console.log('Rendering Board', { G, ctx, playerID });
  
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag ended', event);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Battle Line (Tailwind & DnD Active)</h1>
        <p>Player ID: {playerID}</p>
        <p>Current Turn: {ctx.currentPlayer}</p>
        <div className="mt-4 space-x-2">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => moves.drawCard('troop')}
          >
            Draw Troop
          </button>
          
          <button 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              const myHand = G.players[playerID || '0'].hand;
              if (myHand.length > 0) {
                moves.moveCard({
                  cardId: myHand[0].id,
                  from: { area: 'hand', playerId: playerID || '0' },
                  to: { area: 'board', flagIndex: 0, slotType: 'p0_slots' }
                });
              } else {
                alert('No cards in hand to move!');
              }
            }}
          >
            Move Hand[0] to Flag 0
          </button>

          <button 
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => moves.claimFlag(0)}
          >
            Toggle Flag 0
          </button>
        </div>
        <pre className="mt-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(G, null, 2)}
        </pre>
      </div>
    </DndContext>
  );
};

// クライアントの作成
const BattleLineClient = Client({
  game: BattleLine,
  board: BattleLineBoard,
  multiplayer: Local(),
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