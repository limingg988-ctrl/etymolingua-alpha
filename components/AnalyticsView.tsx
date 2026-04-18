import React, { useMemo } from "react";
import { WordEntry, WordStatus } from "../types";

interface AnalyticsViewProps {
  words: WordEntry[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 28;

const STATUS_PRIORITY: Record<WordStatus, number> = {
  unknown: 0,
  learning: 1,
  mastered: 2,
};

const startOfDay = (time: number) => {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const formatDay = (time: number) =>
  new Date(time).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });

const getIntensityClass = (count: number) => {
  if (count === 0) return "bg-slate-100 border-slate-200";
  if (count === 1) return "bg-indigo-100 border-indigo-200";
  if (count <= 3) return "bg-indigo-300 border-indigo-300";
  if (count <= 5) return "bg-indigo-500 border-indigo-500";
  return "bg-indigo-700 border-indigo-700";
};

const StatCard: React.FC<{ title: string; value: string; subtitle: string; icon: string }> = ({
  title,
  value,
  subtitle,
  icon,
}) => (
  <article className="ui-glass ui-rounded-panel p-4 border border-slate-200/80">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-slate-500 font-bold tracking-wide uppercase">{title}</p>
        <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <i className={icon}></i>
      </div>
    </div>
  </article>
);

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ words }) => {
  const masteredCount = useMemo(
    () => words.filter((word) => word.status === "mastered").length,
    [words],
  );

  const estimatedAccuracy = useMemo(() => {
    if (words.length === 0) return 0;

    const attempts = words.reduce((sum, word) => {
      const reviewedBonus = word.status === "mastered" ? 2 : word.status === "learning" ? 1 : 0;
      return sum + Math.max(1, (word.streak ?? 0) + reviewedBonus);
    }, 0);

    const correct = words.reduce((sum, word) => {
      const statusCorrect = word.status === "mastered" ? 1 : 0;
      return sum + Math.max(0, word.streak ?? 0) + statusCorrect;
    }, 0);

    if (attempts === 0) return 0;
    return Math.min(100, Math.round((correct / attempts) * 100));
  }, [words]);

  const retentionRate = useMemo(() => {
    if (words.length === 0) return 0;

    const now = Date.now();
    const retained = words.filter((word) => {
      if (word.status === "mastered") return true;
      if ((word.interval ?? 0) >= 3 && (word.streak ?? 0) >= 1) return true;
      return (word.nextReviewDate ?? 0) > now && word.status !== "unknown";
    }).length;

    return Math.round((retained / words.length) * 100);
  }, [words]);

  const heatmap = useMemo(() => {
    const today = startOfDay(Date.now());
    const start = today - (HEATMAP_DAYS - 1) * DAY_MS;
    const activity = new Map<number, number>();

    words.forEach((word) => {
      const timestamps = [word.timestamp, word.updatedAt].filter(
        (value): value is number => typeof value === "number" && value > 0,
      );
      timestamps.forEach((ts) => {
        const day = startOfDay(ts);
        if (day < start || day > today) return;
        activity.set(day, (activity.get(day) || 0) + 1);
      });
    });

    return Array.from({ length: HEATMAP_DAYS }, (_, index) => {
      const day = start + index * DAY_MS;
      return {
        day,
        count: activity.get(day) || 0,
      };
    });
  }, [words]);

  const difficultWords = useMemo(() => {
    return [...words]
      .sort((a, b) => {
        const aScore =
          STATUS_PRIORITY[a.status] +
          (a.streak ?? 0) * 0.25 +
          (a.interval ?? 0) * 0.1 +
          ((a.nextReviewDate ?? 0) > Date.now() ? 0.5 : 0);
        const bScore =
          STATUS_PRIORITY[b.status] +
          (b.streak ?? 0) * 0.25 +
          (b.interval ?? 0) * 0.1 +
          ((b.nextReviewDate ?? 0) > Date.now() ? 0.5 : 0);
        if (aScore !== bScore) return aScore - bScore;
        return b.timestamp - a.timestamp;
      })
      .slice(0, 8);
  }, [words]);

  if (words.length === 0) {
    return (
      <section className="ui-glass ui-rounded-panel border border-dashed border-slate-300 p-10 text-center text-slate-500">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <i className="fa-solid fa-chart-column text-xl"></i>
        </div>
        <h2 className="text-lg font-bold text-slate-700">分析データがまだありません</h2>
        <p className="text-sm mt-2">単語を追加・学習すると、ここに指標とヒートマップが表示されます。</p>
      </section>
    );
  }

  return (
    <section className="view-stack">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="総習得数"
          value={`${masteredCount}`}
          subtitle={`${words.length}語中 mastered`}
          icon="fa-solid fa-trophy"
        />
        <StatCard
          title="正答率"
          value={`${estimatedAccuracy}%`}
          subtitle="status + streak から推定"
          icon="fa-solid fa-bullseye"
        />
        <StatCard
          title="保持率"
          value={`${retentionRate}%`}
          subtitle="SRSのinterval / review日を反映"
          icon="fa-solid fa-shield-heart"
        />
      </div>

      <article className="ui-glass ui-rounded-panel p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">一貫性ヒートマップ（直近28日）</h3>
          <span className="text-xs text-slate-500">日次アクティビティの簡易表示</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {heatmap.map((cell) => (
            <div
              key={cell.day}
              className={`h-9 rounded-md border ${getIntensityClass(cell.count)} relative group`}
              title={`${formatDay(cell.day)}: ${cell.count}件`}
            >
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatDay(cell.day)} ({cell.count})
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="ui-glass ui-rounded-panel p-4 border border-slate-200/80">
        <h3 className="font-bold text-slate-800 mb-3">難単語リスト（mastery低い順）</h3>
        <div className="space-y-2">
          {difficultWords.map((word, index) => (
            <div
              key={word.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">
                  {index + 1}. {word.word}
                </p>
                <p className="text-xs text-slate-500 truncate">{word.meaning}</p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  word.status === "unknown"
                    ? "bg-rose-100 text-rose-600"
                    : word.status === "learning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {word.status}
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
