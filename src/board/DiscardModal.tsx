import type { Card as CardType } from '../types';
import { Card } from './Card';

interface DiscardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardType[];
}

export const DiscardModal = ({ isOpen, onClose, cards }: DiscardModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-200">Discard Pile ({cards.length})</h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {cards.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              No cards in discard pile.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {cards.map((card, index) => (
                <div key={`${card.id}-${index}`} className="flex justify-center">
                    <Card card={card} isSelected={false} className="shadow-md" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded transition-colors"
          >
            Close
          </button>
        </div>

      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
