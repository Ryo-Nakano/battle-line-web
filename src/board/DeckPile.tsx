import { Card } from './Card';
import { cn } from '../utils';

interface DeckPileProps {
  count: number;
  type: 'troop' | 'tactic';
  onClick: () => void;
  isDisabled?: boolean;
  isReturnTarget?: boolean;
  className?: string;
}

export const DeckPile = ({ count, type, onClick, isDisabled, isReturnTarget, className }: DeckPileProps) => {
  // ダミーのカードデータ
  const dummyCard = {
    id: `deck-${type}`,
    type: type,
    faceDown: true,
  };

  const label = isReturnTarget ? 'Return' : `${type === 'troop' ? 'Troop' : 'Tactic'} (${count})`;

  return (
    <div 
      className={cn(
          "flex flex-col items-center gap-1", 
          isDisabled && "opacity-50 cursor-not-allowed",
          className
      )}
      onClick={!isDisabled ? onClick : undefined}
    >
      <div className={cn(
          "text-xs font-bold uppercase tracking-wider transition-colors",
          isReturnTarget ? "text-amber-400 animate-pulse" : "text-slate-500"
      )}>
        {label}
      </div>
      
      <div className="relative group">
        {count > 0 ? (
            <div className="relative">
                {/* Stack effects using explicit divs */}
                {count > 2 && (
                    <div className="absolute inset-0 w-full h-full bg-slate-800 border-2 border-slate-600 rounded-lg translate-x-3 translate-y-3" />
                )}
                {count > 1 && (
                    <div className="absolute inset-0 w-full h-full bg-slate-800 border-2 border-slate-600 rounded-lg translate-x-1.5 translate-y-1.5" />
                )}
                
                {/* Main Card */}
                <div className={cn(
                    "relative transition-transform duration-200",
                    !isDisabled && "cursor-pointer group-hover:-translate-y-1"
                )}>
                     <Card 
                        card={dummyCard} 
                        isInteractable={false}
                        className={cn(
                            "shadow-lg",
                            isReturnTarget && "ring-2 ring-amber-500"
                        )}
                     />
                </div>
            </div>
        ) : (
            // 空のデッキプレースホルダー
            <div className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 flex items-center justify-center">
                <span className="text-slate-600 text-xs">Empty</span>
            </div>
        )}
      </div>
    </div>
  );
};
