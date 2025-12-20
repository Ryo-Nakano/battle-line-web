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
import { ConfirmModal } from './ConfirmModal';
import { Sword, Shield, Info, CheckCircle2, Menu } from 'lucide-react';
import { cn } from '../utils';
import { isEnvironmentTactic } from '../constants/tactics';

interface BattleLineBoardProps extends BoardProps<GameState> {
}

type ActiveCardState = {
  card: CardType;
  location: LocationInfo;
} | null;

export const BattleLineBoard = ({ G, ctx, moves, playerID }: BattleLineBoardProps) => {
  const [activeCard, setActiveCard] = useState<ActiveCardState>(null);
  const [discardModalType, setDiscardModalType] = useState<'troop' | 'tactic' | null>(null);
  const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);
  const [pendingFlagIndex, setPendingFlagIndex] = useState<number | null>(null);

  const currentPlayerID = playerID || '0';
  const isSpectating = playerID === null;
  const isInverted = currentPlayerID === '1';
  const opponentID = isInverted ? '0' : '1';
  const myID = isInverted ? '1' : '0';
  const isMyTurn = ctx.currentPlayer === myID;

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
    if (activeCard.location.area === 'board' && activeCard.location.flagIndex === toLocation.flagIndex && activeCard.location.slotType === toLocation.slotType) return;

    moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: toLocation
    });
    setActiveCard(null);
  };

  const handleDeckClick = (deckType: 'troop' | 'tactic') => {
      if (!isMyTurn || isSpectating) return;
      if (activeCard) {
          moves.moveCard({
              cardId: activeCard.card.id,
              from: activeCard.location,
              to: { area: 'deck', deckType }
          });
          setActiveCard(null);
      } else {
          moves.drawCard(deckType);
      }
  };

  const handleDiscardClick = (type: 'troop' | 'tactic') => {
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

  const handleHandClick = () => {
       if (!isMyTurn || isSpectating || !activeCard) return;
       if (activeCard.location.area === 'board') {
           moves.moveCard({
               cardId: activeCard.card.id,
               from: activeCard.location,
               to: { area: 'hand', playerId: myID }
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
                    <div className={cn("w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center shadow-inner", opponentID === '0' ? 'bg-red-700' : 'bg-blue-700')}>
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
                
                {/* 簡易的な相手の手札表示 (枚数のみ) */}
                <div className="flex -space-x-2 opacity-70">
                    {G.players[opponentID].hand.map((_, i) => (
                        <div key={i} className="w-8 h-12 bg-zinc-800 border border-zinc-600 rounded-sm shadow-sm" />
                    ))}
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
                        const topSlotsKey = isInverted ? 'p0_slots' : 'p1_slots';
                        const bottomSlotsKey = isInverted ? 'p1_slots' : 'p0_slots';
                        const topTacticSlotsKey = isInverted ? 'p0_tactic_slots' : 'p1_tactic_slots';
                        const bottomTacticSlotsKey = isInverted ? 'p1_tactic_slots' : 'p0_tactic_slots';
                        
                        const topCards = isInverted ? flag.p0_slots : flag.p1_slots;
                        const bottomCards = isInverted ? flag.p1_slots : flag.p0_slots;
                        const topTacticCards = isInverted ? flag.p0_tactic_slots : flag.p1_tactic_slots;
                        const bottomTacticCards = isInverted ? flag.p1_tactic_slots : flag.p0_tactic_slots;

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
                                            (activeCard.card.type === 'troop' || (activeCard.card.type === 'tactic' && !isEnvironmentTactic(activeCard.card.name)))}
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
                                            activeCard.card.type === 'tactic' && isEnvironmentTactic(activeCard.card.name)}
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
                            type="troop"
                            onClick={() => handleDeckClick('troop')}
                            isDisabled={(!activeCard && G.troopDeck.length === 0) || !isMyTurn || (activeCard !== null && activeCard.card.type !== 'troop')}
                            isReturnTarget={activeCard?.card.type === 'troop'}
                        />
                        <DeckPile 
                            count={G.tacticDeck.length}
                            type="tactic"
                            onClick={() => handleDeckClick('tactic')}
                            isDisabled={(!activeCard && G.tacticDeck.length === 0) || !isMyTurn || (activeCard !== null && activeCard.card.type !== 'tactic')}
                            isReturnTarget={activeCard?.card.type === 'tactic'}
                        />
                    </div>

                    <div className="h-16 w-[1px] bg-zinc-700"></div>

                    <div className="flex gap-2">
                        <DiscardPile 
                            cards={G.troopDiscard} 
                            onClick={() => handleDiscardClick('troop')} 
                            label="Troop"
                            className={activeCard?.card.type === 'troop' ? 'ring-2 ring-red-500' : ''}
                        />
                        <DiscardPile 
                            cards={G.tacticDiscard} 
                            onClick={() => handleDiscardClick('tactic')} 
                            label="Tactic"
                            className={activeCard?.card.type === 'tactic' ? 'ring-2 ring-red-500' : ''}
                        />
                    </div>
                </div>

                {/* Center: Hand */}
                <div className="flex-1 flex justify-center pb-2">
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
                        onClick={() => isMyTurn && moves.endTurn()}
                        disabled={!isMyTurn}
                    >
                        <CheckCircle2 size={20} />
                        END TURN
                    </button>
                    
                    <div className="bg-zinc-800/90 p-3 rounded-lg border border-zinc-700 flex items-center gap-3 w-48 shadow-lg">
                        <div className={cn("w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center", myID === '0' ? 'bg-red-600' : 'bg-blue-600')}>
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
            cards={discardModalType === 'troop' ? G.troopDiscard : G.tacticDiscard || []} 
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
            title="Confirm Claim"
            message="Secure this flag? Once claimed, it cannot be undone."
        />

        {/* Background Grid Decoration */}
        <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>
  );
};