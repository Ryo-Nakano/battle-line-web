import { useDroppable } from '@dnd-kit/core';
import type { Card as CardType } from '../types';
import { Card } from './Card';
import { cn } from '../utils';
import type { ReactNode } from 'react';

interface ZoneProps {
  id: string;
  cards: CardType[];
  type?: 'slot' | 'tactic' | 'deck' | 'discard' | 'hand';
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Zone({ id, cards, type = 'slot', children, orientation = 'vertical', className }: ZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type, id }
  });

  const isSlot = type === 'slot';
  
  // Dynamic spacing based on card count to fit in container if needed? 
  // For now, fixed negative margin.
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-colors rounded-lg p-2 min-h-[100px] min-w-[70px]",
        // Base layout
        orientation === 'vertical' ? "flex flex-col items-center pt-4 pb-4" : "flex flex-row items-center px-4",
        // Highlight on hover
        isOver ? "bg-blue-500/20 ring-2 ring-blue-400 border-transparent" : "border-dashed border-2 border-gray-300/50 bg-gray-50/30",
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
                // Hover effect for slots to see cards better
                isSlot && "hover:z-10 hover:-translate-y-4"
            )}
            style={{ zIndex: index }}
        >
             <Card card={card} />
        </div>
      ))}
      
      {/* Empty state placeholder or children */}
      {cards.length === 0 && !children && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs pointer-events-none">
            {type === 'slot' ? 'Empty' : ''}
        </div>
      )}
      
      {children}
    </div>
  );
}