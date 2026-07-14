import React, { useState, useRef } from 'react';
import { WORD_BOOKS, WordBook } from '../data/wordBooks';
import { TroubleReportForm } from './TroubleReportForm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onLoadBook?: (bookData: any[]) => void;
  onRebuildBooks?: () => void;
  wordCount: number;
  user: any;
  showToast: (message: string, type?: any) => void;
  onReportIssue?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, onExportJSON, onImportJSON, onLoadBook, onRebuildBooks, wordCount, user, showToast, onReportIssue
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'library'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Confirm is handled in App.tsx for better granularity (Merge vs Replace)
      onImportJSON(file);
      onClose();
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadPreset = (book: WordBook) => {
    if (!onLoadBook) return;
    if (window.confirm(`「${book.title}」の単語（${book.data.length}語）を現在のリストに追加しますか？\n※既存の単語と重複する場合はスキップされます。`)) {
      onLoadBook(book.data);
      alert('追加しました！');
      onClose();
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-gear text-slate-500"></i>
            設定・データ管理
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'general' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-sliders mr-2"></i>一般
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'library' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-book-open mr-2"></i>ライブラリ
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-200">
              {/* Data Management Section */}
              <div>
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-600">同期アカウント UID</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-800">
                    {user?.uid || '未ログイン'}
                  </p>
                </div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <i className="fa-solid fa-database text-indigo-500 mr-2"></i>データバックアップ・復元
                </label>
                <p className="text-xs text-slate-500 mb-4">
                  現在の単語数: <span className="font-bold text-slate-700">{wordCount}</span><br/>
                  データをJSONファイルとして保存したり、保存したファイルを読み込んで復元・追加することができます。
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onExportJSON}
                    className="flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors group"
                  >
                    <i className="fa-solid fa-download text-indigo-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                    <span className="text-xs font-bold text-indigo-800">データをJSONで保存</span>
                    <span className="text-[10px] text-indigo-400 mt-1">(Export Backup)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors group"
                  >
                    <i className="fa-solid fa-file-import text-emerald-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                    <span className="text-xs font-bold text-emerald-800">ファイルから追加・復元</span>
                    <span className="text-[10px] text-emerald-500 mt-1">(Import / Merge)</span>
                  </button>
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 gap-2">
                  {onReportIssue && (
                    <button
                      onClick={onReportIssue}
                      className="w-full py-3 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-bug"></i>
                      問題を報告
                    </button>
                  )}
                   {onRebuildBooks && (
                    <button
                      onClick={() => {
                          if(window.confirm("単語はあるのに単語帳が表示されない場合に使用します。\n全ての単語をスキャンして、単語帳を再作成しますか？")) {
                              onRebuildBooks();
                          }
                      }}
                      className="w-full py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                    >
                       <i className="fa-solid fa-wrench"></i>
                       単語帳の構成を修復
                    </button>
                  )}

                  <TroubleReportForm user={user} showToast={showToast} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="animate-in slide-in-from-right-4 duration-200">
               <div className="mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                 <p className="text-xs text-indigo-800">
                   <i className="fa-solid fa-circle-info mr-2"></i>
                   用意された単語帳を選んで、現在のリストに追加できます。学習したいジャンルを選んでください。
                 </p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {WORD_BOOKS.map(book => (
                   <button
                    key={book.id}
                    onClick={() => handleLoadPreset(book)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all text-left group flex flex-col h-full"
                   >
                     <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${book.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                       <i className={`fa-solid ${book.icon} text-xl`}></i>
                     </div>
                     <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                       {book.title}
                     </h3>
                     <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow">
                       {book.description}
                     </p>
                     <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          {book.data.length} Words
                        </span>
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          追加する <i className="fa-solid fa-arrow-right"></i>
                        </span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
