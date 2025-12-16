import { useDraggable } from '@dnd-kit/core';
import type { Card as CardType } from '../types';
import { cn } from '../utils';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isSelected?: boolean;
  className?: string;
}

const colorMap: Record<string, string> = {
  red: 'border-red-500 text-red-600 bg-red-50',
  orange: 'border-orange-500 text-orange-600 bg-orange-50',
  yellow: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  green: 'border-green-500 text-green-600 bg-green-50',
  blue: 'border-blue-500 text-blue-600 bg-blue-50',
  purple: 'border-purple-500 text-purple-600 bg-purple-50',
};

export function Card({ card, isDraggable = true, isSelected, className }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
    disabled: !isDraggable,
  });

  const baseStyles = "w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 flex items-center justify-center font-bold text-lg md:text-xl shadow-sm select-none transition-transform touch-none";
  
  // Style for face down
  if (card.faceDown) {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
            baseStyles, 
            "bg-slate-700 border-slate-600",
            isDragging && "opacity-50",
            className
        )}
      >
        <span className="text-slate-500 text-xs">BL</span>
      </div>
    );
  }

  // Style by type
  let specificStyles = "bg-white border-gray-300 text-gray-800";
  let content = null;

  if (card.type === 'troop' && card.color) {
    specificStyles = colorMap[card.color] || specificStyles;
    content = card.value;
  } else if (card.type === 'tactic') {
    specificStyles = "bg-gray-100 border-gray-400 text-gray-700 text-xs text-center px-1 break-words leading-tight";
    content = card.name;
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        baseStyles,
        specificStyles,
        isDragging && "opacity-50 z-50 scale-105 shadow-xl",
        isSelected && "ring-2 ring-blue-400",
        !isDraggable && "cursor-default",
        isDraggable && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      {content}
    </div>
  );
}
