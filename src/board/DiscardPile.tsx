import type { Card as CardType } from '../types';
import { Card } from './Card';

interface DiscardPileProps {
  cards: CardType[];
  onClick: () => void;
  className?: string;
  label?: string;
}

export const DiscardPile = ({ cards, onClick, className = '', label = 'Discard' }: DiscardPileProps) => {
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

  return (
    <div 
      className={`relative flex flex-col items-center gap-1 ${className}`}
      onClick={onClick}
    >
      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
        {label} ({cards.length})
      </div>
      
      <div className="relative w-16 h-24 sm:w-20 sm:h-28 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer group">
        {topCard ? (
          <div className="absolute inset-0 transform group-hover:scale-105 transition-transform">
             <Card card={topCard} isSelected={false} />
          </div>
        ) : (
          <span className="text-slate-600 text-xs">Empty</span>
        )}
      </div>
    </div>
  );
};
