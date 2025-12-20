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
          "text-[10px] font-bold uppercase tracking-wider transition-colors",
          isReturnTarget ? "text-amber-400 animate-pulse" : "text-zinc-500"
      )}>
        {label}
      </div>
      
      <div className="relative group">
        {count > 0 ? (
            <div className="relative">
                {/* Stack effects using explicit divs */}
                {count > 2 && (
                    <div className="absolute inset-0 w-full h-full bg-zinc-800 border-2 border-zinc-600 rounded-lg translate-x-1.5 translate-y-1.5 shadow-md" />
                )}
                {count > 1 && (
                    <div className="absolute inset-0 w-full h-full bg-zinc-800 border-2 border-zinc-600 rounded-lg translate-x-0.5 translate-y-0.5 shadow-md" />
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
                            "shadow-xl border-zinc-600",
                            isReturnTarget && "ring-2 ring-amber-500"
                        )}
                     />
                </div>
            </div>
        ) : (
            // 空のデッキプレースホルダー
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 flex items-center justify-center">
                <span className="text-zinc-600 text-xs font-bold">EMPTY</span>
            </div>
        )}
      </div>
    </div>
  );
};
