import { Sword, Shield, X } from 'lucide-react';
import { cn } from '../utils';
import { DECK_TYPES } from '../constants';

interface DrawSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => void;
  troopCount: number;
  tacticCount: number;
}

export const DrawSelectionModal = ({ isOpen, onClose, onSelect, troopCount, tacticCount }: DrawSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-zinc-800/50 p-4 border-b border-zinc-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-8 bg-amber-500 rounded-full inline-block"></span>
            ターン終了
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-300 mb-6 text-center">
            どちらの山札からカードを引いてターンを終了しますか？
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => troopCount > 0 && onSelect(DECK_TYPES.TROOP)}
              disabled={troopCount === 0}
              className={cn(
                "group flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                troopCount > 0 
                  ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 hover:shadow-lg cursor-pointer" 
                  : "border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                <Shield size={24} className="text-zinc-300" />
              </div>
              <div className="text-center">
                <div className="font-bold text-zinc-200">部隊カード</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">Troop ({troopCount})</div>
              </div>
            </button>

            <button
              onClick={() => tacticCount > 0 && onSelect(DECK_TYPES.TACTIC)}
              disabled={tacticCount === 0}
              className={cn(
                "group flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                tacticCount > 0 
                  ? "border-amber-900/50 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700 hover:shadow-lg cursor-pointer" 
                  : "border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-amber-900/40 flex items-center justify-center group-hover:bg-amber-900/60 transition-colors">
                <Sword size={24} className="text-amber-500" />
              </div>
              <div className="text-center">
                <div className="font-bold text-amber-500">戦術カード</div>
                <div className="text-xs text-amber-700 font-mono mt-1">Tactic ({tacticCount})</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950/50 p-4 border-t border-zinc-800 flex justify-center">
          <button 
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 transition-colors"
          >
            戻る (キャンセル)
          </button>
        </div>
      </div>
    </div>
  );
};