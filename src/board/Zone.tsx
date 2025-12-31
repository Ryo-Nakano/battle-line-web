import type { Card as CardType, LocationInfo } from '../types';
import { Card } from './Card';
import { cn } from '../utils';
import { parseLocationId } from './utils';
import type { ReactNode } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface ZoneProps {
  id: string;
  cards: CardType[];
  type?: 'slot' | 'tactic' | 'deck' | 'discard' | 'hand';
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  isInteractable?: boolean;
  activeCardId?: string;
  isTargeted?: boolean; // 配置候補としてハイライトするか
  showPlaceHere?: boolean; // Place Here テキストを表示するか（デフォルト: true）
  highlightedCardIndex?: number; // 配置直後のカードをハイライトするインデックス
  onCardClick?: (card: CardType, location?: LocationInfo) => void;
  onInfoClick?: (card: CardType) => void;
  onZoneClick?: (location: LocationInfo) => void;
}

export function Zone({
  id,
  cards,
  type = 'slot',
  children,
  orientation = 'vertical',
  className,
  isInteractable = true,
  activeCardId,
  isTargeted = false,
  showPlaceHere = true,
  highlightedCardIndex,
  onCardClick,
  onInfoClick,
  onZoneClick
}: ZoneProps) {
  const isSlot = type === 'slot';
  const location = parseLocationId(id) || undefined;
  const [parent] = useAutoAnimate();

  const handleZoneClick = () => {
    if (!isInteractable || !onZoneClick || !location) return;
    onZoneClick(location);
  };

  return (
    <div
      ref={parent}
      onClick={handleZoneClick}
      className={cn(
        "relative transition-all duration-300 rounded-xl p-1 sm:p-2",
        // Base layout - レスポンシブ対応
        orientation === 'vertical' ? "flex flex-col items-center pt-1 pb-1 min-h-[40px] sm:min-h-[140px] w-[56px] sm:w-[68px] lg:w-24" : "flex flex-row items-center px-2 sm:px-4 min-h-[40px] sm:min-h-[110px]",
        // Interactive visual cue
        isInteractable && "cursor-pointer hover:bg-white/5 hover:ring-1 hover:ring-white/20",
        // Empty state styling
        isSlot && cards.length === 0 && "border-2 border-dashed border-white/20",
        // Targeted Highlight (Guide)
        isTargeted && "bg-amber-500/10 ring-2 ring-amber-500/70 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse",
        className
      )}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={cn(
            "relative transition-all duration-300 ease-out",
            // Vertical Stack - レスポンシブ対応
            isSlot && index > 0 && orientation === 'vertical' && "-mt-14 sm:-mt-16 lg:-mt-20",
            // Horizontal Stack
            isSlot && index > 0 && orientation === 'horizontal' && "-ml-8 sm:-ml-10 lg:-ml-12",
            // Hover effect
            isSlot && isInteractable && "hover:z-20 hover:-translate-y-2"
          )}
          style={{ zIndex: index }}
        >
          <Card
            card={card}
            location={location}
            isInteractable={isInteractable}
            isSelected={activeCardId === card.id}
            isHighlighted={highlightedCardIndex === index}
            onClick={onCardClick}
            onInfoClick={onInfoClick}
          />
        </div>
      ))}

      {/* Empty Indicator */}
      {cards.length === 0 && isSlot && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none",
          isTargeted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isTargeted && showPlaceHere ? (
            <div className="w-full h-full rounded-lg flex items-center justify-center">
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest animate-bounce">
                Place Here
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-white/5 rounded-lg"></div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
