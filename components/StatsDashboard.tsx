import React, { useMemo } from 'react';
import { WordEntry } from '../types';

interface StatsDashboardProps {
  history: WordEntry[];
  onStartDailyQuiz: (words: WordEntry[]) => void;
}

const DAILY_TARGET = 5;

const getISODate = (timestamp: number) => new Date(timestamp).toISOString().split('T')[0];

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ history, onStartDailyQuiz }) => {
  const {
    totalCount,
    masteredCount,
    learningCount,
    unknownCount,
    masteryPercent,
    todayAdded,
    recentReviewWords,
    wordOfTheDay,
    welcomeText,
  } = useMemo(() => {
    const total = history.length;
    const mastered = history.filter((w) => w.status === 'mastered').length;
    const learning = history.filter((w) => w.status === 'learning').length;
    const unknown = history.filter((w) => w.status === 'unknown').length;

    const todayIso = new Date().toISOString().split('T')[0];
    const addedToday = history.filter((w) => getISODate(w.timestamp) === todayIso).length;

    const reviewCandidates = history
      .filter((w) => w.status === 'unknown' || w.status === 'learning')
      .sort((a, b) => a.timestamp - b.timestamp);

    const fallbackMastered = history
      .filter((w) => w.status === 'mastered')
      .sort((a, b) => a.timestamp - b.timestamp);

    const reviewWords = [...reviewCandidates, ...fallbackMastered]
      .filter((word, index, arr) => arr.findIndex((item) => item.id === word.id) === index)
      .slice(0, DAILY_TARGET);

    const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    const source = history.length > 0 ? [...history].sort((a, b) => a.timestamp - b.timestamp) : [];
    const selected = source.length > 0 ? source[daySeed % source.length] : null;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return {
      totalCount: total,
      masteredCount: mastered,
      learningCount: learning,
      unknownCount: unknown,
      masteryPercent: total === 0 ? 0 : Math.round((mastered / total) * 100),
      todayAdded: addedToday,
      recentReviewWords: reviewWords,
      wordOfTheDay: selected,
      welcomeText: `${greeting}! Keep your momentum going.`,
    };
  }, [history]);

  return (
    <section className="rounded-3xl border border-surface-200 bg-white p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        <article className="rounded-2xl border border-surface-200 bg-surface-50 p-4 md:col-span-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Welcome</p>
          <h2 className="mt-2 text-2xl font-bold text-surface-900">{welcomeText}</h2>
          <p className="mt-2 text-sm text-surface-600">You have logged {totalCount} words so far.</p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Overall Mastery</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black text-emerald-700">{masteryPercent}%</span>
            <span className="pb-1 text-sm text-emerald-700/90">mastered</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${masteryPercent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-surface-700">
            <div>✅ {masteredCount}</div>
            <div>🟡 {learningCount}</div>
            <div>🔴 {unknownCount}</div>
          </div>
        </article>

        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Word of the Day</p>
          {wordOfTheDay ? (
            <>
              <h3 className="mt-3 text-2xl font-bold text-indigo-900">{wordOfTheDay.word}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-indigo-800/90">{wordOfTheDay.meaning}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-indigo-800/90">Add your first word to unlock Word of the Day.</p>
          )}
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Reviews</p>
          <p className="mt-2 text-sm text-amber-900">Today: {todayAdded}/{DAILY_TARGET} new words</p>
          <p className="mt-1 text-xs text-amber-800/90">Words to Review: {recentReviewWords.length}</p>
          <button
            onClick={() => onStartDailyQuiz(recentReviewWords)}
            disabled={recentReviewWords.length === 0}
            className="mt-4 w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            Words to Review
          </button>
        </article>
      </div>
    </section>
  );
};
