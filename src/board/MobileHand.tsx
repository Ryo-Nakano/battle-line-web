import { useState, useEffect } from 'react';
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

const CLOSE_ANIMATION_DURATION = 350;

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
  const [isClosing, setIsClosing] = useState(false);
  const location: LocationInfo = { area: 'hand', playerId };

  // 選択中のカードを取得
  const activeCard = activeCardId ? cards.find(c => c.id === activeCardId) : undefined;

  // 閉じるアニメーション完了後にモーダルを非表示
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setIsClosing(false);
        setIsExpanded(false);
      }, CLOSE_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  // カード選択時のハンドラ - 新規選択時のみ自動クローズ
  const handleCardClickWithAutoClose = (card: CardType, loc?: LocationInfo) => {
    const isDeselecting = activeCardId === card.id;
    onCardClick?.(card, loc);

    // 選択解除の場合はモーダルを閉じない
    if (!isDeselecting) {
      handleClose();
    }
  };

  // フローティングカードを表示するか判定
  const showFloatingCard = !isExpanded && !isClosing && activeCard;

  return (
    <>
      <PreviewBar
        cards={cards}
        activeCardId={activeCardId}
        disabled={disabled}
        onExpand={handleExpand}
      />
      {isExpanded && (
        <ExpandedModal
          cards={cards}
          activeCardId={activeCardId}
          location={location}
          onCardClick={handleCardClickWithAutoClose}
          onInfoClick={onInfoClick}
          onSort={onSort}
          disabled={disabled}
          isClosing={isClosing}
          onClose={handleClose}
        />
      )}
      {showFloatingCard && (
        <FloatingCard
          card={activeCard}
          onClick={handleExpand}
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
  isClosing: boolean;
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
  isClosing,
  onClose
}: ExpandedModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm"
    style={{
      backgroundColor: isClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.7)',
      transition: `background-color ${CLOSE_ANIMATION_DURATION}ms ease-out`
    }}
    onClick={onClose}
  >
    <div
      className="w-full max-h-[70vh] bg-zinc-900 border-t border-zinc-700 rounded-t-2xl overflow-hidden"
      style={{
        transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
        transition: `transform ${CLOSE_ANIMATION_DURATION}ms ease-out`
      }}
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
                activeCardId === card.id && "scale-105"
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
                disableLift={true}
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

// フローティングカード - 選択中のカードを画面右下に表示
interface FloatingCardProps {
  card: CardType;
  onClick: () => void;
}

const FloatingCard = ({ card, onClick }: FloatingCardProps) => (
  <div
    className="fixed z-40 cursor-pointer animate-pulse"
    style={{
      right: '12px',
      bottom: '70px',
      transform: 'scale(0.7)',
      transformOrigin: 'bottom right',
      filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
    }}
    onClick={onClick}
  >
    <Card
      card={card}
      isSelected={true}
      isInteractable={true}
      disableLift={true}
    />
  </div>
);
