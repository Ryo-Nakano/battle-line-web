import type { Card as CardType, LocationInfo } from '../types';
import { Zone } from './Zone';
import { cn } from '../utils';
import { ArrowUpDown } from 'lucide-react';

interface HandProps {
    cards: CardType[];
    playerId: string;
    isCurrentPlayer: boolean;
    activeCardId?: string;
    onCardClick?: (card: CardType, location?: LocationInfo) => void;
    onInfoClick?: (card: CardType) => void;
    onHandClick?: (location: LocationInfo) => void;
    onSort?: () => void;
    className?: string;
}

export function Hand({ cards, playerId, isCurrentPlayer, activeCardId, onCardClick, onInfoClick, onHandClick, onSort, className }: HandProps) {
    // Transform cards to face down if not current player
    const displayCards = cards.map(c => ({
        ...c,
        faceDown: !isCurrentPlayer ? true : c.faceDown
    }));

    return (
        <div className={cn("relative w-full", className)}>
            {isCurrentPlayer && onSort && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSort();
                    }}
                    className="absolute -top-3 right-4 z-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-700 shadow-md transition-colors"
                    title="Sort Hand"
                >
                    <ArrowUpDown size={14} />
                </button>
            )}
            <Zone
                id={`hand-${playerId}`}
                cards={displayCards}
                type="hand"
                isInteractable={isCurrentPlayer}
                activeCardId={activeCardId}
                onCardClick={onCardClick}
                onInfoClick={onInfoClick}
                onZoneClick={onHandClick}
                orientation="horizontal"
                className={cn(
                    "w-full overflow-x-auto min-h-[100px] sm:min-h-[120px] justify-start sm:justify-center items-center pb-2 gap-1 sm:gap-2 px-2",
                    "border-none bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl"
                )}
            />
        </div>
    );
}