import type { Card as CardType, LocationInfo } from '../types';
import { Card } from './Card';
import { cn } from '../utils';
import { parseLocationId } from './utils';
import type { ReactNode } from 'react';

interface ZoneProps {
  id: string;
  cards: CardType[];
  type?: 'slot' | 'tactic' | 'deck' | 'discard' | 'hand';
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  isInteractable?: boolean; // クリック可能か（カード選択や配置先指定）
  activeCardId?: string; // 選択中のカードID（ハイライト用）
  onCardClick?: (card: CardType, location?: LocationInfo) => void;
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
  onCardClick,
  onZoneClick
}: ZoneProps) {
  const isSlot = type === 'slot';
  
  // IDから現在のLocationInfoを解析
  const location = parseLocationId(id) || undefined;
  
  const handleZoneClick = () => {
    if (!isInteractable || !onZoneClick || !location) return;
    onZoneClick(location);
  };

  return (
    <div
      onClick={handleZoneClick}
      className={cn(
        "relative transition-colors rounded-lg p-2 min-h-[100px] min-w-[70px]",
        // Base layout
        orientation === 'vertical' ? "flex flex-col items-center pt-4 pb-4" : "flex flex-row items-center px-4",
        // Interactive visual cue
        isInteractable && "cursor-pointer hover:bg-white/5",
        // Border style
        "border-dashed border-2 border-gray-300/50 bg-gray-50/10",
        className
      )}
    >
      {cards.map((card, index) => (
        <div 
            key={card.id} 
            className={cn(
                "relative transition-transform duration-200",
                // Overlap logic
                isSlot && index > 0 && orientation === 'vertical' && "-mt-12 sm:-mt-16",
                isSlot && index > 0 && orientation === 'horizontal' && "-ml-8",
                // Hover effect for slots
                isSlot && isInteractable && "hover:z-20"
            )}
            style={{ zIndex: index }}
        >
             <Card 
               card={card} 
               location={location} 
               isInteractable={isInteractable}
               isSelected={activeCardId === card.id}
               onClick={onCardClick}
             />
        </div>
      ))}
      
      {/* Empty state placeholder or children */}
      {cards.length === 0 && !children && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500/30 text-xs pointer-events-none">
            {type === 'slot' ? 'Empty' : ''}
        </div>
      )}
      
      {children}
    </div>
  );
}
