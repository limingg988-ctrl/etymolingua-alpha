
import React, { useState } from 'react';
import { NoteEntry } from '../types';

interface SmartNotebookProps {
  notes: NoteEntry[];
  onDeleteNote: (id: string) => void;
}

export const SmartNotebook: React.FC<SmartNotebookProps> = ({ notes, onDeleteNote }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 px-6">
        <div className="text-indigo-100 text-6xl mb-6">
          <i className="fa-solid fa-book-open"></i>
        </div>
        <h3 className="text-slate-700 font-bold text-xl mb-4">まだノートがありません</h3>
        
        <div className="max-w-md mx-auto text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm font-bold mb-3">ノートの作り方：</p>
            <ol className="list-decimal list-inside text-slate-600 text-sm space-y-2">
                <li><span className="font-bold text-indigo-600">Study Chat</span> タブを開く</li>
                <li>AI先生に質問したり、クイズを出してもらう</li>
                <li>会話が終わったら、画面右上の<span className="font-bold text-emerald-600"><i className="fa-solid fa-floppy-disk mx-1"></i>ノートに保存</span>ボタンを押す</li>
            </ol>
            <p className="text-xs text-slate-400 mt-4">
                ※ 会話の内容をAIが自動的に要約し、復習しやすい形式（マークダウン）でここに保存します。
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div 
            onClick={() => toggleExpand(note.id)}
            className="p-5 cursor-pointer flex justify-between items-start bg-amber-50/30"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {note.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{note.title}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {new Date(note.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-slate-400">
              <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${expandedId === note.id ? 'rotate-180' : ''}`}></i>
            </div>
          </div>

          {expandedId === note.id && (
            <div className="p-5 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
              <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-700 prose-p:text-slate-600 prose-li:text-slate-600">
                {/* Simple Markdown Rendering */}
                {note.content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={idx} className="text-lg font-bold mt-3 mb-2">{line.slice(3)}</h2>;
                  if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc">{line.slice(2)}</li>;
                  if (line.trim() === '') return <br key={idx} />;
                  return <p key={idx} className="mb-2">{line}</p>;
                })}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                  className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <i className="fa-solid fa-trash-can"></i> 削除
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
