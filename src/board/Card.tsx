import type { Card as CardType, LocationInfo } from '../types';
import { cn } from '../utils';
import { TACTICS_DATA } from '../constants/tactics';

interface CardProps {
  card: CardType;
  location?: LocationInfo; // カードの現在の場所（移動元特定用）
  isSelected?: boolean;
  onClick?: (card: CardType, location?: LocationInfo) => void;
  onInfoClick?: (card: CardType) => void;
  className?: string;
  isInteractable?: boolean; // クリック可能かどうか
}

const colorMap: Record<string, string> = {
  red: 'border-red-500 text-red-600 bg-red-50',
  orange: 'border-orange-500 text-orange-600 bg-orange-50',
  yellow: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  green: 'border-green-500 text-green-600 bg-green-50',
  blue: 'border-blue-500 text-blue-600 bg-blue-50',
  purple: 'border-purple-500 text-purple-600 bg-purple-50',
};

export function Card({ card, location, isSelected, onClick, onInfoClick, className, isInteractable = true }: CardProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    if (!isInteractable || !onClick) return;
    e.stopPropagation(); // Zoneのクリックイベント発火を防ぐ
    onClick(card, location);
  };

  const baseStyles = "w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg border-2 flex items-center justify-center font-bold text-lg md:text-xl shadow-sm select-none transition-transform transition-colors box-border";
  
  // 裏向きの場合
  if (card.faceDown) {
    const isTactic = card.type === 'tactic';
    const backStyles = isTactic 
        ? "bg-amber-900 border-amber-700 text-amber-200/50" 
        : "bg-slate-700 border-slate-600 text-slate-400/50";
    
    return (
      <div
        className={cn(
            baseStyles, 
            backStyles,
            className
        )}
      >
        <span className="text-[10px] sm:text-xs font-bold tracking-widest rotate-45">
            {isTactic ? 'TACTIC' : 'TROOP'}
        </span>
      </div>
    );
  }

  // 表向きの場合: カードタイプに応じたスタイル
  let specificStyles = "bg-white border-gray-300 text-gray-800";
  let content: React.ReactNode = null;

  if (card.type === 'troop' && card.color) {
    specificStyles = colorMap[card.color] || specificStyles;
    content = card.value;
  } else if (card.type === 'tactic') {
    specificStyles = "bg-gray-100 border-gray-400 text-gray-700 text-xs text-center px-1 break-words leading-tight relative";
    
    const tacticInfo = card.name ? TACTICS_DATA[card.name.toLowerCase()] : null;
    const displayName = tacticInfo ? tacticInfo.title : card.name;

    content = (
        <>
            {displayName}
            {onInfoClick && (
                <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-serif hover:bg-amber-500 shadow-sm z-20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onInfoClick(card);
                    }}
                >
                    i
                </button>
            )}
        </>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        baseStyles,
        specificStyles,
        // インタラクションスタイル
        isInteractable && "cursor-pointer hover:-translate-y-1 hover:shadow-md",
        !isInteractable && "cursor-default",
        // 選択状態スタイル
        isSelected && "ring-4 ring-blue-500 -translate-y-2 shadow-lg z-10",
        className
      )}
    >
      {content}
    </div>
  );
}
