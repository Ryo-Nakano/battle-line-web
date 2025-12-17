import { useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, Card as CardType, LocationInfo } from '../types';
import { Hand } from './Hand';
import { Zone } from './Zone';
import { Flag } from './Flag';
import { DiscardPile } from './DiscardPile';
import { DiscardModal } from './DiscardModal';
import { CardHelpModal } from './CardHelpModal';
import { DeckPile } from './DeckPile';

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
  const [discardModalType, setDiscardModalType] = useState<'troop' | 'tactic' | null>(null);
  const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);

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

  // 情報アイコンクリック時の処理
  const handleInfoClick = (card: CardType) => {
      setInfoModalCard(card);
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

  // デッキクリック時の処理（ドロー または 手札戻し）
  const handleDeckClick = (deckType: 'troop' | 'tactic') => {
      if (!isMyTurn || isSpectating) return;

      if (activeCard) {
          // 手札からデッキへ戻す (偵察など)
          // moveCard側で from.area === 'hand' チェックが行われる
          moves.moveCard({
              cardId: activeCard.card.id,
              from: activeCard.location,
              to: { area: 'deck', deckType }
          });
          setActiveCard(null);
      } else {
          // 通常ドロー
          moves.drawCard(deckType);
      }
  };

  // 捨て札クリック時の処理（確認 または 捨てる）
  const handleDiscardClick = (type: 'troop' | 'tactic') => {
      // 観戦者でも捨て札確認はできるべきだが、捨てる操作は自分のターンのみ
      if (activeCard) {
          if (!isMyTurn || isSpectating) return;
          moves.moveCard({
              cardId: activeCard.card.id,
              from: activeCard.location,
              to: { area: 'discard', deckType: type }
          });
          setActiveCard(null);
      } else {
          setDiscardModalType(type);
      }
  };

  // 手札エリアクリック時の処理（盤面から回収）
  const handleHandClick = () => {
       if (!isMyTurn || isSpectating || !activeCard) return;

       // 盤面のカードを手札に戻す
       if (activeCard.location.area === 'board') {
           moves.moveCard({
               cardId: activeCard.card.id,
               from: activeCard.location,
               to: { area: 'hand', playerId: myID } // 自分の手札に戻す
           });
           setActiveCard(null);
       }
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
                onInfoClick={handleInfoClick}
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
                                        onInfoClick={handleInfoClick}
                                     />
                                </div>

                                {/* 中央フラッグ & 戦術ゾーン */}
                                <div className="my-2 z-10 relative flex justify-center items-center">
                                    <Flag flag={flag} />
                                    
                                    {/* 戦術ゾーン (環境カード用) - フラッグの右側に配置 */}
                                    <div className="absolute left-full ml-1 h-12 w-10 z-20">
                                        <Zone
                                            id={`flag-${i}-tactic_zone`}
                                            cards={flag.tactic_zone}
                                            type="slot"
                                            className="h-full w-full border-slate-600/30 scale-75 origin-left"
                                            isInteractable={!isSpectating}
                                            activeCardId={activeCard?.card.id}
                                            onCardClick={handleCardClick}
                                            onInfoClick={handleInfoClick}
                                            onZoneClick={handleZoneClick}
                                        />
                                    </div>
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
                                        onInfoClick={handleInfoClick}
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
                <div className="flex items-center gap-4">
                     <div className="flex gap-4 mr-2">
                         <DeckPile 
                            count={G.troopDeck.length}
                            type="troop"
                            onClick={() => handleDeckClick('troop')}
                            isDisabled={(!activeCard && G.troopDeck.length === 0) || ctx.currentPlayer !== myID || (activeCard !== null && activeCard.card.type !== 'troop')}
                            isReturnTarget={activeCard !== null && activeCard.card.type === 'troop'}
                         />
                         <DeckPile 
                            count={G.tacticDeck.length}
                            type="tactic"
                            onClick={() => handleDeckClick('tactic')}
                            isDisabled={(!activeCard && G.tacticDeck.length === 0) || ctx.currentPlayer !== myID || (activeCard !== null && activeCard.card.type !== 'tactic')}
                            isReturnTarget={activeCard !== null && activeCard.card.type === 'tactic'}
                         />
                     </div>

                     {/* 捨て札 (部隊・戦術 分割) */}
                     <div className="flex gap-2 border-l border-slate-700 pl-4 ml-2">
                         <DiscardPile 
                            cards={G.troopDiscard} 
                            onClick={() => handleDiscardClick('troop')} 
                            label="Troop Discard"
                            className={activeCard?.card.type === 'troop' ? 'ring-2 ring-red-500 rounded-lg' : ''}
                         />
                         <DiscardPile 
                            cards={G.tacticDiscard} 
                            onClick={() => handleDiscardClick('tactic')} 
                            label="Tactic Discard"
                            className={activeCard?.card.type === 'tactic' ? 'ring-2 ring-red-500 rounded-lg' : ''}
                         />
                     </div>
                </div>
            </div>

            {/* 自分の手札: 操作可能 */}
            <Hand 
                cards={G.players[myID].hand} 
                playerId={myID} 
                isCurrentPlayer={!isSpectating}
                activeCardId={activeCard?.card.id}
                onCardClick={handleCardClick}
                onInfoClick={handleInfoClick}
                onHandClick={handleHandClick}
            />
        </div>

        {/* 捨て札モーダル */}
        <DiscardModal 
            isOpen={discardModalType !== null} 
            onClose={() => setDiscardModalType(null)} 
            cards={discardModalType === 'troop' ? G.troopDiscard : G.tacticDiscard || []} 
        />

        {/* カード効果説明モーダル */}
        <CardHelpModal
            isOpen={infoModalCard !== null}
            onClose={() => setInfoModalCard(null)}
            card={infoModalCard}
        />

    </div>
  );
};