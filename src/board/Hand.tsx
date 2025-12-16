import type { Card as CardType, LocationInfo } from '../types';
import { Zone } from './Zone';
import { cn } from '../utils';

interface HandProps {
  cards: CardType[];
  playerId: string;
  isCurrentPlayer: boolean;
  activeCardId?: string;
  onCardClick?: (card: CardType, location?: LocationInfo) => void;
  className?: string;
}

export function Hand({ cards, playerId, isCurrentPlayer, activeCardId, onCardClick, className }: HandProps) {
    // Transform cards to face down if not current player
    const displayCards = cards.map(c => ({
        ...c,
        faceDown: !isCurrentPlayer ? true : c.faceDown
    }));

    return (
        <Zone
            id={`hand-${playerId}`}
            cards={displayCards}
            type="hand"
            isInteractable={isCurrentPlayer}
            activeCardId={activeCardId}
            onCardClick={onCardClick}
            orientation="horizontal"
            className={cn(
                "w-full overflow-x-auto min-h-[120px] justify-center items-center pb-2 gap-2",
                "border-none bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner", 
                className
            )}
        />
    );
}