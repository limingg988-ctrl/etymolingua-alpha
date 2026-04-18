import React from "react";

interface HeatmapCell {
  day: number;
  count: number;
}

interface LearningHeatmapPanelProps {
  heatmap: HeatmapCell[];
  getIntensityClass: (count: number) => string;
  formatDay: (time: number) => string;
}

export const LearningHeatmapPanel: React.FC<LearningHeatmapPanelProps> = React.memo(({
  heatmap,
  getIntensityClass,
  formatDay,
}) => (
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
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none whitespace-nowrap">
            {formatDay(cell.day)} ({cell.count})
          </span>
        </div>
      ))}
    </div>
  </article>
));

LearningHeatmapPanel.displayName = "LearningHeatmapPanel";
