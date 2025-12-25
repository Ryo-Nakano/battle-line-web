import { Card } from './Card';
import { cn } from '../utils';
import type { CardType } from '../types';

interface DeckPileProps {
  count: number;
  type: string;
  onClick: () => void;
  isDisabled?: boolean;
  className?: string;
}

export const DeckPile = ({ count, type, onClick, isDisabled, className }: DeckPileProps) => {
  // ダミーのカードデータ
  const dummyCard = {
    id: `deck-${type}`,
    type: type as CardType,
    faceDown: true,
  };

  const label = `${type === 'troop' ? 'Troop' : 'Tactic'} (${count})`;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={!isDisabled ? onClick : undefined}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
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
                  !isDisabled && "group-hover:ring-2 group-hover:ring-amber-500/50 transition-all"
                )}
              />
            </div>
          </div>
        ) : (
          // 空のデッキプレースホルダー
          <div className="w-[60px] h-[84px] sm:w-16 sm:h-24 lg:w-20 lg:h-28 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 flex items-center justify-center">
            <span className="text-zinc-600 text-[10px] sm:text-xs font-bold">EMPTY</span>
          </div>
        )}
      </div>
    </div>
  );
};