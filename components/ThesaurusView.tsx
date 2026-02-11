import React, { useState, useMemo } from 'react';
import { WordEntry, TranslationItem } from '../types';

interface ThesaurusViewProps {
  history: WordEntry[];
  onSearch: (word: string) => void;
}

export const ThesaurusView: React.FC<ThesaurusViewProps> = ({ history, onSearch }) => {
  const [filter, setFilter] = useState('');
  const [showIdiomsOnly, setShowIdiomsOnly] = useState(false);

  const filteredData = useMemo(() => {
    let result = history;

    // Apply Idiom Filter first if active
    if (showIdiomsOnly) {
        result = result.filter(item => item.word.trim().includes(' '));
    }

    if (!filter) return result;

    const lowerFilter = filter.toLowerCase();
    return result.filter(item => 
      item.word.toLowerCase().includes(lowerFilter) ||
      item.meaning.toLowerCase().includes(lowerFilter) ||
      item.synonyms.some(s => s.term.toLowerCase().includes(lowerFilter)) ||
      (item.idioms && item.idioms.some(i => i.term.toLowerCase().includes(lowerFilter)))
    );
  }, [history, filter, showIdiomsOnly]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          <i className="fa-solid fa-diagram-project text-indigo-500 mr-2"></i>
          類語・熟語ノート
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          保存した単語のネットワークを可視化します。関連語や類義語、<span className="font-bold text-amber-500">熟語(Idiom)</span>から、言葉のニュアンスを深めましょう。
        </p>
        
        <div className="flex gap-2">
            <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="単語、意味、類義語、または熟語で検索..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button
                onClick={() => setShowIdiomsOnly(!showIdiomsOnly)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap border-2 ${
                    showIdiomsOnly 
                    ? 'bg-amber-50 text-amber-600 border-amber-400 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-500'
                }`}
            >
                {showIdiomsOnly ? <i className="fa-solid fa-check-square"></i> : <i className="fa-regular fa-square"></i>}
                <span className="hidden sm:inline">熟語のみ</span>
                <span className="sm:hidden">熟語</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((word) => (
            <div key={word.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-xl font-extrabold text-slate-800">{word.word}</h3>
                    <span className="text-sm font-medium text-slate-400 font-mono">{word.pronunciation}</span>
                  </div>
                  <p className="text-indigo-600 font-bold mt-1">{word.meaning}</p>
                </div>
                <button 
                  onClick={() => onSearch(word.word)}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors border border-slate-200"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                  詳細を見る
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Synonyms */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <i className="fa-solid fa-tags"></i> Synonyms (類義語)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {word.synonyms.length > 0 ? (
                      word.synonyms.map((syn, idx) => (
                        <button 
                          key={idx}
                          onClick={() => onSearch(syn.term)}
                          className="text-xs bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors text-left"
                        >
                          <span className="font-bold">{syn.term}</span>
                          {syn.translation && <span className="block text-[9px] text-indigo-400 font-normal">{syn.translation}</span>}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">なし</span>
                    )}
                  </div>
                </div>

                {/* Related & Roots */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <i className="fa-solid fa-network-wired"></i> Related (関連・語源)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {word.relatedWords.length > 0 ? (
                      word.relatedWords.map((rel, idx) => (
                        <button 
                          key={idx}
                          onClick={() => onSearch(rel.term)}
                          className="text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-200 hover:text-indigo-700 transition-colors text-left"
                        >
                          <span className="font-bold">{rel.term}</span>
                          {rel.translation && <span className="block text-[9px] text-slate-400 font-normal">{rel.translation}</span>}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">なし</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Idioms */}
              {word.idioms && word.idioms.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 border-dashed">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                    <i className="fa-solid fa-shapes mr-1"></i>
                    Idioms & Phrases
                  </h4>
                   <div className="flex flex-wrap gap-2">
                    {word.idioms.map((idiom, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSearch(idiom.term)}
                        className="text-xs bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 text-amber-800 hover:bg-amber-100 transition-colors text-left group/idiom"
                      >
                        <span className="font-medium group-hover/idiom:underline">{idiom.term}</span>
                        {idiom.translation && <span className="ml-1 opacity-70">- {idiom.translation}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">
                {showIdiomsOnly ? "熟語（スペースを含む項目）が見つかりません" : "単語または熟語が見つかりません"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};