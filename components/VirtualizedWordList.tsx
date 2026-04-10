import React, { useEffect, useMemo, useState } from "react";
import { WordEntry } from "../types";
import { WordCard } from "./WordCard";

type VirtualizedWordListProps = {
  words: WordEntry[];
  onDelete: (id: string) => void | Promise<void>;
  onSearchRelated: (word: string) => void | Promise<void>;
  onStatusChange: (id: string, status: WordEntry["status"]) => void | Promise<void>;
};

const INITIAL_LIST_RENDER_LIMIT = 120;
const LIST_RENDER_STEP = 120;
const VIRTUAL_ROW_HEIGHT = 360;
const VIRTUAL_OVERSCAN = 3;
const VIRTUAL_LIST_HEIGHT = 720;

export const VirtualizedWordList: React.FC<VirtualizedWordListProps> = ({
  words,
  onDelete,
  onSearchRelated,
  onStatusChange,
}) => {
  const [listRenderLimit, setListRenderLimit] = useState(INITIAL_LIST_RENDER_LIMIT);
  const [listScrollTop, setListScrollTop] = useState(0);

  useEffect(() => {
    setListRenderLimit(INITIAL_LIST_RENDER_LIMIT);
    setListScrollTop(0);
  }, [words]);

  const boundedWords = useMemo(
    () => words.slice(0, listRenderLimit),
    [words, listRenderLimit],
  );
  const canLoadMoreListItems = boundedWords.length < words.length;

  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(VIRTUAL_LIST_HEIGHT / VIRTUAL_ROW_HEIGHT);
    const startIndex = Math.max(
      0,
      Math.floor(listScrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
    );
    const endIndex = Math.min(
      boundedWords.length,
      startIndex + visibleCount + VIRTUAL_OVERSCAN * 2,
    );
    return { startIndex, endIndex };
  }, [boundedWords.length, listScrollTop]);

  return (
    <div className="space-y-4">
      <div
        className="overflow-y-auto rounded-2xl"
        style={{ height: VIRTUAL_LIST_HEIGHT }}
        onScroll={(event) => setListScrollTop(event.currentTarget.scrollTop)}
      >
        <div
          style={{
            paddingTop: visibleRange.startIndex * VIRTUAL_ROW_HEIGHT,
            paddingBottom:
              (boundedWords.length - visibleRange.endIndex) * VIRTUAL_ROW_HEIGHT,
          }}
        >
          {boundedWords
            .slice(visibleRange.startIndex, visibleRange.endIndex)
            .map((word) => (
              <div key={word.id} className="px-1" style={{ minHeight: VIRTUAL_ROW_HEIGHT }}>
                <WordCard
                  word={word}
                  onDelete={onDelete}
                  onSearchRelated={onSearchRelated}
                  onStatusChange={onStatusChange}
                />
              </div>
            ))}
        </div>
      </div>
      {canLoadMoreListItems && (
        <button
          type="button"
          onClick={() =>
            setListRenderLimit((prev) =>
              Math.min(prev + LIST_RENDER_STEP, words.length),
            )
          }
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-2xl font-bold transition-colors"
        >
          もっと見る（残り {words.length - boundedWords.length} 件）
        </button>
      )}
    </div>
  );
};
