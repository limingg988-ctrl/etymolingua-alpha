
import React, { useState } from 'react';
import { BookMetadata } from '../types';

interface BookListModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookMetadata[];
  currentBookId: string;
  onSelectBook: (id: string) => void;
  onCreateBook: (title: string, description: string) => void;
  onDeleteBook: (id: string) => void;
  onRenameBook: (id: string, newTitle: string) => void;
  allBookId?: string; // ID for "All Words" view
  allWordsCount?: number; // Total count for "All Words"
}

export const BookListModal: React.FC<BookListModalProps> = ({ 
  isOpen, onClose, books, currentBookId, onSelectBook, onCreateBook, onDeleteBook, onRenameBook, allBookId, allWordsCount
}) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreateBook(newTitle.trim(), newDesc.trim());
      setNewTitle('');
      setNewDesc('');
      setView('list');
    }
  };

  const startEdit = (book: BookMetadata) => {
    setEditingId(book.id);
    setEditTitle(book.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameBook(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-book-journal-whills text-indigo-500"></i>
            単語帳の管理
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {view === 'list' ? (
            <div className="space-y-3">
              
              {/* Special "All Words" View */}
              {allBookId && (
                <div 
                  className={`group relative flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer mb-4 ${
                    currentBookId === allBookId
                      ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200 ring-offset-2' 
                      : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                  onClick={() => onSelectBook(allBookId)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg shrink-0 ${
                     currentBookId === allBookId ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <i className="fa-solid fa-layer-group"></i>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${currentBookId === allBookId ? 'text-indigo-900' : 'text-slate-700'}`}>
                      📂 すべての単語
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      単語帳に関係なく全データを表示 ({allWordsCount ?? '-'})
                    </p>
                  </div>

                  {currentBookId === allBookId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                  )}
                </div>
              )}

              <div className="h-px bg-slate-100 mb-4"></div>

              {books.map(book => (
                <div 
                  key={book.id} 
                  className={`group relative flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    currentBookId === book.id 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm'
                  }`}
                  onClick={() => onSelectBook(book.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg shrink-0 ${
                     currentBookId === book.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <i className="fa-solid fa-book"></i>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === book.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 border border-indigo-300 rounded text-sm"
                          autoFocus
                        />
                        <button onClick={saveEdit} className="text-emerald-500"><i className="fa-solid fa-check"></i></button>
                      </div>
                    ) : (
                      <>
                        <h3 className={`font-bold text-sm truncate ${currentBookId === book.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {book.title}
                        </h3>
                        {book.description && <p className="text-xs text-slate-400 truncate">{book.description}</p>}
                      </>
                    )}
                  </div>

                  {currentBookId === book.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
                      <i className="fa-solid fa-check-circle"></i>
                    </div>
                  )}

                  {/* Actions (Only show for non-default or if editable) */}
                  <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 bg-white/80 backdrop-blur rounded-lg p-1 shadow-sm" onClick={e => e.stopPropagation()}>
                     <button 
                       onClick={() => startEdit(book)}
                       className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-500 rounded hover:bg-indigo-50"
                     >
                       <i className="fa-solid fa-pen text-xs"></i>
                     </button>
                     {book.id !== 'default' && (
                       <button 
                         onClick={() => {
                           if(window.confirm(`「${book.title}」を削除しますか？\n含まれる単語もすべて削除されます。`)) {
                             onDeleteBook(book.id);
                           }
                         }}
                         className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                       >
                         <i className="fa-solid fa-trash-can text-xs"></i>
                       </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">単語帳の名前</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="例: TOEIC対策, 旅行英会話"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">説明（任意）</label>
                <input 
                  type="text" 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="用途や目標など"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setView('list')}
                  className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  作成する
                </button>
              </div>
            </form>
          )}
        </div>

        {view === 'list' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => setView('create')}
              className="w-full py-3 bg-white border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> 新しい単語帳を作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
