import React, { useState, useEffect, useRef } from 'react';
import { WordEntry, WordStatus } from '../types';
import { AppLanguage, t } from '../services/i18n';
import { generateAiQuiz } from '../services/geminiService';
import { calculateSRS, isDueForReview } from '../services/srsService';

interface QuizViewProps {
  history: WordEntry[];
  onUpdateStatus: (id: string, status: WordStatus, srsUpdates?: Partial<WordEntry>) => void;
  onExit: () => void;
  preselectedWords?: WordEntry[]; // New prop for specific quiz targets
  onLookupWord?: (word: string) => void;
  language: AppLanguage;
}

type QuizMode = 'flashcard' | 'choice' | 'typing' | 'ai_challenge' | 'srs_review';

// Simple sound synthesizer for game effects
const playSound = (type: 'correct' | 'incorrect') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const QuizView: React.FC<QuizViewProps> = ({ history, onUpdateStatus, onExit, preselectedWords, onLookupWord, language }) => {
  const [step, setStep] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');
  const [mode, setMode] = useState<QuizMode>('flashcard');
  const [selectedModes, setSelectedModes] = useState<WordStatus[]>(['unknown', 'learning']);
  const [filterType, setFilterType] = useState<'all' | 'word' | 'idiom'>('all'); // NEW: Word vs Idiom filter
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  // AI Challenge State
  const [aiLevel, setAiLevel] = useState<string>('Intermediate (中級)');
  const [aiGeneratedWords, setAiGeneratedWords] = useState<WordEntry[]>([]);
  
  const [quizQueue, setQuizQueue] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ mastered: 0, learning: 0, unknown: 0 });
  
  // For Choice/Typing modes
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typingInput, setTypingInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [autoUpdateResult, setAutoUpdateResult] = useState<{from: WordStatus, to: WordStatus} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with preselected words if available
  useEffect(() => {
    if (preselectedWords && preselectedWords.length > 0 && step === 'setup') {
      setQuizQueue(preselectedWords);
      setStep('quiz');
    }
  }, [preselectedWords]);

  useEffect(() => {
    if (step === 'quiz' && quizQueue.length > 0) {
      const currentWord = quizQueue[currentIndex];
      
      setIsFlipped(false);
      setFeedback(null);
      setSelectedOption(null);
      setAutoUpdateResult(null);
      setTimeLeft(15);

      if (mode === 'choice') {
        const otherWords = history.length > 3 ? history.filter(w => w.id !== currentWord.id) : quizQueue.filter(w => w.id !== currentWord.id);
        
        let distractors = [...otherWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.meaning);
        
        // Fallback for not enough words (especially in AI mode with empty history)
        while (distractors.length < 3) {
            distractors.push("（ダミー選択肢）");
        }

        const allOptions = [...distractors, currentWord.meaning].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      } else if (mode === 'typing') {
        setTypingInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [currentIndex, step, mode, quizQueue, history]);

  useEffect(() => {
    if (step === 'quiz' && !isFlipped && (mode === 'choice' || mode === 'typing') && feedback === null) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, isFlipped, mode, feedback]);

  const toggleStatusFilter = (status: WordStatus) => {
    setSelectedModes(prev => 
      prev.includes(status) ? prev.filter(m => m !== status) : [...prev, status]
    );
  };

  const startQuiz = async () => {
    if (mode === 'ai_challenge') {
      setStep('loading');
      try {
        const words = await generateAiQuiz(aiLevel, questionCount);
        setAiGeneratedWords(words); // Keep track for saving later
        setQuizQueue(words);
        setMode('choice'); // Default AI quiz to choice mode for now
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionStats({ mastered: 0, learning: 0, unknown: 0 });
        setStep('quiz');
      } catch (e) {
        alert("クイズの生成に失敗しました。もう一度お試しください。");
        setStep('setup');
      }
      return;
    }

    let filtered: WordEntry[] = [];

    if (mode === 'srs_review') {
        // Filter by Due Date
        filtered = history.filter(w => isDueForReview(w));
        // Sort by priority: Unknown first, then Learning, then earliest due date
        filtered.sort((a, b) => {
            if (a.status === 'unknown' && b.status !== 'unknown') return -1;
            if (b.status === 'unknown' && a.status !== 'unknown') return 1;
            return (a.nextReviewDate || 0) - (b.nextReviewDate || 0);
        });
    } else {
        filtered = history.filter(w => selectedModes.includes(w.status));
        // Shuffle for normal modes
        filtered.sort(() => Math.random() - 0.5);
    }

    // Apply Word Type Filter
    if (filterType === 'idiom') {
        filtered = filtered.filter(w => w.word.trim().includes(' '));
    } else if (filterType === 'word') {
        filtered = filtered.filter(w => !w.word.trim().includes(' '));
    }
    
    // Apply Question Count Limit
    if (questionCount < 9999 && filtered.length > questionCount) {
        filtered = filtered.slice(0, questionCount);
    }
    
    if (filtered.length === 0) {
        if (mode === 'srs_review') {
            alert('現在、復習時期に達している単語はありません（条件に合うものを含む）。');
        } else {
            alert('条件に合う単語がありません。');
        }
        return;
    }

    setQuizQueue(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ mastered: 0, learning: 0, unknown: 0 });
    // If review mode, default to flashcard style? or let user choose? 
    // Let's force flashcard style for Review Mode as it allows grading 3 levels.
    if (mode === 'srs_review') {
        setMode('flashcard');
    }
    setStep('quiz');
  };

  const handleNext = () => {
    if (currentIndex < quizQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setStep('result');
    }
  };

  const handleManualStatusUpdate = (result: WordStatus) => {
    const currentWord = quizQueue[currentIndex];
    
    // Calculate SRS Updates
    const srsUpdates = calculateSRS(currentWord, result);

    // If it's AI generated, we don't update status in main DB yet (unless we save it)
    if (currentWord.bookId !== 'ai-generated') {
        onUpdateStatus(currentWord.id, result, srsUpdates);
    }
    
    setSessionStats(prev => ({
      ...prev,
      [result]: prev[result] + 1
    }));

    setTimeout(() => {
      handleNext();
    }, 150);
  };

  // Helper to calculate new status based on quiz result (Correct/Incorrect logic for Choice/Typing)
  // NOTE: For SRS, Choice/Typing is less precise (Binary pass/fail).
  // We'll treat "Correct" as "Mastered" (Good) and "Incorrect" as "Unknown" (Fail).
  const calculateNextStatus = (current: WordStatus, isCorrect: boolean): WordStatus => {
    if (isCorrect) {
      if (current === 'unknown') return 'learning';
      if (current === 'learning') return 'mastered';
      return 'mastered';
    } else {
      // Fail logic
      return 'unknown';
    }
  };

  const processAutoUpdate = (isCorrect: boolean) => {
    const currentWord = quizQueue[currentIndex];
    const newStatus = calculateNextStatus(currentWord.status, isCorrect);
    
    // SRS Calculation for auto-modes
    // Correct -> Treated as 'mastered' (easy) or 'learning' (good)?
    // Let's assume Correct in 4-choice is "Mastered" for simplicity, or we map it:
    // Pass -> 'mastered' logic (EF increases)
    // Fail -> 'unknown' logic (EF decreases)
    const srsUpdates = calculateSRS(currentWord, isCorrect ? 'mastered' : 'unknown');

    if (currentWord.bookId !== 'ai-generated') {
        onUpdateStatus(currentWord.id, newStatus, srsUpdates);
        setAutoUpdateResult({ from: currentWord.status, to: newStatus });
    }
    
    setSessionStats(prev => ({
      ...prev,
      [newStatus]: prev[newStatus] + 1
    }));
  };

  const handleChoiceAnswer = (selectedMeaning: string) => {
    if (isFlipped || selectedOption) return;
    
    setSelectedOption(selectedMeaning);
    const isCorrect = selectedMeaning === quizQueue[currentIndex].meaning;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    processAutoUpdate(isCorrect);

    setTimeout(() => {
      setIsFlipped(true);
    }, 1000);
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFlipped) return;
    const currentWord = quizQueue[currentIndex];
    const isCorrect = typingInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    processAutoUpdate(isCorrect);
    
    setTimeout(() => {
      setIsFlipped(true);
    }, 1000);
  };

  if (step === 'loading') {
      return (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="w-24 h-24 relative mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                  <i className="fa-solid fa-robot absolute inset-0 flex items-center justify-center text-indigo-600 text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">AIがクイズを作成中...</h2>
              <p className="text-slate-500">テーマ: {aiLevel}</p>
          </div>
      );
  }

  if (step === 'setup') {
    const counts = {
      unknown: history.filter(w => w.status === 'unknown').length,
      learning: history.filter(w => w.status === 'learning').length,
      mastered: history.filter(w => w.status === 'mastered').length,
    };
    
    const dueCount = history.filter(w => isDueForReview(w)).length;
    // Calculate available count based on all filters
    const availableCount = history.filter(w => {
         // 1. Status Check
         const statusMatch = selectedModes.includes(w.status);
         // 2. Type Check
         let typeMatch = true;
         if (filterType === 'idiom') typeMatch = w.word.trim().includes(' ');
         if (filterType === 'word') typeMatch = !w.word.trim().includes(' ');
         
         return statusMatch && typeMatch;
    }).length;

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <i className="fa-solid fa-graduation-cap text-3xl"></i>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">クイズ設定</h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <p className="text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">学習モード</p>
          
          {/* Smart Review Button (Highlighted) */}
          <button
            onClick={() => setMode('srs_review')}
            disabled={dueCount === 0}
            className={`w-full py-3 mb-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                mode === 'srs_review'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md ring-2 ring-emerald-100'
                : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
             <i className="fa-solid fa-brain"></i>
             今日の復習 (Smart Review)
             <span className="ml-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">{dueCount}</span>
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl">
            {(['flashcard', 'choice', 'typing', 'ai_challenge'] as QuizMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={m === 'choice' && history.length < 4}
                className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  mode === m 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {m === 'flashcard' && <><i className="fa-solid fa-clone"></i> カード</>}
                {m === 'choice' && <><i className="fa-solid fa-list-check"></i> 4択</>}
                {m === 'typing' && <><i className="fa-solid fa-keyboard"></i> 入力</>}
                {m === 'ai_challenge' && <><i className="fa-solid fa-wand-magic-sparkles"></i> AI出題</>}
              </button>
            ))}
          </div>
          {history.length < 4 && mode !== 'ai_challenge' && (
            <p className="text-xs text-amber-500 mt-2">※ 4択クイズには最低4つの単語が必要です</p>
          )}
        </div>

        {/* Dynamic Settings Area */}
        {mode === 'ai_challenge' ? (
            <div className="mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-indigo-800 text-sm font-bold mb-3 uppercase tracking-wider">
                    <i className="fa-solid fa-robot mr-2"></i>AI出題レベル設定
                </p>
                <select 
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full p-3 rounded-xl border border-indigo-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="Beginner (初級)">🌱 Beginner (初級 - 中学英語)</option>
                    <option value="Intermediate (中級)">🌿 Intermediate (中級 - 高校英語)</option>
                    <option value="Advanced (上級)">🌳 Advanced (上級 - 大学・ビジネス)</option>
                    <option value="TOEIC 600">📘 TOEIC 600点レベル</option>
                    <option value="TOEIC 800">📙 TOEIC 800点レベル</option>
                    <option value="Eiken Pre-1 (英検準1級)">📕 英検準1級レベル</option>
                    <option value="Eiken 1 (英検1級)">👑 英検1級レベル</option>
                    <option value="Science & Tech">🔬 科学・技術用語</option>
                    <option value="Business">💼 ビジネス重要語</option>
                </select>
            </div>
        ) : mode === 'srs_review' ? (
            <div className="mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-emerald-800 text-sm font-bold mb-2">
                    <i className="fa-solid fa-clock-rotate-left mr-2"></i>忘却曲線に基づく復習
                </p>
                <p className="text-xs text-slate-500 text-left">
                    SRS（分散学習システム）が、あなたが忘れかけている単語を自動的に選出しました。効率的に記憶を定着させましょう。
                </p>
            </div>
        ) : (
            <div className="mb-6">
                <p className="text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">ステータス (出題対象)</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                    onClick={() => toggleStatusFilter('unknown')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                        selectedModes.includes('unknown') 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                    >
                    <div className="font-bold text-sm"><i className="fa-solid fa-xmark mr-1"></i>未習得</div>
                    <div className="text-[10px]">{counts.unknown}語</div>
                    </button>
                    <button
                    onClick={() => toggleStatusFilter('learning')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                        selectedModes.includes('learning') 
                        ? 'border-amber-500 bg-amber-50 text-amber-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                    >
                    <div className="font-bold text-sm"><i className="fa-solid fa-play mr-1"></i>勉強中</div>
                    <div className="text-[10px]">{counts.learning}語</div>
                    </button>
                    <button
                    onClick={() => toggleStatusFilter('mastered')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                        selectedModes.includes('mastered') 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                    >
                    <div className="font-bold text-sm"><i className="fa-solid fa-check mr-1"></i>習得済</div>
                    <div className="text-[10px]">{counts.mastered}語</div>
                    </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider text-center">出題タイプ</p>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => setFilterType('all')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                              filterType === 'all' 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                            すべて
                        </button>
                        <button 
                          onClick={() => setFilterType('word')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                              filterType === 'word' 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                            単語のみ
                        </button>
                        <button 
                          onClick={() => setFilterType('idiom')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                              filterType === 'idiom' 
                              ? 'bg-amber-500 text-white shadow-md' 
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                            <i className="fa-solid fa-puzzle-piece mr-1"></i>熟語のみ
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Count Selection */}
        <div className="mb-8">
          <p className="text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">
             問題数 
             {mode !== 'ai_challenge' && mode !== 'srs_review' && <span className="text-[10px] font-normal normal-case ml-1">(対象: {availableCount}語)</span>}
             {mode === 'srs_review' && <span className="text-[10px] font-normal normal-case ml-1">(期限到来: {dueCount}語)</span>}
          </p>
          <div className="flex gap-2">
            {[5, 10, 20].map(num => (
               <button
                 key={num}
                 onClick={() => setQuestionCount(num)}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                   questionCount === num
                     ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                     : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200'
                 }`}
               >
                 {num}問
               </button>
            ))}
             {mode !== 'ai_challenge' && (
                 <button
                     onClick={() => setQuestionCount(9999)}
                     className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                     questionCount === 9999
                         ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                         : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200'
                     }`}
                 >
                     全問
                 </button>
             )}
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={
              (mode === 'srs_review' && dueCount === 0) ||
              (mode !== 'ai_challenge' && mode !== 'srs_review' && (selectedModes.length === 0 || history.length === 0))
          }
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none"
        >
          {mode === 'ai_challenge' ? 'AIクイズを作成してスタート' : mode === 'srs_review' ? '復習をスタート' : 'スタート'}
        </button>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
          <i className="fa-solid fa-trophy text-3xl"></i>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Finish!</h2>
        <p className="text-slate-500 mb-6">今回のセッション結果</p>
        
        <div className="space-y-3 mb-8">
           <div className="flex justify-between p-3 bg-red-50 rounded-lg text-red-700 items-center">
             <span className="font-bold text-sm flex items-center"><i className="fa-solid fa-xmark w-6"></i>忘れた・復習へ</span>
             <span className="font-bold text-lg">{sessionStats.unknown}</span>
           </div>
           <div className="flex justify-between p-3 bg-amber-50 rounded-lg text-amber-700 items-center">
             <span className="font-bold text-sm flex items-center"><i className="fa-solid fa-play w-6"></i>微妙・継続</span>
             <span className="font-bold text-lg">{sessionStats.learning}</span>
           </div>
           <div className="flex justify-between p-3 bg-emerald-50 rounded-lg text-emerald-700 items-center">
             <span className="font-bold text-sm flex items-center"><i className="fa-solid fa-check w-6"></i>完璧・定着済</span>
             <span className="font-bold text-lg">{sessionStats.mastered}</span>
           </div>
        </div>

        {aiGeneratedWords.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 mb-2">
                    <i className="fa-solid fa-circle-info mr-1"></i>
                    AIが出題した単語は、検索して自分の単語帳に追加できます。
                </p>
            </div>
        )}

        <button
          onClick={onExit}
          className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors"
        >
          終了する
        </button>
      </div>
    );
  }

  const currentWord = quizQueue[currentIndex];
  const progress = ((currentIndex + 1) / quizQueue.length) * 100;
  const isDailyQuest = preselectedWords && preselectedWords.length > 0;
  const isAiMode = currentWord.bookId === 'ai-generated';

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center mb-6 px-2">
         <button onClick={onExit} className="text-slate-400 hover:text-slate-600 transition-colors">
           <i className="fa-solid fa-xmark text-xl"></i>
         </button>
         <div className="flex-1 mx-6">
           <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
             <span>{isAiMode ? "AI Challenge" : (mode === 'srs_review' ? "Review Session" : "Progress")}</span>
             <span>{currentIndex + 1} / {quizQueue.length}</span>
           </div>
           <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-500 transition-all duration-300"
               style={{ width: `${progress}%` }}
             ></div>
           </div>
         </div>
         {mode !== 'flashcard' && !isFlipped && (
           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${timeLeft <= 5 ? 'border-red-400 text-red-500 animate-pulse' : 'border-slate-200 text-slate-400'}`}>
             {timeLeft}
           </div>
         )}
      </div>

      {/* Flip Card Container */}
      <div className="relative w-full perspective-1000 min-h-[500px]">
         <div 
           className={`relative w-full grid grid-cols-1 grid-rows-1 transition-transform duration-700 [transform-style:preserve-3d] ${
             isFlipped ? '[transform:rotateY(180deg)]' : ''
           }`}
         >
            {/* --- FRONT SIDE --- */}
            <div className={`col-start-1 row-start-1 [backface-visibility:hidden] flex flex-col ${mode === 'flashcard' ? 'bg-white shadow-xl border-2 border-slate-100 rounded-3xl' : ''}`}>
              
              {mode === 'flashcard' && (
                <div 
                  className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center cursor-pointer"
                  onClick={() => setIsFlipped(true)}
                >
                  {(isDailyQuest || isAiMode) && (
                    <span className="absolute top-6 right-6 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-bold">
                       {isAiMode ? 'AI Generated' : 'QUEST ITEM'}
                    </span>
                  )}
                  <p className="text-slate-400 text-sm font-bold uppercase mb-4 tracking-widest">Question</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mb-2">{currentWord.word}</h3>
                  <p className="text-slate-400 mt-8 text-sm animate-pulse">
                    <i className="fa-solid fa-arrow-rotate-right mr-2"></i>{t(language, "quiz.tapToFlip")}
                  </p>
                </div>
              )}

              {mode === 'choice' && (
                <div className="w-full h-full flex flex-col">
                   <div className="flex-grow-[2] flex flex-col items-center justify-center mb-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 min-h-[200px] relative">
                      {isAiMode && (
                        <div className="absolute top-4 right-4 text-[10px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded font-bold">AI Challenge</div>
                      )}
                      <p className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest bg-slate-100 px-3 py-1 rounded-full">Meaning?</p>
                      <h3 className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">{currentWord.word}</h3>
                      <p className="text-slate-400 font-mono text-lg">{currentWord.pronunciation}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                     {options.map((opt, idx) => {
                       let btnClass = "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
                       let icon = <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs flex items-center justify-center mr-3 font-mono">{idx + 1}</span>;
                       
                       if (feedback) {
                         if (opt === currentWord.meaning) {
                           btnClass = "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-[1.02] z-10";
                           icon = <i className="fa-solid fa-check w-6 h-6 flex items-center justify-center mr-3 text-white"></i>;
                         } else if (selectedOption === opt) {
                           btnClass = "bg-red-500 text-white border-red-600 opacity-80";
                           icon = <i className="fa-solid fa-xmark w-6 h-6 flex items-center justify-center mr-3 text-white"></i>;
                         } else {
                           btnClass = "bg-slate-50 text-slate-300 border-slate-100 opacity-50";
                         }
                       }

                       return (
                         <button
                           key={idx}
                           onClick={() => handleChoiceAnswer(opt)}
                           disabled={feedback !== null}
                           className={`w-full p-4 text-left font-bold rounded-2xl border-2 transition-all duration-300 flex items-center ${btnClass} ${feedback ? '' : 'hover:scale-[1.01] hover:shadow-md'}`}
                         >
                           {icon}
                           <span className="text-sm md:text-base leading-tight">{opt}</span>
                         </button>
                       );
                     })}
                   </div>
                </div>
              )}

              {mode === 'typing' && (
                <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                   <p className="text-slate-400 text-sm font-bold uppercase mb-4 tracking-widest">Translate to English</p>
                   <p className="text-2xl font-bold text-slate-800 mb-10 text-center leading-relaxed">{currentWord.meaning}</p>
                   
                   <form onSubmit={handleTypingSubmit} className="w-full max-w-sm relative">
                     <input
                       ref={inputRef}
                       type="text"
                       value={typingInput}
                       onChange={(e) => setTypingInput(e.target.value)}
                       className={`w-full p-4 text-center text-2xl font-bold border-b-2 outline-none bg-transparent mb-6 placeholder-slate-200 transition-colors ${
                         feedback === 'correct' ? 'border-emerald-500 text-emerald-600' :
                         feedback === 'incorrect' ? 'border-red-500 text-red-600' :
                         'border-indigo-200 focus:border-indigo-600 text-slate-900'
                       }`}
                       placeholder="Type here..."
                       autoComplete="off"
                       disabled={feedback !== null}
                     />
                     
                     {feedback === 'correct' && (
                       <div className="absolute right-0 top-4 text-emerald-500 animate-bounce">
                         <i className="fa-solid fa-check text-2xl"></i>
                       </div>
                     )}
                     
                     <button 
                       type="submit" 
                       disabled={feedback !== null || !typingInput.trim()}
                       className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                     >
                       回答する
                     </button>
                   </form>
                </div>
              )}
            </div>

            {/* --- BACK SIDE --- */}
            <div className="col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-3xl shadow-xl border-2 border-indigo-50 flex flex-col p-6 text-center z-10 min-h-[500px]">
               <div className="flex-grow flex flex-col items-center justify-center">
                  
                  {feedback && (
                    <div className={`mb-2 font-bold text-lg animate-in slide-in-from-top-4 ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {feedback === 'correct' ? (
                        <span><i className="fa-solid fa-circle-check mr-2"></i>Correct!</span>
                      ) : (
                        <span><i className="fa-solid fa-circle-xmark mr-2"></i>Incorrect</span>
                      )}
                    </div>
                  )}

                  {/* Auto Update Notification */}
                  {autoUpdateResult && !isAiMode && (
                      <div className="mb-4 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-flex items-center gap-2 animate-pulse">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Status Updated</span>
                          <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                              {autoUpdateResult.from === 'unknown' && <i className="fa-solid fa-xmark"></i>}
                              {autoUpdateResult.from === 'learning' && <i className="fa-solid fa-play"></i>}
                              {autoUpdateResult.from === 'mastered' && <i className="fa-solid fa-check"></i>}
                              <i className="fa-solid fa-arrow-right text-[10px] text-indigo-300"></i>
                              {autoUpdateResult.to === 'unknown' && <i className="fa-solid fa-xmark text-red-500"></i>}
                              {autoUpdateResult.to === 'learning' && <i className="fa-solid fa-play text-amber-500"></i>}
                              {autoUpdateResult.to === 'mastered' && <i className="fa-solid fa-check text-emerald-500"></i>}
                          </span>
                      </div>
                  )}

                  <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{currentWord.word}</h3>
                  <span className="text-sm font-mono text-slate-400 mb-4">{currentWord.pronunciation}</span>
                  <p className="text-xl font-bold text-indigo-600 mb-4">{currentWord.meaning}</p>

                  {isAiMode && onLookupWord && (
                    <button
                      onClick={() => onLookupWord(currentWord.word)}
                      className="mb-5 px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm hover:bg-indigo-200 transition-colors"
                      title={t(language, "quiz.lookupHint")}
                    >
                      <i className="fa-solid fa-magnifying-glass mr-2"></i>
                      {t(language, "quiz.lookupWord")}
                    </button>
                  )}
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-left w-full mb-4">
                    <p className="text-xs text-slate-500 font-bold mb-1"><i className="fa-solid fa-lightbulb text-amber-500 mr-1"></i>覚え方</p>
                    <p className="text-sm text-slate-700">{currentWord.mnemonic}</p>
                  </div>

                  <p className="text-sm text-slate-600 italic mb-4">"{currentWord.exampleSentence}"</p>
                  
                  <div className="w-full text-left bg-indigo-50/50 p-3 rounded-xl">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Logic</p>
                      <p className="text-xs text-slate-600">{currentWord.logic}</p>
                  </div>
               </div>

               <div className="mt-4 pt-4 border-t border-slate-100">
                 {mode === 'flashcard' && !isAiMode ? (
                   <>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">評価して次へ</p>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => handleManualStatusUpdate('unknown')}
                         className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex flex-col items-center group"
                       >
                         <i className="fa-solid fa-xmark mb-1 group-hover:scale-110 transition-transform"></i>
                         忘れた
                         <span className="text-[9px] font-normal opacity-70">Soon</span>
                       </button>
                       <button 
                         onClick={() => handleManualStatusUpdate('learning')}
                         className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors flex flex-col items-center group"
                       >
                         <i className="fa-solid fa-play mb-1 group-hover:scale-110 transition-transform"></i>
                         微妙
                         <span className="text-[9px] font-normal opacity-70">1 day</span>
                       </button>
                       <button 
                         onClick={() => handleManualStatusUpdate('mastered')}
                         className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors flex flex-col items-center group"
                       >
                         <i className="fa-solid fa-check mb-1 group-hover:scale-110 transition-transform"></i>
                         覚えた
                         <span className="text-[9px] font-normal opacity-70">Later</span>
                       </button>
                     </div>
                   </>
                 ) : (
                   <button
                     onClick={handleNext}
                     className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                   >
                     {t(language, "quiz.next")} <i className="fa-solid fa-arrow-right"></i>
                   </button>
                 )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};