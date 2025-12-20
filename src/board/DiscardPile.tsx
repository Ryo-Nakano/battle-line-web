import type { Card as CardType } from '../types';
import { Card } from './Card';
import { cn } from '../utils';

interface DiscardPileProps {
  cards: CardType[];
  onClick: () => void;
  className?: string;
  label?: string;
  isTargeted?: boolean;
}

export const DiscardPile = ({ cards, onClick, className = '', label = 'Discard', isTargeted = false }: DiscardPileProps) => {
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

  return (
    <div 
      className={cn("relative flex flex-col items-center gap-1", className)}
      onClick={onClick}
    >
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        {label} <span className="text-zinc-600">({cards.length})</span>
      </div>
      
      <div className={cn(
          "relative w-16 h-24 sm:w-20 sm:h-28 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center bg-zinc-800/30 hover:bg-zinc-700/50 hover:ring-2 hover:ring-red-500/50 transition-all cursor-pointer group",
          isTargeted && "ring-4 ring-red-500 bg-red-500/10 border-solid border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
      )}>
        {topCard ? (
          <div className="absolute inset-0 transform group-hover:scale-105 transition-transform">
             <Card card={topCard} isSelected={false} className="shadow-lg" />
          </div>
        ) : (
          <span className="text-zinc-600 text-[10px] font-bold">EMPTY</span>
        )}
      </div>
    </div>
  );
};
