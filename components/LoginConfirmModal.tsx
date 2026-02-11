import React from 'react';

interface LoginConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRedirectConfirm: () => void;
  isLoading?: boolean;
}

export const LoginConfirmModal: React.FC<LoginConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, onRedirectConfirm, isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in duration-300">
        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-5 mx-auto border border-indigo-100">
           <i className="fa-brands fa-google text-2xl"></i>
        </div>
        
        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Googleでログイン</h3>
        
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          ログイン方法を選択してください。
        </p>
        
        <div className="flex flex-col gap-3 mb-4">
           {/* Popup Login */}
           <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i> 処理中...
              </>
            ) : (
              <>
                <i className="fa-regular fa-window-restore"></i> ポップアップでログイン
              </>
            )}
          </button>

          {/* Redirect Login */}
          <button 
            onClick={onRedirectConfirm}
            disabled={isLoading}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> リダイレクトでログイン
          </button>
        </div>

        <button 
          onClick={onClose}
          disabled={isLoading}
          className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs"
        >
          キャンセル
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-2">
            ※ポップアップがブロックされる場合はリダイレクトをご利用ください
        </p>
      </div>
    </div>
  );
};