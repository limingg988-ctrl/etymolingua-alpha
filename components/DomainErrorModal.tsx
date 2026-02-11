import React, { useState, useEffect } from 'react';

interface DomainErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
}

export const DomainErrorModal: React.FC<DomainErrorModalProps> = ({ isOpen, onClose, domain }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [displayUrl, setDisplayUrl] = useState('');
  const [displayHostname, setDisplayHostname] = useState('');
  const [isBlobUrl, setIsBlobUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentHref = window.location.href;
      let calculatedHostname = domain || window.location.hostname;
      let blobDetected = false;

      // blob: URLの処理 (プレビュー環境対策)
      if (currentHref.startsWith('blob:')) {
        blobDetected = true;
        try {
          // blob:https://... の "blob:" を削除して URL解析を試みる
          const cleanUrl = currentHref.replace(/^blob:/, '');
          const urlObj = new URL(cleanUrl);
          calculatedHostname = urlObj.hostname;
        } catch (e) {
          console.warn("Failed to parse blob URL", e);
          // 解析失敗時はそのまま表示するか、親フレームの情報を試みる
          calculatedHostname = "取得できませんでした (Blob URL)";
        }
      } else if (!calculatedHostname && currentHref) {
         try {
             const url = new URL(currentHref);
             calculatedHostname = url.hostname;
         } catch (e) {
             calculatedHostname = "取得できませんでした";
         }
      }

      setIsBlobUrl(blobDetected);
      setDisplayHostname(calculatedHostname);
      setDisplayUrl(currentHref);
    }
  }, [isOpen, domain]);

  const handleCopy = (text: string) => {
    if (!text) return;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            setCopied(true);
        });
    } else {
        setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto border border-red-200">
           <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          ドメインの許可が必要です
        </h3>
        
        {/* Blob URL / Preview Environment Warning */}
        {isBlobUrl && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
              <i className="fa-solid fa-code"></i> プレビュー環境での制限
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed mb-3">
              現在、アプリがプレビューモード（iframe/blob）で実行されています。<br/>
              この環境ではGoogle認証がセキュリティ制限によりブロックされる可能性が高いです。
            </p>
            <div className="flex flex-col gap-2">
               <button 
                 onClick={onClose} 
                 className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors"
               >
                 ゲストモードで試す（推奨）
               </button>
               <p className="text-[10px] text-amber-600 text-center">
                 ※または「新しいタブで開く」機能を使って全画面で表示してください。
               </p>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-6 leading-relaxed text-center">
          現在のドメインがFirebaseで許可されていないため、ログインがブロックされました。<br/>
          開発者の方は、以下のドメインを追加してください。
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-left">
           <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2">
             <li>
               <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">
                 Firebaseコンソール <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
               </a>
               を開く
             </li>
             <li>対象のプロジェクトを選択</li>
             <li>左メニューの <strong>Authentication</strong> &gt; <strong>設定</strong> を選択</li>
             <li><strong>承認済みドメイン</strong> に以下のドメインを追加</li>
           </ol>
        </div>
        
        {/* Hostname Section */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 block mb-1">追加するドメイン (Hostname)</label>
          <div className="relative flex items-center gap-2 bg-slate-100 p-3 rounded-xl border border-slate-200 group">
             <code className="flex-1 font-mono text-sm font-bold text-slate-800 truncate select-all">
               {displayHostname}
             </code>
             <button 
               onClick={() => handleCopy(displayHostname)}
               className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border shadow-sm transition-all ${
                   copied 
                   ? 'bg-emerald-500 border-emerald-600 text-white' 
                   : 'bg-white border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300'
               }`}
             >
               {copied ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-copy"></i>}
               <span>Copy</span>
             </button>
          </div>
        </div>

        {/* Full URL Section (Fallback) */}
        <div className="mb-8">
           <label className="text-xs font-bold text-slate-400 block mb-1">現在のURL (参考)</label>
           <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
             <p className="text-[10px] text-slate-500 font-mono break-all select-all">
               {displayUrl}
             </p>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};