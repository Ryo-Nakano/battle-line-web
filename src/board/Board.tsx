import { useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, Card as CardType, LocationInfo } from '../types';
import { Hand } from './Hand';
import { Zone } from './Zone';
import { Flag } from './Flag';

interface BattleLineBoardProps extends BoardProps<GameState> {
  // 追加のPropsが必要な場合はここに定義
}

type ActiveCardState = {
  card: CardType;
  location: LocationInfo;
} | null;

export const BattleLineBoard = ({ G, ctx, moves, playerID }: BattleLineBoardProps) => {
  // 選択中のカード情報を保持するステート
  const [activeCard, setActiveCard] = useState<ActiveCardState>(null);

  // プレイヤーIDの解決
  const currentPlayerID = playerID || '0';
  const isSpectating = playerID === null;

  // 視点の決定: Player 1 なら盤面を反転（相手=0, 自分=1）
  const isInverted = currentPlayerID === '1';
  const opponentID = isInverted ? '0' : '1';
  const myID = isInverted ? '1' : '0';

  const isMyTurn = ctx.currentPlayer === myID;

  // カードクリック時の処理（選択/解除）
  const handleCardClick = (card: CardType, location?: LocationInfo) => {
    if (!isMyTurn || isSpectating) return;
    if (!location) return; // 場所不明なカードは操作不可

    // 既に選択中のカードをクリックした場合 -> 選択解除
    if (activeCard && activeCard.card.id === card.id) {
      setActiveCard(null);
      return;
    }

    // 新しいカードを選択
    setActiveCard({ card, location });
  };

  // ゾーンクリック時の処理（移動実行）
  const handleZoneClick = (toLocation: LocationInfo) => {
    if (!isMyTurn || isSpectating) return;
    if (!activeCard) return; // カード未選択なら何もしない

    // 移動実行
    // バリデーションは moves.js 側で行われるが、ここでも基本的なチェックは可能
    if (activeCard.location.area === 'board' && activeCard.location.flagIndex === toLocation.flagIndex && activeCard.location.slotType === toLocation.slotType) {
        // 同じ場所への移動は無視
        return;
    }

    moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: toLocation
    });

    // 移動後は選択解除
    setActiveCard(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-800 text-slate-100 p-2 sm:p-4 gap-4 select-none">
        
        {/* ■ 上部エリア: 相手プレイヤー (Opponent) */}
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4">
                <h2 className="text-lg font-bold text-slate-400">
                    Player {opponentID} {opponentID === ctx.currentPlayer ? '(Thinking...)' : ''}
                </h2>
                <div className="text-xs text-slate-500">
                    Hand: {G.players[opponentID].hand.length}
                </div>
            </div>
            {/* 相手の手札: 操作不可 */}
            <Hand 
                cards={G.players[opponentID].hand} 
                playerId={opponentID} 
                isCurrentPlayer={false} 
            />
        </div>

        {/* ■ 中央エリア: 戦場 (Battle Line) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="min-w-[800px] flex justify-center h-full items-center">
                {/* 9列のグリッド */}
                <div className="grid grid-cols-9 gap-1 sm:gap-2 h-full w-full max-w-7xl">
                    {G.flags.map((flag, i) => {
                        // スロットのマッピング
                        const topSlotsKey = isInverted ? 'p0_slots' : 'p1_slots';
                        const bottomSlotsKey = isInverted ? 'p1_slots' : 'p0_slots';
                        
                        const topCards = isInverted ? flag.p0_slots : flag.p1_slots;
                        const bottomCards = isInverted ? flag.p1_slots : flag.p0_slots;

                        return (
                            <div key={flag.id} className="flex flex-col h-full items-center justify-center relative group">
                                {/* 上側スロット (相手): 操作不可 */}
                                <div className="flex-1 w-full flex flex-col justify-end pb-2">
                                     <Zone 
                                        id={`flag-${i}-${topSlotsKey}`}
                                        cards={topCards}
                                        type="slot"
                                        className="h-full justify-end border-slate-700/50" 
                                        isInteractable={false}
                                     />
                                </div>

                                {/* 中央フラッグ */}
                                <div className="my-2 z-10">
                                    <Flag flag={flag} />
                                </div>

                                {/* 下側スロット (自分): 操作可能 */}
                                <div className="flex-1 w-full flex flex-col justify-start pt-2">
                                     <Zone 
                                        id={`flag-${i}-${bottomSlotsKey}`}
                                        cards={bottomCards}
                                        type="slot"
                                        className="h-full justify-start border-slate-700/50" 
                                        isInteractable={!isSpectating} // 観戦者でなければ操作可能
                                        activeCardId={activeCard?.card.id}
                                        onCardClick={handleCardClick}
                                        onZoneClick={handleZoneClick}
                                     />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* ■ 下部エリア: 自分 (Me) */}
        <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-bold text-blue-400">
                    You (Player {myID}) {myID === ctx.currentPlayer ? ' - YOUR TURN' : ''}
                </h2>
                <div className="flex gap-2">
                     {/* デッキドローボタン */}
                     <button 
                        className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-xs border border-green-500 transition-colors"
                        onClick={() => moves.drawCard('troop')}
                        disabled={G.troopDeck.length === 0 || ctx.currentPlayer !== myID}
                     >
                        Troop ({G.troopDeck.length})
                     </button>
                     <button 
                        className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-xs border border-gray-400 transition-colors"
                        onClick={() => moves.drawCard('tactic')}
                        disabled={G.tacticDeck.length === 0 || ctx.currentPlayer !== myID}
                     >
                        Tactic ({G.tacticDeck.length})
                     </button>
                </div>
            </div>

            {/* 自分の手札: 操作可能 */}
            <Hand 
                cards={G.players[myID].hand} 
                playerId={myID} 
                isCurrentPlayer={!isSpectating}
                activeCardId={activeCard?.card.id}
                onCardClick={handleCardClick}
            />
        </div>

    </div>
  );
};