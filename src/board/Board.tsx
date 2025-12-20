import { useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, Card as CardType, LocationInfo } from '../types';
import { Hand } from './Hand';
import { Zone } from './Zone';
import { Flag } from './Flag';
import { Card } from './Card';
import { DiscardPile } from './DiscardPile';
import { DiscardModal } from './DiscardModal';
import { CardHelpModal } from './CardHelpModal';
import { DeckPile } from './DeckPile';
import { ConfirmModal } from './ConfirmModal';
import { DrawSelectionModal } from './DrawSelectionModal';
import { Sword, Shield, Info, CheckCircle2, Menu } from 'lucide-react';
import { cn } from '../utils';
import { isEnvironmentTactic } from '../constants/tactics';
import { 
  PLAYER_IDS, 
  CARD_TYPES, 
  DECK_TYPES, 
  AREAS, 
  SLOTS, 
  GAME_CONFIG, 
  TACTIC_IDS 
} from '../constants';

interface BattleLineBoardProps extends BoardProps<GameState> {
}

type ActiveCardState = {
  card: CardType;
  location: LocationInfo;
} | null;

export const BattleLineBoard = ({ G, ctx, moves, playerID }: BattleLineBoardProps) => {
  const [activeCard, setActiveCard] = useState<ActiveCardState>(null);
  const [discardModalType, setDiscardModalType] = useState<typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC | null>(null);
  const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);
  const [pendingFlagIndex, setPendingFlagIndex] = useState<number | null>(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  const currentPlayerID = playerID || PLAYER_IDS.P0;
  const isSpectating = playerID === null;
  const isInverted = currentPlayerID === PLAYER_IDS.P1;
  const opponentID = isInverted ? PLAYER_IDS.P0 : PLAYER_IDS.P1;
  const myID = isInverted ? PLAYER_IDS.P1 : PLAYER_IDS.P0;
  const isMyTurn = ctx.currentPlayer === myID;
  const isScoutMode = G.scoutDrawCount !== null;

  // Helper to check if card is a Guile tactic
  const isGuileTactic = (card: CardType) => {
      if (card.type !== CARD_TYPES.TACTIC || !card.name) return false;
      const key = card.name; // card.name should match TACTIC_IDS values (Capitalized)
      // We can use isEnvironmentTactic logic but for Guile, or just lookup in constants if possible
      // But TACTICS_DATA is not imported here. Let's rely on TACTIC_CATEGORIES.
      // We need to import TACTICS_DATA? Or just hardcode the check since we have TACTIC_IDS?
      // Since we didn't export TACTICS_DATA from constants.js (it's in tactics.js), we can check names.
      const guileNames: string[] = [TACTIC_IDS.SCOUT, TACTIC_IDS.REDEPLOY, TACTIC_IDS.DESERTER, TACTIC_IDS.TRAITOR];
      return guileNames.includes(key);
  };

  const handleCardClick = (card: CardType, location?: LocationInfo) => {
    if (!isMyTurn || isSpectating || !location) return;
    if (activeCard && activeCard.card.id === card.id) {
      setActiveCard(null);
      return;
    }
    setActiveCard({ card, location });
  };

  const handleInfoClick = (card: CardType) => setInfoModalCard(card);

  const handleZoneClick = (toLocation: LocationInfo) => {
    if (!isMyTurn || isSpectating || !activeCard) return;
    if (activeCard.location.area === AREAS.BOARD && activeCard.location.flagIndex === toLocation.flagIndex && activeCard.location.slotType === toLocation.slotType) return;

    moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: toLocation
    });
    setActiveCard(null);
  };

  const handleTacticsFieldClick = (pid: string) => {
      if (!isMyTurn || isSpectating || !activeCard) return;
      if (pid !== myID) return; // 自分のフィールドのみ

      // 手札からのみ移動可能
      if (activeCard.location.area !== AREAS.HAND) return;

      // 謀略戦術のみ
      if (!isGuileTactic(activeCard.card)) return;

      moves.moveCard({
          cardId: activeCard.card.id,
          from: activeCard.location,
          to: { area: AREAS.FIELD, playerId: pid }
      });
      setActiveCard(null);
  };

  const handleDeckClick = (deckType: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => {
      if (!isMyTurn || isSpectating) return;
      
      // スカウトモード中以外はクリック無効
      if (!isScoutMode) return;

      if (activeCard) {
          // カードを手札からデッキに戻す処理 (スカウトの戻し処理)
          moves.moveCard({
              cardId: activeCard.card.id,
              from: activeCard.location,
              to: { area: AREAS.DECK, deckType }
          });
          setActiveCard(null);
      } else {
          // スカウト中の追加ドロー
          moves.drawCard(deckType);
      }
  };

  const handleDiscardClick = (type: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => {
      if (activeCard) {
          if (!isMyTurn || isSpectating) return;
          moves.moveCard({
              cardId: activeCard.card.id,
              from: activeCard.location,
              to: { area: AREAS.DISCARD, deckType: type }
          });
          setActiveCard(null);
      } else {
          setDiscardModalType(type);
      }
  };

  const handleHandClick = () => {
       if (!isMyTurn || isSpectating || !activeCard) return;
       if (activeCard.location.area === AREAS.BOARD) {
           moves.moveCard({
               cardId: activeCard.card.id,
               from: activeCard.location,
               to: { area: AREAS.HAND, playerId: myID }
           });
           setActiveCard(null);
       }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
        
        {/* ■ HEADER: Opponent Area */}
        <header className="flex-none flex justify-between items-start p-4 z-10">
            <div className="flex gap-4 items-center">
                <div className="bg-zinc-800/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-700 flex items-center gap-3 shadow-lg">
                    <div className={cn("w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center shadow-inner", opponentID === PLAYER_IDS.P0 ? 'bg-red-700' : 'bg-blue-700')}>
                        <Sword size={20} className="text-white/80" />
                    </div>
                    <div>
                        <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Opponent</div>
                        <div className="font-bold text-sm flex items-center gap-2">
                            Player {opponentID}
                            {opponentID === ctx.currentPlayer && <span className="text-amber-500 animate-pulse text-xs">Thinking...</span>}
                        </div>
                    </div>
                </div>
                
                {/* 相手の手札表示 (Cardコンポーネントを使用) */}
                <div className="flex -space-x-8 opacity-90 h-24 items-start">
                    {G.players[opponentID].hand.map((card, i) => (
                        <div key={i} className="transform scale-75 origin-top-left transition-transform hover:scale-90 hover:z-10">
                            <Card 
                                card={{ ...card, faceDown: true }} 
                                isInteractable={false}
                                className="shadow-lg"
                            />
                        </div>
                    ))}
                </div>

                {/* 相手のTactics Field */}
                <div className="ml-4 flex flex-col gap-1 opacity-80">
                    <div className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase text-center">Active Tactics</div>
                    <Zone 
                        id={`field-${opponentID}`}
                        cards={G.tacticsField[opponentID]}
                        type="slot"
                        className="h-24 min-h-[90px] w-32 border border-zinc-700/50 bg-black/20 rounded-lg justify-center"
                        orientation="horizontal"
                        isInteractable={false}
                        onInfoClick={handleInfoClick}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                <div className={cn("flex items-center gap-2 text-sm font-medium transition-colors", isMyTurn ? "text-amber-500" : "text-zinc-500")}>
                    <Info size={16} />
                    <span>{isMyTurn ? "YOUR TURN" : "WAITING..."}</span>
                </div>
                <div className="h-4 w-[1px] bg-zinc-700"></div>
                <button className="text-zinc-400 hover:text-white transition-colors">
                    <Menu size={20} />
                </button>
            </div>
        </header>

        {/* ■ MAIN: Battlefield Area */}
        <main className="flex-1 flex items-center justify-center overflow-auto custom-scrollbar py-4">
            <div className="flex justify-center items-center px-8 min-w-max">
                <div className="grid grid-cols-9 gap-2 sm:gap-4">
                    {G.flags.map((flag, i) => {
                        const topSlotsKey = isInverted ? SLOTS.P0 : SLOTS.P1;
                        const bottomSlotsKey = isInverted ? SLOTS.P1 : SLOTS.P0;
                        const topTacticSlotsKey = isInverted ? SLOTS.P0_TACTIC : SLOTS.P1_TACTIC;
                        const bottomTacticSlotsKey = isInverted ? SLOTS.P1_TACTIC : SLOTS.P0_TACTIC;
                        
                        const topCards = isInverted ? flag[SLOTS.P0] : flag[SLOTS.P1];
                        const bottomCards = isInverted ? flag[SLOTS.P1] : flag[SLOTS.P0];
                        const topTacticCards = isInverted ? flag[SLOTS.P0_TACTIC] : flag[SLOTS.P1_TACTIC];
                        const bottomTacticCards = isInverted ? flag[SLOTS.P1_TACTIC] : flag[SLOTS.P0_TACTIC];

                        return (
                            <div key={flag.id} className="flex flex-col items-center justify-center relative group h-[500px]">
                                {/* Top Area (Opponent) */}
                                <div className="flex-1 w-full flex flex-col justify-end pb-4 gap-2">
                                     {/* Tactic Slot (Opponent) */}
                                     <Zone 
                                        id={`flag-${i}-${topTacticSlotsKey}`}
                                        cards={topTacticCards}
                                        type="slot"
                                        className="h-24 min-h-[60px] justify-end border-none bg-transparent scale-90 opacity-70" 
                                        isInteractable={false}
                                        onInfoClick={handleInfoClick}
                                     />
                                     {/* Troop Slot (Opponent) */}
                                     <Zone 
                                        id={`flag-${i}-${topSlotsKey}`}
                                        cards={topCards}
                                        type="slot"
                                        className="h-full justify-end border-none bg-transparent" 
                                        isInteractable={false}
                                        onInfoClick={handleInfoClick}
                                     />
                                </div>

                                {/* Center Flag Line */}
                                <div className="my-2 z-10 relative flex justify-center items-center h-16 w-full">
                                    <div className="absolute w-full h-[1px] bg-zinc-800 -z-10"></div>
                                    <Flag 
                                        flag={flag} 
                                        myID={myID}
                                        onClaim={(id) => {
                                            const index = parseInt(id.split('-')[1], 10);
                                            if (flag.owner !== null) return;
                                            if (isMyTurn && !isSpectating) setPendingFlagIndex(index);
                                        }}
                                    />
                                </div>

                                {/* Bottom Area (Player) */}
                                <div className="flex-1 w-full flex flex-col justify-start pt-4 gap-2">
                                     {/* Troop Slot (Player) */}
                                     <Zone 
                                        id={`flag-${i}-${bottomSlotsKey}`}
                                        cards={bottomCards}
                                        type="slot"
                                        className="h-full justify-start bg-transparent" 
                                        isInteractable={!isSpectating && flag.owner === null}
                                        activeCardId={activeCard?.card.id}
                                        isTargeted={!!activeCard && !isSpectating && flag.owner === null && 
                                            (activeCard.card.type === CARD_TYPES.TROOP || (activeCard.card.type === CARD_TYPES.TACTIC && !isEnvironmentTactic(activeCard.card.name) && !isGuileTactic(activeCard.card)))}
                                        onCardClick={handleCardClick}
                                        onInfoClick={handleInfoClick}
                                        onZoneClick={handleZoneClick}
                                     />
                                     {/* Tactic Slot (Player) */}
                                     <Zone 
                                        id={`flag-${i}-${bottomTacticSlotsKey}`}
                                        cards={bottomTacticCards}
                                        type="slot"
                                        className="h-24 min-h-[60px] justify-start bg-transparent scale-90" 
                                        isInteractable={!isSpectating && flag.owner === null}
                                        activeCardId={activeCard?.card.id}
                                        isTargeted={!!activeCard && !isSpectating && flag.owner === null && 
                                            activeCard.card.type === CARD_TYPES.TACTIC && isEnvironmentTactic(activeCard.card.name)}
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
        </main>

        {/* ■ FOOTER: Player Area */}
        <footer className="flex-none p-4 pb-6 z-20 bg-gradient-to-t from-black via-zinc-900 to-transparent">
            <div className="max-w-7xl mx-auto flex items-end justify-between gap-8">
                
                {/* Left: Decks & Discard */}
                <div className="flex gap-6 items-end">
                    <div className="flex gap-4">
                        <DeckPile 
                            count={G.troopDeck.length}
                            type={DECK_TYPES.TROOP}
                            onClick={() => handleDeckClick(DECK_TYPES.TROOP)}
                            isDisabled={!isMyTurn || !isScoutMode}
                        />
                        <DeckPile 
                            count={G.tacticDeck.length}
                            type={DECK_TYPES.TACTIC}
                            onClick={() => handleDeckClick(DECK_TYPES.TACTIC)}
                            isDisabled={!isMyTurn || !isScoutMode}
                        />
                    </div>

                    <div className="h-16 w-[1px] bg-zinc-700"></div>

                    <div className="flex gap-2">
                        <DiscardPile 
                            cards={G.troopDiscard} 
                            onClick={() => handleDiscardClick(DECK_TYPES.TROOP)} 
                            label="Troop"
                        />
                        <DiscardPile 
                            cards={G.tacticDiscard} 
                            onClick={() => handleDiscardClick(DECK_TYPES.TACTIC)} 
                            label="Tactic"
                        />
                    </div>
                </div>

                {/* Center: Hand & Tactics Field */}
                <div className="flex-1 flex flex-col items-center justify-end pb-2 gap-2 relative">
                    {/* Scout Guide Message */}
                     {G.scoutDrawCount !== null && (
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] z-50 animate-bounce font-bold border-2 border-amber-400 whitespace-nowrap pointer-events-none flex items-center gap-2">
                            <Info size={18} />
                            <span>SCOUT ACTIVE: Draw {GAME_CONFIG.SCOUT_DRAW_LIMIT - G.scoutDrawCount} more card(s)!</span>
                        </div>
                     )}

                    {/* Tactics Field */}
                    <div className="flex items-center gap-2 transition-all duration-300">
                        <div className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Active Tactics</div>
                        <Zone 
                            id={`field-${myID}`}
                            cards={G.tacticsField[myID]}
                            type="slot"
                            className={cn(
                                "h-24 min-h-[90px] w-full min-w-[120px] max-w-xs border rounded-xl px-4 shadow-inner transition-colors",
                                activeCard?.location.area === AREAS.HAND && isGuileTactic(activeCard.card) 
                                    ? "border-amber-500/50 bg-amber-500/10" 
                                    : "border-zinc-700/50 bg-black/40"
                            )}
                            orientation="horizontal"
                            isInteractable={!isSpectating && activeCard?.location.area === AREAS.HAND && isGuileTactic(activeCard.card)}
                            isTargeted={!!activeCard && activeCard.location.area === AREAS.HAND && isGuileTactic(activeCard.card)}
                            onZoneClick={() => handleTacticsFieldClick(myID)}
                            onInfoClick={handleInfoClick}
                        />
                    </div>

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

                {/* Right: Actions & Status */}
                <div className="flex flex-col gap-4 items-end">
                    <button 
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95",
                            isMyTurn 
                                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20" 
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                        )}
                        onClick={() => isMyTurn && setIsDrawModalOpen(true)}
                        disabled={!isMyTurn}
                    >
                        <CheckCircle2 size={20} />
                        END TURN
                    </button>
                    
                    <div className="bg-zinc-800/90 p-3 rounded-lg border border-zinc-700 flex items-center gap-3 w-48 shadow-lg">
                        <div className={cn("w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center", myID === PLAYER_IDS.P0 ? 'bg-red-600' : 'bg-blue-600')}>
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="text-[10px] text-zinc-400 font-bold tracking-widest">YOU</div>
                            <div className="font-bold">Commander</div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>

        {/* Modals */}
        <DiscardModal 
            isOpen={discardModalType !== null} 
            onClose={() => setDiscardModalType(null)} 
            cards={discardModalType === DECK_TYPES.TROOP ? G.troopDiscard : G.tacticDiscard || []} 
        />
        <CardHelpModal
            isOpen={infoModalCard !== null}
            onClose={() => setInfoModalCard(null)}
            card={infoModalCard}
        />
        <ConfirmModal
            isOpen={pendingFlagIndex !== null}
            onClose={() => setPendingFlagIndex(null)}
            onConfirm={() => {
                if (pendingFlagIndex !== null) {
                    moves.claimFlag(pendingFlagIndex);
                    setPendingFlagIndex(null);
                }
            }}
            title="フラッグ確保の確認"
            message="このフラッグを確保しますか？確保後は取り消すことができません。"
        />
        <DrawSelectionModal
            isOpen={isDrawModalOpen}
            onClose={() => setIsDrawModalOpen(false)}
            onSelect={(type) => {
                moves.drawAndEndTurn(type);
                setIsDrawModalOpen(false);
            }}
            troopCount={G.troopDeck.length}
            tacticCount={G.tacticDeck.length}
        />

        {/* Background Grid Decoration */}
        <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>
  );
};
