import React, { useEffect, useMemo, useState } from "react";
import { WordEntry } from "../types";

interface WordIntelligenceViewProps {
  word: WordEntry;
  onBack: () => void;
  onSearchRelated?: (term: string) => void;
  onMarkMastered: () => void;
  onPractice: () => void;
  onStartQuiz: () => void;
}

type SemanticNode = {
  id: string;
  term: string;
  translation?: string;
  group: "synonym" | "idiom" | "related";
};

const parseRoots = (etymology: string): string[] => {
  const roots = etymology.match(/-[a-z]{2,}/gi) || [];
  return Array.from(new Set(roots.map((root) => root.toLowerCase())));
};

export const WordIntelligenceView: React.FC<WordIntelligenceViewProps> = ({
  word,
  onBack,
  onSearchRelated,
  onMarkMastered,
  onPractice,
  onStartQuiz,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSemanticOpen, setIsSemanticOpen] = useState(true);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    setIsSemanticOpen(!isMobile);
  }, [word.id]);

  const roots = useMemo(() => parseRoots(word.etymology), [word.etymology]);

  const semanticNodes = useMemo<SemanticNode[]>(() => {
    const source: SemanticNode[] = [
      ...word.synonyms.map((item) => ({
        id: `syn-${item.term}`,
        term: item.term,
        translation: item.translation,
        group: "synonym" as const,
      })),
      ...word.idioms.map((item) => ({
        id: `idiom-${item.term}`,
        term: item.term,
        translation: item.translation,
        group: "idiom" as const,
      })),
      ...word.relatedWords.map((item) => ({
        id: `related-${item.term}`,
        term: item.term,
        translation: item.translation,
        group: "related" as const,
      })),
    ];

    return Array.from(new Map(source.map((node) => [node.id, node])).values()).slice(0, 18);
  }, [word.idioms, word.relatedWords, word.synonyms]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis || isPlaying) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        ← 一覧に戻る
      </button>

      <article className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <header className="p-5 md:p-7 bg-gradient-to-br from-indigo-50 to-white border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-600">Word Intelligence</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">{word.word}</h2>
              <p className="text-sm text-slate-500 font-mono mt-1">{word.pronunciation}</p>
            </div>
            <button
              type="button"
              onClick={() => speakText(word.word)}
              disabled={isPlaying}
              className="self-start px-3 py-2 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isPlaying ? "再生中..." : "🔊 発音"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onMarkMastered}
              className="px-4 py-2 text-sm rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Mastered
            </button>
            <button
              type="button"
              onClick={onPractice}
              className="px-4 py-2 text-sm rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            >
              Practice
            </button>
            <button
              type="button"
              onClick={onStartQuiz}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Quiz
            </button>
          </div>
        </header>

        <div className="p-5 md:p-7 space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Definition</h3>
            <p className="text-xl font-bold text-slate-900">{word.meaning}</p>
            <p className="text-slate-600 leading-relaxed">{word.logic || word.mnemonic}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Root Map</h3>
            <div className="flex flex-wrap gap-2">
              {roots.length > 0 ? (
                roots.map((root) => (
                  <button
                    key={root}
                    type="button"
                    onClick={() => onSearchRelated?.(root)}
                    className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
                  >
                    {root}
                  </button>
                ))
              ) : (
                <span className="text-sm text-slate-500">rootが見つかりませんでした</span>
              )}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{word.etymology}</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Semantic Web</h3>
              <button
                type="button"
                onClick={() => setIsSemanticOpen((prev) => !prev)}
                className="md:hidden text-xs font-semibold text-indigo-600"
              >
                {isSemanticOpen ? "折りたたむ" : "展開する"}
              </button>
            </div>

            {isSemanticOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {semanticNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onSearchRelated?.(node.term)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      node.group === "synonym"
                        ? "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                        : node.group === "idiom"
                          ? "bg-amber-50 border-amber-100 hover:bg-amber-100"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{node.term}</p>
                    {node.translation && <p className="text-xs text-slate-500">{node.translation}</p>}
                  </button>
                ))}
                {semanticNodes.length === 0 && (
                  <p className="text-sm text-slate-500">関連ノードがありません。</p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Usage History</h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm text-slate-800 italic">“{word.exampleSentence}”</p>
              {word.exampleSentenceTranslation && (
                <p className="text-xs text-slate-500">{word.exampleSentenceTranslation}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                <span>追加日: {new Date(word.timestamp).toLocaleDateString()}</span>
                <span>状態: {word.status}</span>
              </div>
            </div>
          </section>
        </div>
      </article>
    </section>
  );
};
