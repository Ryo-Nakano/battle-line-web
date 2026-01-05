import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SyncErrorModalProps {
  isOpen: boolean;
  onReload: () => void;
}

export const SyncErrorModal = ({ isOpen, onReload }: SyncErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-red-900/50 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-900/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-zinc-100">
            通信エラーが発生しました
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            サーバーとの通信が不安定になっている可能性があります。<br />
            ゲームを再開するにはページを再読み込みしてください。
          </p>

          <button
            onClick={onReload}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            再読み込みする
          </button>
        </div>
      </div>
    </div>
  );
};
