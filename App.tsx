import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { WordCard } from './components/WordCard';
import { StatsDashboard } from './components/StatsDashboard';
import { ChatAssistant } from './components/ChatAssistant';
import { SmartNotebook } from './components/SmartNotebook';
import { SettingsModal } from './components/SettingsModal';
import { BookListModal } from './components/BookListModal';
import { QuizView } from './components/QuizView';
import { TrashView } from './components/TrashView';
import { Toast } from './components/Toast';
import { SkeletonLoader } from './components/SkeletonLoader';
import { LoginConfirmModal } from './components/LoginConfirmModal';
import { WordEntry, NoteEntry, BookMetadata, GeminiResponse, WordStatus } from './types';
import { fetchWordDetails } from './services/geminiService';
import { dbService, auth, loginWithGoogle, logout } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [currentView, setCurrentView] = useState<any>('search');
  const [user, setUser] = useState<any>(null);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<GeminiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [quizTargetWords, setQuizTargetWords] = useState<WordEntry[]>([]);
  const [toast, setToast] = useState({ message: '', type: 'info' as any, isVisible: false });

  const showToast = useCallback((message: string, type: any = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const loadData = useCallback(async () => {
    const data = await dbService.loadAll();
    setWords(data.words.sort((a, b) => b.timestamp - a.timestamp));
    setBooks(data.books);
    setNotes(data.notes.sort((a, b) => b.timestamp - a.timestamp));
    setIsGlobalLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowLogin(false);
      showToast("ログインしました", "success");
    } catch (e) {
      showToast("ログインに失敗しました", "error");
    }
  };

  const handleAddWord = async (geminiData: GeminiResponse) => {
    const newWord: WordEntry = { ...geminiData, id: crypto.randomUUID(), userId: user?.uid || 'guest', bookId: currentBookId, timestamp: Date.now(), status: 'unknown', isTrashed: false };
    setWords(prev => [newWord, ...prev]);
    await dbService.addWord(newWord);
    showToast(`「${newWord.word}」を保存しました`, 'success');
    setSearchResult(null);
    setSearchQuery('');
  };

  const activeWords = useMemo(() => words.filter(w => !w.isTrashed && (currentBookId === 'all' || w.bookId === currentBookId)), [words, currentBookId]);

  if (isGlobalLoading) return <div className="p-20 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentView={currentView} onChangeView={setCurrentView} onOpenUsage={() => {}} onOpenSettings={() => setShowSettings(true)} onOpenBooks={() => setShowBooks(true)} currentBookName={books.find(b => b.id === currentBookId)?.title || '単語帳'} user={user} onLogin={() => setShowLogin(true)} onLogout={() => logout()} />
      <main className="max-w-4xl mx-auto p-4">
        {currentView === 'search' && (
          <div className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { setIsSearching(true); fetchWordDetails(searchQuery).then(setSearchResult).catch(err => showToast(err.message, "error")).finally(() => setIsSearching(false)); } }} className="flex gap-2">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="英単語を入力..." className="flex-1 p-4 rounded-2xl border-2 focus:border-indigo-500 outline-none" />
              <button type="submit" className="bg-indigo-600 text-white px-6 rounded-2xl font-bold">検索</button>
            </form>
            {isSearching && <SkeletonLoader />}
            {searchResult && <WordCard word={{...searchResult, id:'temp', status:'unknown', timestamp:Date.now()} as any} />}
            {searchResult && <button onClick={() => handleAddWord(searchResult)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg">単語帳に追加</button>}
            {!searchResult && !isSearching && <StatsDashboard history={activeWords} onStartDailyQuiz={(w) => { setQuizTargetWords(w); setCurrentView('quiz'); }} />}
          </div>
        )}
        {currentView === 'list' && <div className="space-y-4">{activeWords.map(w => <WordCard key={w.id} word={w} onStatusChange={(id, status) => dbService.updateWord(id, {status})} />)}</div>}
        {currentView === 'quiz' && <QuizView history={activeWords} onUpdateStatus={dbService.updateWord.bind(dbService)} onExit={() => setCurrentView('search')} preselectedWords={quizTargetWords} />}
      </main>
      <LoginConfirmModal isOpen={showLogin} onClose={() => setShowLogin(false)} onConfirm={handleLogin} onRedirectConfirm={handleLogin} />
      <Toast message={toast.message} isVisible={toast.isVisible} type={toast.type} onClose={() => setToast({...toast, isVisible:false})} />
    </div>
  );
};
export default App;
