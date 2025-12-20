import type { FlagState } from '../types';
import { cn } from '../utils';
import { Flag as FlagIcon } from 'lucide-react';

interface FlagProps {
  flag: FlagState;
  onClaim?: (id: string) => void;
  className?: string;
  myID: string;
}

export function Flag({ flag, onClaim, className, myID }: FlagProps) {
  const isClaimed = flag.owner !== null;
  
  // Ownerによる色と位置の決定
  let containerStyles = "bg-zinc-800 ring-2 ring-zinc-600 text-zinc-500";
  let translateStyles = "";

  if (isClaimed) {
      // 色の決定 (ID依存)
      if (flag.owner === '0') {
          containerStyles = "bg-red-600 ring-2 ring-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]";
      } else if (flag.owner === '1') {
          containerStyles = "bg-blue-600 ring-2 ring-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]";
      }

      // 位置の決定 (視点依存)
      // 自分が確保 -> 手前 (下)
      // 相手が確保 -> 奥 (上)
      if (flag.owner === myID) {
          translateStyles = "translate-y-6";
      } else {
          translateStyles = "-translate-y-6";
      }
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
