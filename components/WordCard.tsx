import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WordEntry, WordStatus } from '../types';

interface WordCardProps {
  word: WordEntry;
  onDelete?: (id: string) => void;
  onSearchRelated?: (word: string) => void;
  onStatusChange?: (id: string, status: WordStatus) => void;
  compact?: boolean;
  onOpenDetail?: (word: WordEntry) => void;
}

const extractRootChips = (text: string) => {
  const roots = text.match(/-[a-z]{2,}/gi) || [];
  return Array.from(new Set(roots.map((root) => root.toLowerCase()))).slice(0, 3);
};

const truncate = (value: string, max = 88) =>
  value.length > max ? `${value.slice(0, max).trim()}…` : value;

const WordCardComponent: React.FC<WordCardProps> = ({
  word,
  onDelete,
  onSearchRelated,
  onStatusChange,
  compact = false,
  onOpenDetail,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  // スペースを含む場合は熟語（Idiom）とみなす
  const isIdiom = useMemo(() => word.word.trim().includes(' '), [word.word]);
  const roots = useMemo(() => extractRootChips(word.etymology), [word.etymology]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      alert("お使いのブラウザは音声読み上げに対応していません。");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (isPlaying) return;
    speakText(word.word);
  }, [isPlaying, speakText, word.word]);

  const playSentence = useCallback(() => {
    if (isPlaying) return;
    speakText(word.exampleSentence);
  }, [isPlaying, speakText, word.exampleSentence]);

  const StatusButton = ({ status, icon, label, colorClass, activeClass }: { status: WordStatus, icon: string, label: string, colorClass: string, activeClass: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onStatusChange?.(word.id, status);
      }}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
        word.status === status 
          ? `${activeClass} shadow-inner scale-105` 
          : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
      }`}
      title={`${label}にする`}
    >
      <i className={`fa-solid ${icon}`}></i>
      <span>{label}</span>
    </button>
  );

  if (compact) {
    return (
      <article
        id={word.id}
        onClick={() => onOpenDetail?.(word)}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all motion-reduce:transition-none motion-reduce:hover:translate-y-0 space-y-3 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{word.word}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{word.meaning}</p>
          </div>
          <span
            className={`text-[11px] px-2 py-1 rounded-full border shrink-0 font-bold ${
              word.status === "mastered"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : word.status === "learning"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {word.status === "mastered" ? "Mastered" : word.status === "learning" ? "Practice" : "New"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {roots.map((root) => (
            <button
              key={root}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchRelated?.(root);
              }}
              className="text-[11px] px-2 py-1 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            >
              {root}
            </button>
          ))}
          {roots.length === 0 && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-slate-200 text-slate-500 bg-slate-50">
              root未抽出
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{truncate(word.logic || word.mnemonic, 100)}</p>
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span className="text-[11px] text-slate-400">
            {new Date(word.timestamp).toLocaleDateString()}
          </span>
          <span className="font-semibold text-indigo-600">詳細を見る →</span>
        </div>
      </article>
    );
  }

  return (
    <div 
      id={word.id}
      className={`bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 motion-reduce:transition-none group scroll-mt-24 ${
        word.status === 'mastered' ? 'border-emerald-200 shadow-emerald-50' : 
        word.status === 'learning' ? 'border-amber-200 shadow-amber-50' : 
        'border-slate-200'
      }`}
    >
      {/* Header Section */}
      <div className={`bg-gradient-to-br ${isIdiom ? 'from-amber-50 to-white' : 'from-indigo-50 to-white'} p-6 border-b border-slate-100 relative`}>
        
        {/* Idiom Badge */}
        {isIdiom && (
          <div className="absolute top-0 left-0 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-br-2xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 shadow-sm border-r border-b border-amber-200">
             <i className="fa-solid fa-puzzle-piece"></i> Idiom
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4 flex gap-1 bg-slate-100/80 p-1.5 rounded-xl backdrop-blur-sm z-10 shadow-sm border border-slate-200">
           <StatusButton 
             status="unknown" 
             icon="fa-xmark" 
             label="未" 
             colorClass="text-red-500" 
             activeClass="bg-red-500 text-white border border-red-600 ring-2 ring-red-100"
           />
           <StatusButton 
             status="learning" 
             icon="fa-play" 
             label="中" 
             colorClass="text-amber-500" 
             activeClass="bg-amber-500 text-white border border-amber-600 ring-2 ring-amber-100"
           />
           <StatusButton 
             status="mastered" 
             icon="fa-check" 
             label="済" 
             colorClass="text-emerald-500" 
             activeClass="bg-emerald-500 text-white border border-emerald-600 ring-2 ring-emerald-100"
           />
        </div>

        <div className="space-y-1 pr-32 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{word.word}</h3>
              <span className="text-sm font-medium text-slate-400 font-mono">{word.pronunciation}</span>
            </div>
            
            <button 
              onClick={handlePlayAudio}
              disabled={isPlaying}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0 ${
                isPlaying 
                  ? 'bg-indigo-100 text-indigo-400' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95 motion-reduce:active:scale-100'
              }`}
              title="発音を聞く"
            >
              {isPlaying ? (
                <i className={`fa-solid fa-spinner text-xs ${prefersReducedMotion ? "" : "animate-spin"}`}></i>
              ) : (
                <i className="fa-solid fa-volume-high text-xs"></i>
              )}
            </button>
          </div>
          <p className="text-xl font-bold text-indigo-600">{word.meaning}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Core Learning Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
            <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
              <i className="fa-solid fa-seedling"></i> {isIdiom ? '構成イメージ (Imagery)' : '語源 (Etymology)'}
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm">
              {word.etymology}
            </p>
          </section>

          <section className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
            <h4 className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-widest mb-3">
              <i className="fa-solid fa-brain"></i> 覚え方 (Mnemonic)
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm italic">
              {word.mnemonic}
            </p>
          </section>
        </div>

        {/* Deep Understanding Section */}
        <section className="relative pl-4 border-l-4 border-amber-400">
          <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
            <i className="fa-solid fa-lightbulb"></i> なぜこの意味？ (The Logic)
          </h4>
          <p className="text-slate-700 leading-relaxed text-sm">
            {word.logic}
          </p>
        </section>

        {/* Practical Usage Section */}
        <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <i className="fa-solid fa-link"></i> 相性の良い言葉
              </h4>
              <div className="flex flex-wrap gap-2">
                {word.collocations.map((col, idx) => (
                  <span key={idx} className="text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium flex flex-col items-start gap-0.5">
                    <span className="leading-tight">{col.term}</span>
                    {col.translation && (
                      <span className="text-[9px] text-slate-400 leading-tight">{col.translation}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <i className="fa-solid fa-tags"></i> 類義語
              </h4>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.map((syn, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onSearchRelated?.(syn.term)}
                    className="text-xs bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors flex flex-col items-start gap-0.5 group/syn text-left"
                  >
                    <span className="font-bold leading-tight group-hover/syn:underline">{syn.term}</span>
                    {syn.translation && (
                      <span className="text-[9px] text-indigo-400 leading-tight font-normal">{syn.translation}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Idioms Section */}
          <div className="border-t border-slate-200 pt-3">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <i className="fa-solid fa-shapes"></i> {isIdiom ? '関連表現' : '重要熟語・慣用句'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {word.idioms && word.idioms.length > 0 ? (
                  word.idioms.map((idiom, idx) => (
                    <button 
                      key={idx}
                      onClick={() => onSearchRelated?.(idiom.term)}
                      className="text-xs bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 text-amber-800 hover:bg-amber-100 transition-colors flex flex-col items-start gap-0.5 group/idiom text-left"
                    >
                      <span className="font-medium leading-tight group-hover/idiom:underline">{idiom.term}</span>
                      {idiom.translation && (
                        <span className="text-[9px] text-amber-600/70 leading-tight font-normal">{idiom.translation}</span>
                      )}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">特になし</span>
                )}
              </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              ニュアンス・使い分け
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {word.nuance}
            </p>
          </div>
        </div>

        {/* Example Sentence Section */}
        <section className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
              Real Example
            </h4>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-indigo-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title={showTranslation ? "日本語訳を隠す" : "日本語訳を表示"}
              >
                <i className={`fa-solid ${showTranslation ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                <span className="hidden sm:inline">{showTranslation ? '隠す' : '訳'}</span>
              </button>
              <button 
                onClick={playSentence}
                disabled={isPlaying}
                className="text-indigo-200 hover:text-white transition-colors motion-reduce:transition-none"
                title="例文を読み上げる"
              >
                <i className={`fa-solid ${isPlaying ? `fa-spinner ${prefersReducedMotion ? "" : "animate-spin"}` : 'fa-volume-low'} text-xs`}></i>
              </button>
            </div>
          </div>
          <p className="text-lg font-medium italic leading-snug">
            "{word.exampleSentence}"
          </p>
          
          {word.exampleSentenceTranslation && (
            <div className={`transition-all duration-300 motion-reduce:transition-none overflow-hidden ${showTranslation ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
              <p className="text-sm text-indigo-200 font-medium border-t border-indigo-500/30 pt-2">
                {word.exampleSentenceTranslation}
              </p>
            </div>
          )}
        </section>

        {/* Word Family Section */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Derivatives Section */}
          <div>
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-code-branch text-emerald-500"></i> {isIdiom ? '関連語形' : '派生語 (Derivatives)'}
            </h4>
            <div className="flex flex-wrap gap-2">
               {word.derivatives && word.derivatives.length > 0 ? (
                 word.derivatives.map((der, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onSearchRelated?.(der)}
                    className="text-xs bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    {der}
                  </button>
                ))
               ) : (
                 <span className="text-xs text-slate-400">なし</span>
               )}
            </div>
          </div>

          {/* Related Roots Section */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-network-wired text-indigo-400"></i> 語源の仲間 (Roots)
            </h4>
            <div className="flex flex-wrap gap-2">
              {word.relatedWords.map((rel, idx) => (
                <button 
                  key={idx} 
                  onClick={() => onSearchRelated?.(rel.term)}
                  title={`「${rel.term}」を検索`}
                  className="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex flex-col items-start gap-0.5 group/rel shadow-sm text-left"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{rel.term}</span>
                    <i className="fa-solid fa-magnifying-glass text-[8px] text-slate-300 group-hover/rel:text-indigo-300"></i>
                  </div>
                  {rel.translation && (
                    <span className="text-[9px] text-slate-400 group-hover/rel:text-indigo-400 font-normal leading-tight">{rel.translation}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer Timestamp & Delete */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <div className="flex gap-2">
           <a 
            href={`https://www.etymonline.com/word/${word.word.split(' ')[0]}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 bg-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
            title="Etymonlineで正確な語源を確認する"
            onClick={(e) => e.stopPropagation()}
           >
             <i className="fa-solid fa-book-open"></i>
             <span className="hidden sm:inline">語源辞書で確認</span>
           </a>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium">
            Added on {new Date(word.timestamp).toLocaleDateString()}
          </span>
          
          {onDelete ? (
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
                className="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 group/del"
                title="ゴミ箱へ移動"
              >
                <i className="fa-solid fa-trash-can text-slate-300 group-hover/del:text-red-500"></i>
                <span className="font-medium">削除</span>
              </button>
          ) : (
            <div></div> 
          )}
        </div>
      </div>
    </div>
  );
};

export const WordCard = React.memo(WordCardComponent);
