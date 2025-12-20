import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
        <p className="text-zinc-400 mb-6 leading-relaxed">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors font-medium border border-zinc-700"
          >
            キャンセル
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/20 transition-all font-bold"
          >
            確保する
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
