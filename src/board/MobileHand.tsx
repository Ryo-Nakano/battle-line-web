import { useState } from 'react';
import type { Card as CardType, LocationInfo } from '../types';
import { Card } from './Card';
import { cn } from '../utils';
import { X, ChevronUp, ArrowUpDown } from 'lucide-react';

interface MobileHandProps {
  cards: CardType[];
  playerId: string;
  activeCardId?: string;
  onCardClick?: (card: CardType, location?: LocationInfo) => void;
  onInfoClick?: (card: CardType) => void;
  onSort?: () => void;
  disabled?: boolean;
}

export function MobileHand({
  cards,
  playerId,
  activeCardId,
  onCardClick,
  onInfoClick,
  onSort,
  disabled = false
}: MobileHandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location: LocationInfo = { area: 'hand', playerId };

  return (
    <>
      <PreviewBar
        cards={cards}
        activeCardId={activeCardId}
        disabled={disabled}
        onExpand={() => setIsExpanded(true)}
      />
      {isExpanded && (
        <ExpandedModal
          cards={cards}
          activeCardId={activeCardId}
          location={location}
          onCardClick={onCardClick}
          onInfoClick={onInfoClick}
          onSort={onSort}
          disabled={disabled}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}

// カードの色に対応するTailwind背景色
const getCardBgColor = (card: CardType) => {
  if (card.type === 'tactic') return 'bg-amber-700';
  const colorMap: Record<string, string> = {
    red: 'bg-red-600',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
  };
  return card.color ? (colorMap[card.color] || 'bg-zinc-600') : 'bg-zinc-600';
};

interface PreviewBarProps {
  cards: CardType[];
  activeCardId?: string;
  disabled: boolean;
  onExpand: () => void;
}

const PreviewBar = ({ cards, activeCardId, disabled, onExpand }: PreviewBarProps) => (
  <div
    className={cn(
      "flex items-center gap-2 px-2 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700/50 cursor-pointer transition-colors overflow-x-auto",
      !disabled && "hover:bg-zinc-800/80",
      disabled && "opacity-50"
    )}
    onClick={() => !disabled && onExpand()}
  >
    <span className="text-[10px] text-zinc-500 font-bold shrink-0">HAND</span>
    <div className="flex gap-1">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "w-5 h-7 rounded text-[9px] font-bold flex items-center justify-center shrink-0 border border-white/20",
            getCardBgColor(card),
            activeCardId === card.id && "ring-2 ring-white"
          )}
        >
          {card.type === 'tactic' ? 'T' : card.value}
        </div>
      ))}
    </div>
    <ChevronUp size={14} className="text-zinc-500 shrink-0 ml-auto" />
  </div>
);

interface ExpandedModalProps {
  cards: CardType[];
  activeCardId?: string;
  location: LocationInfo;
  onCardClick?: (card: CardType, location?: LocationInfo) => void;
  onInfoClick?: (card: CardType) => void;
  onSort?: () => void;
  disabled: boolean;
  onClose: () => void;
}

const ExpandedModal = ({
  cards,
  activeCardId,
  location,
  onCardClick,
  onInfoClick,
  onSort,
  disabled,
  onClose
}: ExpandedModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full max-h-[70vh] bg-zinc-900 border-t border-zinc-700 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-300">YOUR HAND ({cards.length})</h3>
        <div className="flex items-center gap-2">
          {onSort && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSort();
              }}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full border border-zinc-700 transition-colors"
              title="Sort Hand"
            >
              <ArrowUpDown size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* カード一覧 */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "transition-transform",
                activeCardId === card.id && "scale-105 -translate-y-2"
              )}
            >
              <Card
                card={card}
                location={location}
                isSelected={activeCardId === card.id}
                onClick={() => {
                  onCardClick?.(card, location);
                }}
                onInfoClick={onInfoClick}
                isInteractable={!disabled}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 説明 */}
      <div className="p-3 border-t border-zinc-800 bg-black/30">
        <p className="text-xs text-zinc-500 text-center">
          {activeCardId ? 'カードを選択中 - 配置先を選んでください' : 'カードをタップして選択'}
        </p>
      </div>
    </div>
  </div>
);
