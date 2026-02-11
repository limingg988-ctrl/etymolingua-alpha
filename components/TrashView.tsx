
import React, { useState, useEffect } from 'react';
import { WordEntry } from '../types';

interface TrashViewProps {
  trashHistory: WordEntry[];
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onEmptyTrash: () => void;
  onClose: () => void;
}

// Internal component for 2-step confirmation
const ConfirmButton: React.FC<{
  label: string;
  confirmLabel: string;
  icon: string;
  onConfirm: () => void;
  className: string;
  confirmClassName: string;
}> = ({ label, confirmLabel, icon, onConfirm, className, confirmClassName }) => {
  const [status, setStatus] = useState<'idle' | 'confirming'>('idle');

  useEffect(() => {
    if (status === 'confirming') {
      const timer = setTimeout(() => setStatus('idle'), 3000); // Reset after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'idle') {
      setStatus('confirming');
    } else {
      onConfirm();
      setStatus('idle');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`transition-all duration-200 ${status === 'confirming' ? confirmClassName : className}`}
    >
      <i className={`fa-solid ${status === 'confirming' ? 'fa-circle-exclamation' : icon}`}></i>
      {status === 'confirming' ? confirmLabel : label}
    </button>
  );
};

export const TrashView: React.FC<TrashViewProps> = ({ 
  trashHistory, 
  onRestore, 
  onDeletePermanently, 
  onEmptyTrash,
  onClose
}) => {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
            <i className="fa-solid fa-trash-can text-slate-500"></i>
            ゴミ箱
          </h2>
          <p className="text-slate-500 text-sm">
            ここに移動された単語は、クイズや統計には表示されません。<br/>
            「復元」で元のリストに戻すか、「完全に削除」でメモリから消去できます。
          </p>
        </div>
        
        {trashHistory.length > 0 && (
          <ConfirmButton
            label="ゴミ箱を空にする"
            confirmLabel="本当に空にしますか？"
            icon="fa-fire"
            onConfirm={onEmptyTrash}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
            confirmClassName="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap shadow-lg animate-pulse"
          />
        )}
      </div>

      {trashHistory.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-slate-300 text-6xl mb-4">
            <i className="fa-regular fa-trash-can"></i>
          </div>
          <p className="text-slate-400 font-bold">ゴミ箱は空です</p>
          <button 
            onClick={onClose}
            className="mt-6 text-indigo-600 font-bold hover:underline"
          >
            単語帳に戻る
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trashHistory.map((word) => (
            <div key={word.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-slate-700 decoration-slate-400 line-through decoration-2">{word.word}</h3>
                  <span className="text-xs text-slate-400">{word.meaning}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  削除日: {new Date().toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => onRestore(word.id)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 text-emerald-600 rounded-lg font-bold text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-trash-arrow-up"></i>
                  復元
                </button>
                
                <ConfirmButton
                  label="完全削除"
                  confirmLabel="本当に？"
                  icon="fa-xmark"
                  onConfirm={() => onDeletePermanently(word.id)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-1"
                  confirmClassName="flex-1 sm:flex-none px-3 py-2 bg-red-500 border border-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-1 shadow-md"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
