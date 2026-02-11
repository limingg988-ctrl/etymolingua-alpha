
import React, { useMemo } from 'react';
import { WordEntry } from '../types';

interface StatsDashboardProps {
  history: WordEntry[];
  onStartDailyQuiz: (words: WordEntry[]) => void;
}

// 拡張されたレベル定義 (12段階)
const LEVELS = [
  { threshold: 0, name: 'Novice', jpName: '見習い', color: 'from-slate-400 to-slate-500', shadow: 'shadow-slate-500/50', icon: 'fa-egg' },
  { threshold: 5, name: 'Explorer', jpName: '探求者', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/50', icon: 'fa-compass' },
  { threshold: 15, name: 'Thinker', jpName: '思考者', color: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/50', icon: 'fa-lightbulb' },
  { threshold: 30, name: 'Scholar', jpName: '学者', color: 'from-cyan-400 to-blue-600', shadow: 'shadow-cyan-500/50', icon: 'fa-book-open' },
  { threshold: 50, name: 'Analyst', jpName: '分析家', color: 'from-blue-400 to-indigo-600', shadow: 'shadow-blue-500/50', icon: 'fa-magnifying-glass-chart' },
  { threshold: 80, name: 'Philosopher', jpName: '哲学者', color: 'from-indigo-400 to-violet-600', shadow: 'shadow-indigo-500/50', icon: 'fa-masks-theater' },
  { threshold: 120, name: 'Expert', jpName: '熟練者', color: 'from-violet-400 to-fuchsia-600', shadow: 'shadow-violet-500/50', icon: 'fa-user-graduate' },
  { threshold: 170, name: 'Master', jpName: '達人', color: 'from-fuchsia-400 to-pink-600', shadow: 'shadow-fuchsia-500/50', icon: 'fa-scroll' },
  { threshold: 230, name: 'Grandmaster', jpName: '大師範', color: 'from-rose-400 to-red-600', shadow: 'shadow-rose-500/50', icon: 'fa-medal' },
  { threshold: 300, name: 'Sage', jpName: '賢者', color: 'from-orange-400 to-amber-600', shadow: 'shadow-orange-500/50', icon: 'fa-hat-wizard' },
  { threshold: 400, name: 'Legend', jpName: '伝説', color: 'from-amber-300 to-yellow-500', shadow: 'shadow-amber-500/50', icon: 'fa-dragon' },
  { threshold: 500, name: 'Deus', jpName: '神話', color: 'from-yellow-200 via-white to-yellow-200', shadow: 'shadow-white/50', icon: 'fa-sun' },
];

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ history, onStartDailyQuiz }) => {
  const stats = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const counts = history.reduce((acc, word) => {
      const date = new Date(word.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return last7Days.map(date => ({
      date: date.split('-').slice(1).join('/'), // MM/DD format
      count: counts[date] || 0,
      isToday: date === new Date().toISOString().split('T')[0]
    }));
  }, [history]);

  const statusCounts = useMemo(() => ({
    mastered: history.filter(w => w.status === 'mastered').length,
    learning: history.filter(w => w.status === 'learning').length,
    unknown: history.filter(w => w.status === 'unknown').length,
  }), [history]);

  // AI Recommendation Logic (Smart Algorithm)
  const recommendedWords = useMemo(() => {
    // 1. Prioritize Problems: Unknown (×) and Learning (△)
    const problemWords = history
      .filter(w => w.status === 'unknown' || w.status === 'learning')
      .sort(() => Math.random() - 0.5); // Shuffle for variety

    // 2. Review Items: Mastered (○)
    // Sort by timestamp ASCENDING (Oldest first). 
    // This ensures newly mastered words (Newest) are at the bottom and less likely to be picked.
    const reviewWords = history
      .filter(w => w.status === 'mastered')
      .sort((a, b) => a.timestamp - b.timestamp);

    const TARGET_COUNT = 5;
    const REVIEW_COUNT = 1; // Try to include at least 1 review word if possible

    let selection: WordEntry[] = [];

    // Strategy: Fill mostly with problems, sprinkle some old reviews
    if (problemWords.length >= TARGET_COUNT - REVIEW_COUNT) {
        // We have enough problem words
        selection = problemWords.slice(0, TARGET_COUNT - REVIEW_COUNT);
        
        // Add review words if available, otherwise more problems
        if (reviewWords.length > 0) {
            selection.push(reviewWords[0]); // The oldest mastered word
        } else {
            // No reviews, fill with more problems
            if (problemWords.length > selection.length) {
                selection.push(problemWords[selection.length]);
            }
        }
    } else {
        // Not enough problem words, take all of them
        selection = [...problemWords];
        
        // Fill the rest with review words (oldest first)
        const needed = TARGET_COUNT - selection.length;
        selection.push(...reviewWords.slice(0, needed));
    }
    
    // Ensure unique IDs (just in case) and limit to TARGET_COUNT
    const uniqueTargets = Array.from(new Map(selection.map(item => [item.id, item])).values());
    
    return uniqueTargets.slice(0, TARGET_COUNT);
  }, [history]);

  const todayCount = stats.find(s => s.isToday)?.count || 0;
  const totalCount = history.length;
  const STORAGE_LIMIT = 2500;
  const DAILY_TARGET = 5;

  // Calculate Level Logic
  const currentLevelIndex = LEVELS.findIndex((lvl, idx) => {
    const nextLvl = LEVELS[idx + 1];
    return totalCount >= lvl.threshold && (!nextLvl || totalCount < nextLvl.threshold);
  });
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];
  const nextLevel = LEVELS[currentLevelIndex + 1];
  
  // Progress bar calculation
  let progressPercent = 0;
  let wordsToNext = 0;
  
  if (nextLevel) {
    const range = nextLevel.threshold - currentLevel.threshold;
    const progress = totalCount - currentLevel.threshold;
    progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
    wordsToNext = nextLevel.threshold - totalCount;
  } else {
    progressPercent = 100; // Max level reached
  }

  return (
    <div className="relative rounded-[2.5rem] bg-slate-900 p-1 shadow-2xl mb-12 overflow-hidden group">
      {/* Animated Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-1000"></div>
      
      {/* Main Card Content */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-[2.3rem] p-6 md:p-8 overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-600 rounded-full opacity-10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-emerald-600 rounded-full opacity-10 blur-[60px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* LEFT: Rank & Progress */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
               {/* Rank Icon */}
               <div className={`relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-3xl bg-gradient-to-br ${currentLevel.color} p-1 ${currentLevel.shadow} shadow-lg transform transition-transform hover:scale-105 duration-300`}>
                 <div className="absolute inset-0 bg-white/20 rounded-3xl backdrop-blur-sm"></div>
                 <div className="relative w-full h-full bg-slate-900/20 rounded-[1.4rem] flex items-center justify-center border border-white/20">
                   <i className={`fa-solid ${currentLevel.icon} text-4xl sm:text-5xl text-white drop-shadow-md`}></i>
                 </div>
                 {/* Shiny effect */}
                 <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl pointer-events-none"></div>
               </div>

               {/* Rank Details */}
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-indigo-200 tracking-wider uppercase backdrop-blur-md">
                     Current Rank
                   </span>
                   <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                     Lv.{currentLevelIndex + 1}
                   </span>
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
                   {currentLevel.jpName}
                 </h2>
                 <p className="text-sm font-medium text-slate-400">
                   {currentLevel.name}
                 </p>
               </div>

               {/* Total Count (Mobile: Hidden, Desktop: Shown here or below) */}
               <div className="hidden sm:block text-right">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {totalCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Words</div>
               </div>
            </div>

            {/* Progress Bar Section */}
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-end mb-3">
                <div className="text-xs font-bold text-slate-300">
                  経験値プログレス
                </div>
                {nextLevel ? (
                  <div className="text-xs font-medium text-indigo-300">
                    あと <span className="font-bold text-white text-lg mx-1">{wordsToNext}</span> 単語でランクアップ
                  </div>
                ) : (
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <i className="fa-solid fa-crown"></i> 最高ランク到達
                  </div>
                )}
              </div>
              
              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                 <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
                 <div 
                  className={`h-full bg-gradient-to-r ${currentLevel.color} relative transition-all duration-1000 ease-out`}
                  style={{ width: `${progressPercent}%` }}
                 >
                   <div className="absolute inset-0 w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                 </div>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                 <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                   <span className="flex items-center gap-1"><i className="fa-solid fa-check text-emerald-500"></i> {statusCounts.mastered}</span>
                   <span className="flex items-center gap-1"><i className="fa-solid fa-play text-amber-500"></i> {statusCounts.learning}</span>
                   <span className="flex items-center gap-1"><i className="fa-solid fa-xmark text-red-500"></i> {statusCounts.unknown}</span>
                 </div>
                 <div className="text-[9px] text-slate-500 font-mono">
                   STORAGE: {totalCount} / {STORAGE_LIMIT}
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Daily Quest (AI Recommendation) */}
          <div className="flex flex-col h-full">
            <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-2xl p-1 relative overflow-hidden group/quest hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-indigo-900/50">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="h-full bg-slate-900/40 backdrop-blur-sm rounded-xl p-5 flex flex-col justify-between relative z-10">
                 <div>
                   <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                       <i className="fa-solid fa-crosshairs"></i> Today's Quest
                     </p>
                     <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                       {todayCount}/{DAILY_TARGET} Added
                     </div>
                   </div>
                   
                   <h3 className="text-xl font-bold text-white mb-3">
                     AI Recommended Review
                   </h3>
                   
                   {recommendedWords.length > 0 ? (
                     <div className="space-y-2 mb-4">
                       <p className="text-xs text-indigo-100/80">
                         重点的に復習すべき{recommendedWords.length}語:
                       </p>
                       <div className="flex flex-wrap gap-1.5">
                         {recommendedWords.map(w => (
                           <span key={w.id} className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 ${
                                w.status === 'unknown' ? 'bg-red-500/30 border-red-400 text-red-100' :
                                w.status === 'learning' ? 'bg-amber-500/30 border-amber-400 text-amber-100' :
                                'bg-emerald-500/30 border-emerald-400 text-emerald-100'
                           }`}>
                             {w.status === 'unknown' && <i className="fa-solid fa-xmark text-[8px]"></i>}
                             {w.status === 'learning' && <i className="fa-solid fa-play text-[8px]"></i>}
                             {w.status === 'mastered' && <i className="fa-solid fa-check text-[8px]"></i>}
                             {w.word}
                           </span>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <p className="text-sm text-indigo-200 mb-4">
                       まだ復習対象がありません。<br/>まずは単語を検索して追加しましょう！
                     </p>
                   )}
                 </div>

                 <button
                   onClick={() => recommendedWords.length > 0 && onStartDailyQuiz(recommendedWords)}
                   disabled={recommendedWords.length === 0}
                   className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {recommendedWords.length > 0 ? (
                     <>
                       <i className="fa-solid fa-gamepad"></i> 今日の単語テスト
                     </>
                   ) : (
                     <>
                       <i className="fa-solid fa-magnifying-glass"></i> 単語を探す
                     </>
                   )}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
