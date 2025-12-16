import type { FlagState } from '../types';
import { cn } from '../utils';

interface FlagProps {
  flag: FlagState;
  onClaim?: (id: string) => void;
  className?: string;
}

export function Flag({ flag, onClaim, className }: FlagProps) {
  const isClaimed = flag.owner !== null;
  
  // Color based on owner
  const ownerColorClass = flag.owner === '0' 
    ? 'bg-red-500 ring-red-300' 
    : flag.owner === '1' 
      ? 'bg-blue-500 ring-blue-300' 
      : 'bg-amber-200 ring-amber-100'; // Neutral

  return (
    <div 
      className={cn("flex flex-col items-center justify-center group", className)}
      onClick={() => onClaim && onClaim(flag.id)}
      role="button"
      aria-label={`Claim flag ${flag.id}`}
    >
        {/* Pawn shape */}
        <div className={cn(
            "w-8 h-8 rounded-full shadow-md border-2 border-white ring-4 transition-all duration-300",
            ownerColorClass,
            isClaimed ? "ring-opacity-60 scale-110" : "ring-opacity-0 group-hover:ring-opacity-40"
        )}>
            {/* Inner highlight for 3D effect */}
            <div className="w-2 h-2 bg-white rounded-full opacity-40 ml-1 mt-1"></div>
        </div>
        {/* Base of the pawn */}
        <div className="w-6 h-2 bg-gray-800/20 rounded-[50%] -mt-1 blur-[1px]"></div>
    </div>
  );
}
