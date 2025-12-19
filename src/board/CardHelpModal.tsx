import type { Card as CardType } from '../types';
import { TACTICS_DATA } from '../constants/tactics';

interface CardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardType | null;
}

export const CardHelpModal = ({ isOpen, onClose, card }: CardHelpModalProps) => {
  if (!isOpen || !card || card.type !== 'tactic' || !card.name) return null;

  const info = TACTICS_DATA[card.name.toLowerCase()];
  
  // データがない場合のフォールバック
  const title = info?.title || card.name;
  const description = info?.description || 'No description available.';
  const category = info?.category || 'Tactic';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-amber-600/50 rounded-xl shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-900/50 text-amber-200 border border-amber-800/50 mb-1">
                  {category}
              </span>
              <h2 className="text-2xl font-bold text-amber-100">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <div className="text-slate-300 leading-relaxed text-sm sm:text-base bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          {description}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
