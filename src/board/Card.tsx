import type { Card as CardType, LocationInfo } from '../types';
import { cn } from '../utils';
import { TACTICS_DATA } from '../constants/tactics';
import { Shield, Scroll } from 'lucide-react';

interface CardProps {
  card: CardType;
  location?: LocationInfo;
  isSelected?: boolean;
  onClick?: (card: CardType, location?: LocationInfo) => void;
  onInfoClick?: (card: CardType) => void;
  className?: string;
  isInteractable?: boolean;
}

const colorMap: Record<string, string> = {
  red: 'bg-red-700 text-red-100 border-red-500',
  orange: 'bg-orange-600 text-orange-100 border-orange-400',
  yellow: 'bg-yellow-600 text-yellow-100 border-yellow-400',
  green: 'bg-green-700 text-green-100 border-green-500',
  blue: 'bg-blue-700 text-blue-100 border-blue-500',
  purple: 'bg-purple-700 text-purple-100 border-purple-500',
};

export function Card({ card, location, isSelected, onClick, onInfoClick, className, isInteractable = true }: CardProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    if (!isInteractable || !onClick) return;
    e.stopPropagation();
    onClick(card, location);
  };

  // 共通のベーススタイル（縦長長方形 1:1.4）
  const baseStyles = "relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-md transition-all duration-200 flex flex-col items-center justify-between p-2 select-none box-border border-2";
  
  // 裏向きの場合
  if (card.faceDown) {
    const isTactic = card.type === 'tactic';
    const backStyles = isTactic 
        ? "bg-amber-950 border-amber-600 text-amber-500" 
        : "bg-zinc-800 border-zinc-500 text-zinc-300";
    
    return (
      <div
        className={cn(baseStyles, backStyles, className)}
      >
        <div className="w-full h-full border border-white/5 rounded flex flex-col items-center justify-center gap-1">
            {isTactic ? <Scroll size={24} /> : <Shield size={24} />}
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest">
                {isTactic ? "TACTIC" : "TROOP"}
            </span>
        </div>
      </div>
    );
  }

  // 戦術カード
  if (card.type === 'tactic') {
    const tacticInfo = card.name ? (TACTICS_DATA as any)[card.name.toLowerCase()] : null;
    const displayName = tacticInfo ? tacticInfo.title : card.name;

    return (
      <div
        onClick={handleClick}
        className={cn(
            baseStyles,
            "bg-zinc-800 border-amber-500 text-amber-100",
            isInteractable && "cursor-pointer hover:-translate-y-2",
            isSelected && "-translate-y-4 ring-4 ring-amber-400/50 shadow-2xl z-50",
            !isInteractable && "cursor-default opacity-90",
            className
        )}
      >
         <div className="w-full text-center text-[10px] sm:text-xs font-bold leading-tight z-10 break-words line-clamp-2">
             {displayName}
         </div>
         <div className="text-amber-500/80">
             <Scroll size={32} />
         </div>
         {onInfoClick && (
            <button
                className="absolute top-1 right-1 w-4 h-4 bg-amber-600/50 hover:bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-serif transition-colors z-20"
                onClick={(e) => {
                    e.stopPropagation();
                    onInfoClick(card);
                }}
            >
                i
            </button>
         )}
         {/* 装飾 */}
         <div className="absolute inset-1 border border-amber-500/20 rounded pointer-events-none"></div>
      </div>
    );
  }

  // 部隊カード
  const specificStyles = card.color ? (colorMap[card.color] || 'bg-zinc-700') : 'bg-zinc-700';
  
  return (
    <div
      onClick={handleClick}
      className={cn(
        baseStyles,
        specificStyles,
        isInteractable && "cursor-pointer hover:-translate-y-2",
        isSelected && "-translate-y-4 ring-4 ring-white/50 shadow-2xl z-50",
        !isInteractable && "cursor-default",
        className
      )}
    >
      <div className="w-full text-left font-bold text-lg leading-none">{card.value}</div>
      <div className="text-white/20">
          <Shield size={40} strokeWidth={1.5} />
      </div>
      <div className="w-full text-right font-bold text-lg leading-none rotate-180">{card.value}</div>
      
      {/* 装飾用ライン */}
      <div className="absolute inset-1 border border-white/20 rounded-md pointer-events-none"></div>
    </div>
  );
}
