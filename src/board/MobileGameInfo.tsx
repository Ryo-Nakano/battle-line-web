import { cn } from '../utils';
import { Layers, Trash2 } from 'lucide-react';

interface MobileGameInfoProps {
  opponentName: string;
  opponentTroopCount: number;
  opponentTacticCount: number;
  troopDeckCount: number;
  tacticDeckCount: number;
  troopDiscardCount: number;
  tacticDiscardCount: number;
  isMyTurn: boolean;
  onDeckClick?: (type: 'troop' | 'tactic') => void;
  onDiscardClick?: (type: 'troop' | 'tactic') => void;
  isDeckClickable?: boolean;
}

export function MobileGameInfo({
  opponentName,
  opponentTroopCount,
  opponentTacticCount,
  troopDeckCount,
  tacticDeckCount,
  troopDiscardCount,
  tacticDiscardCount,
  isMyTurn,
  onDeckClick,
  onDiscardClick,
  isDeckClickable = false
}: MobileGameInfoProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 text-xs">
      {/* 相手情報 */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-300 text-[11px] shrink-0">{opponentName}</span>
        <div className="flex gap-0.5">
          {/* 部隊カード（青い裏面）- 山札アイコンと同じ色調 */}
          {Array.from({ length: opponentTroopCount }).map((_, i) => (
            <div
              key={`troop-${i}`}
              className="w-4 h-5 rounded-sm bg-blue-400/20 border border-blue-400/50 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60"></div>
            </div>
          ))}
          {/* 戦術カード（アンバーの裏面）- 山札アイコンと同じ色調 */}
          {Array.from({ length: opponentTacticCount }).map((_, i) => (
            <div
              key={`tactic-${i}`}
              className="w-4 h-5 rounded-sm bg-amber-400/20 border border-amber-400/50 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 山札/捨て札情報 */}
      <div className="flex items-center gap-3">
        {/* 山札 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDeckClick?.('troop')}
            disabled={!isDeckClickable}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded",
              isDeckClickable ? "hover:bg-zinc-800 cursor-pointer" : "cursor-default"
            )}
          >
            <Layers size={12} className="text-blue-400" />
            <span className="text-zinc-300">{troopDeckCount}</span>
          </button>
          <button
            onClick={() => onDeckClick?.('tactic')}
            disabled={!isDeckClickable}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded",
              isDeckClickable ? "hover:bg-zinc-800 cursor-pointer" : "cursor-default"
            )}
          >
            <Layers size={12} className="text-amber-400" />
            <span className="text-zinc-300">{tacticDeckCount}</span>
          </button>
        </div>

        {/* 捨て札 */}
        <div className="flex items-center gap-2 opacity-60">
          <button
            onClick={() => onDiscardClick?.('troop')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800"
          >
            <Trash2 size={10} className="text-blue-400" />
            <span className="text-zinc-400">{troopDiscardCount}</span>
          </button>
          <button
            onClick={() => onDiscardClick?.('tactic')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800"
          >
            <Trash2 size={10} className="text-amber-400" />
            <span className="text-zinc-400">{tacticDiscardCount}</span>
          </button>
        </div>
      </div>

      {/* ターン状態 */}
      <div className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold",
        isMyTurn
          ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
      )}>
        {isMyTurn ? 'YOUR TURN' : 'WAIT'}
      </div>
    </div>
  );
}
