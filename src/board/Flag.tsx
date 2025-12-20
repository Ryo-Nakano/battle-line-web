import type { FlagState } from '../types';
import { cn } from '../utils';
import { Flag as FlagIcon } from 'lucide-react';

interface FlagProps {
  flag: FlagState;
  onClaim?: (id: string) => void;
  className?: string;
}

export function Flag({ flag, onClaim, className }: FlagProps) {
  const isClaimed = flag.owner !== null;
  
  // Ownerによる色と位置の決定
  // Player 0: Red, Translate Up (or Down depending on view, but consistent relative to center)
  // Player 1: Blue, Translate Down
  let containerStyles = "bg-zinc-800 ring-2 ring-zinc-600 text-zinc-500";
  let translateStyles = "";

  if (flag.owner === '0') {
      containerStyles = "bg-red-600 ring-2 ring-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]";
      translateStyles = "-translate-y-6"; // Player 0 側へ移動
  } else if (flag.owner === '1') {
      containerStyles = "bg-blue-600 ring-2 ring-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]";
      translateStyles = "translate-y-6"; // Player 1 側へ移動
  }

  return (
    <div 
      className={cn(
          "flex flex-col items-center justify-center group transition-all duration-500 ease-out z-10",
          translateStyles,
          className
      )}
      onClick={() => onClaim && onClaim(flag.id)}
      role="button"
      aria-label={`Claim flag ${flag.id}`}
    >
        <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
            containerStyles,
            !isClaimed && "group-hover:bg-zinc-700 group-hover:text-zinc-300 cursor-pointer"
        )}>
            <FlagIcon size={20} fill={isClaimed ? "currentColor" : "none"} />
        </div>
        
        {/* 未確保時のホバーガイド（オプショナル） */}
        {!isClaimed && (
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-6 text-[10px] text-zinc-400 font-bold tracking-widest pointer-events-none">
                CLAIM
            </div>
        )}
    </div>
  );
}
