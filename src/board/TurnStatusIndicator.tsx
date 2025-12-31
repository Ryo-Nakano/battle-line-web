import { cn } from '../utils';

interface TurnStatusIndicatorProps {
  isMyTurn: boolean;
  size?: 'sm' | 'md';
}

/**
 * ターン状態を示すスピナーコンポーネント
 * - YOUR TURN: バウンスするドット3つ（アクティブ感）
 * - WAITING: 回転するアーク（待機感）
 */
export function TurnStatusIndicator({ isMyTurn, size = 'md' }: TurnStatusIndicatorProps) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (isMyTurn) {
    // Pulsing amber ring for YOUR TURN
    return (
      <div className={cn('relative', sizeClasses)}>
        <svg
          className="w-full h-full animate-pulse"
          viewBox="0 0 24 24"
          style={{ animationDuration: '2s' }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Rotating arc for WAITING
  return (
    <div className={cn('relative', sizeClasses)}>
      {/* Background track */}
      <svg className="w-full h-full" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="2"
        />
      </svg>
      {/* Rotating arc */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin"
        viewBox="0 0 24 24"
        style={{ animationDuration: '1.5s' }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="20 40"
        />
      </svg>
    </div>
  );
}
