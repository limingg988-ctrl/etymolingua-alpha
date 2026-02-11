import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { WordCard } from './components/WordCard';
import { StatsDashboard } from './components/StatsDashboard';
import { UsageGuide } from './components/UsageGuide';
import { ChatAssistant } from './components/ChatAssistant';
import { SmartNotebook } from './components/SmartNotebook';
import { SettingsModal } from './components/SettingsModal';
import { BookListModal } from './components/BookListModal';
import { ThesaurusView } from './components/ThesaurusView';
import { QuizView } from './components/QuizView';
import { TrashView } from './components/TrashView';
import { Toast } from './components/Toast';
import { SkeletonLoader } from './components/SkeletonLoader';
import { LoginConfirmModal } from './components/LoginConfirmModal';

import { WordEntry, NoteEntry, BookMetadata, GeminiResponse, WordStatus } from './types';
import { fetchWordDetails } from './services/geminiService';
import { dbService, auth, loginWithGoogle, logout } from './services/firebase';
import { exportToJSON } from './services/csvExportService';
import { onAuthStateChanged } from 'firebase/auth';

type ViewMode = 'search' | 'list' | 'chat' | 'notebook' | 'thesaurus' | 'quiz' | 'trash';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 relative mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 font-bold animate-pulse">EtymoLinguaを起動中...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('search');
  const [user, setUser] = useState<any>(null);
  
  const [words, setWords] = useState<WordEntry[]>([]);
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>('default');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<GeminiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [showUsage, setShowUsage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  const [quizTargetWords, setQuizTargetWords] = useState<WordEntry[]>([]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await dbService.loadAll();
      setWords(data.words.sort((a: WordEntry, b: WordEntry) => b.timestamp - a.timestamp));
      setBooks(data.books);
      setNotes(data.notes.sort((a: NoteEntry, b: NoteEntry) => b.timestamp - a.timestamp));

      // デフォルトの単語帳がない場合の処理
      if (data.books.length === 0) {
        const defaultBook: BookMetadata = {
            id: 'default',
            userId: user ? user.uid : 'guest',
            title: 'マイ単語帳',
            description: 'デフォルトの単語帳',
            createdAt: Date.now()
        };
        await dbService.addBook(defaultBook);
        setBooks([defaultBook]);
      }
    } catch (e) {
      console.error(e);
      showToast("データの読み込みに失敗しました", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  }, [showToast, user]);

  // ログイン状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // ユーザーが変わったらデータを再読み込み
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowLogin(false);
      showToast("ログインしました！", "success");
    } catch (e) {
      console.error(e);
      showToast("ログインに失敗しました", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("ログアウトしました", "info");
      // データはuseEffectで自動的に再読み込み（guest用）される
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    try {
        const result = await fetchWordDetails(searchQuery);
        setSearchResult(result);
    } catch (e: any) {
        showToast(e.message || "検索に失敗しました", 'error');
    } finally {
        setIsSearching(false);
    }
  };

  const handleAddWord = async (geminiData: GeminiResponse) => {
    const newWord: WordEntry = {
        ...geminiData,
        id: generateId(),
        userId: user ? user.uid : 'guest',
        bookId: currentBookId === 'all' ? 'default' : currentBookId,
        timestamp: Date.now(),
        status: 'unknown',
        isTrashed: false,
        nextReviewDate: Date.now(),
        interval: 0,
        easeFactor: 2.5,
        streak: 0
    };

    setWords(prev => [newWord, ...prev]);
    await dbService.addWord(newWord);
    showToast(`「${newWord.word}」を保存しました`, 'success');
    setSearchQuery('');
    setSearchResult(null);
  };

  const handleStatusChange = async (id: string, status: WordStatus, srsUpdates?: Partial<WordEntry>) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, status, ...srsUpdates } : w));
    await dbService.updateWord(id, { status, ...srsUpdates });
  };

  const moveToTrash = async (id: string) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, isTrashed: true } : w));
    await dbService.deleteWord(id);
    showToast('ゴミ箱に移動しました', 'info');
  };

  const restoreFromTrash = async (id: string) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, isTrashed: false } : w));
    await dbService.restoreWord(id);
    showToast('復元しました', 'success');
  };

  const deletePermanently = async (id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
    await dbService.permanentDeleteWord(id);
    showToast('完全に削除しました', 'success');
  };

  const emptyTrash = async () => {
      const trashIds = words.filter(w => w.isTrashed).map(w => w.id);
      setWords(prev => prev.filter(w => !w.isTrashed));
      trashIds.forEach(id => dbService.permanentDeleteWord(id));
      showToast('ゴミ箱を空にしました', 'success');
  };

  const handleSaveNote = async (title: string, content: string, tags: string[]) => {
      const newNote: NoteEntry = {
          id: generateId(),
          userId: user ? user.uid : 'guest',
          title,
          content,
          tags,
          timestamp: Date.now(),
          isTrashed: false
      };
      setNotes(prev => [newNote, ...prev]);
      await dbService.addNote(newNote);
      showToast('ノートを保存しました', 'success');
  };

  const handleDeleteNote = async (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id));
      await dbService.permanentDeleteNote(id);
      showToast('ノートを削除しました', 'info');
  };

  const handleCreateBook = async (title: string, description: string) => {
      const newBook: BookMetadata = {
          id: generateId(),
          userId: user ? user.uid : 'guest',
          title,
          description,
          createdAt: Date.now()
      };
      setBooks(prev => [...prev, newBook]);
      await dbService.addBook(newBook);
      showToast(`単語帳「${title}」を作成しました`, 'success');
  };

  const handleSelectBook = (id: string) => {
      setCurrentBookId(id);
      setShowBooks(false);
      showToast('単語帳を切り替えました', 'info');
  };
  
  const handleDeleteBook = async (id: string) => {
      setWords(prev => prev.filter(w => w.bookId !== id));
      setBooks(prev => prev.filter(b => b.id !== id));
      await dbService.deleteBook(id);
      if (currentBookId === id) setCurrentBookId('default');
      showToast('単語帳を削除しました', 'success');
  };

  const handleRenameBook = async (id: string, newTitle: string) => {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, title: newTitle } : b));
      await dbService.updateBook(id, { title: newTitle });
      showToast('単語帳名を変更しました', 'success');
  };

  const activeWords = useMemo(() => {
    let filtered = words.filter(w => !w.isTrashed);
    if (currentBookId !== 'all') {
        filtered = filtered.filter(w => w.bookId === currentBookId);
    }
    return filtered;
  }, [words, currentBookId]);

  const trashWords = useMemo(() => words.filter(w => w.isTrashed), [words]);

  const currentBookName = useMemo(() => {
      if (currentBookId === 'all') return 'すべての単語';
      const book = books.find(b => b.id === currentBookId);
      return book ? book.title : '単語帳未選択';
  }, [books, currentBookId]);

  const handleExport = () => exportToJSON(activeWords);
  
  const handleImport = async (file: File) => {
      // Import logic (Simplified for brevity, but same logic as before)
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              const itemsToImport = Array.isArray(data) ? data : data.words || [];
              
              const normalizedWords: WordEntry[] = itemsToImport.map((item: any) => ({
                  ...item,
                  id: item.id || generateId(),
                  userId: user ? user.uid : 'guest',
                  bookId: currentBookId === 'all' ? 'default' : currentBookId,
                  timestamp: item.timestamp || Date.now(),
                  status: item.status || 'unknown',
                  synonyms: item.synonyms || [],
                  collocations: item.collocations || [],
                  derivatives: item.derivatives || [],
                  idioms: item.idioms || [],
                  relatedWords: item.relatedWords || [],
                  isTrashed: false
              }));

              setWords(prev => [...normalizedWords, ...prev]);
              await dbService.saveWordsBatch(normalizedWords);
              showToast(`${normalizedWords.length}語をインポートしました`, 'success');
          } catch(err: any) {
              showToast('ファイルの読み込みに失敗しました', 'error');
          }
      };
      reader.readAsText(file);
  };
  
  const handleLoadPresetBook = async (bookData: any[]) => {
      const importedWords = bookData.map((item: any) => ({
            ...item,
            id: generateId(),
            userId: user ? user.uid : 'guest',
            bookId: currentBookId === 'all' ? 'default' : currentBookId,
            timestamp: Date.now(),
            status: 'unknown',
            synonyms: item.synonyms || [],
            collocations: item.collocations || [],
            derivatives: item.derivatives || [],
            idioms: item.idioms || [],
            relatedWords: item.relatedWords || [],
            isTrashed: false
      }));
      setWords(prev => [...importedWords, ...prev]);
      await dbService.saveWordsBatch(importedWords);
      showToast(`${importedWords.length}語を追加しました`, 'success');
  };

  if (isGlobalLoading) {
    return <LoadingScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'search':
        return (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
             <div className="text-center py-10">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">What do you want to learn?</h2>
                <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="英単語または熟語を入力..." 
                        className="w-full pl-6 pr-14 py-4 rounded-full border-2 border-slate-200 focus:border-indigo-500 focus:outline-none shadow-sm text-lg transition-colors"
                        disabled={isSearching}
                    />
                    <button 
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                    >
                        {isSearching ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
                    </button>
                </form>
             </div>

             {searchResult && (
                 <div className="mb-20">
                     <WordCard 
                        word={{ ...searchResult, id: 'temp', timestamp: Date.now(), status: 'unknown' } as WordEntry}
                     />
                     <button 
                        onClick={() => handleAddWord(searchResult)}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 z-50"
                     >
                         <i className="fa-solid fa-plus"></i> 単語帳に追加
                     </button>
                 </div>
             )}
             
             {isSearching && <SkeletonLoader />}
             
             {!searchResult && !isSearching && (
                 <StatsDashboard 
                    history={activeWords} 
                    onStartDailyQuiz={(targetWords) => {
                        setQuizTargetWords(targetWords);
                        setCurrentView('quiz');
                    }}
                 />
             )}
          </div>
        );
      case 'list':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 pb-20">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800">
                    <i className="fa-solid fa-list-ul mr-2 text-indigo-500"></i>
                    単語リスト ({activeWords.length})
                 </h2>
                 <button onClick={() => setCurrentView('thesaurus')} className="text-sm font-bold text-indigo-600 hover:underline">
                    <i className="fa-solid fa-diagram-project mr-1"></i> 関連語マップを見る
                 </button>
             </div>
             {activeWords.length === 0 ? (
                 <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                     単語がありません。検索して追加しましょう！
                 </div>
             ) : (
                 <div className="grid grid-cols-1 gap-6">
                     {activeWords.map(word => (
                         <WordCard 
                            key={word.id} 
                            word={word} 
                            onDelete={moveToTrash}
                            onStatusChange={handleStatusChange}
                            onSearchRelated={(term) => {
                                setSearchQuery(term);
                                setCurrentView('search');
                                handleSearch();
                            }}
                         />
                     ))}
                 </div>
             )}
          </div>
        );
      case 'chat':
          return (
              <ChatAssistant 
                 onSaveNote={handleSaveNote}
                 wordHistory={activeWords.slice(0, 50)}
              />
          );
      case 'notebook':
          return (
              <SmartNotebook 
                 notes={notes}
                 onDeleteNote={handleDeleteNote}
              />
          );
      case 'thesaurus':
          return (
              <ThesaurusView 
                 history={activeWords}
                 onSearch={(term) => {
                    setSearchQuery(term);
                    setCurrentView('search');
                    handleSearch();
                 }}
              />
          );
      case 'quiz':
          return (
              <QuizView 
                 history={activeWords}
                 onUpdateStatus={handleStatusChange}
                 onExit={() => {
                     setCurrentView('search');
                     setQuizTargetWords([]);
                 }}
                 preselectedWords={quizTargetWords}
              />
          );
      case 'trash':
          return (
              <TrashView 
                 trashHistory={trashWords}
                 onRestore={restoreFromTrash}
                 onDeletePermanently={deletePermanently}
                 onEmptyTrash={emptyTrash}
                 onClose={() => setCurrentView('list')}
              />
          );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenUsage={() => setShowUsage(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBooks={() => setShowBooks(true)}
        currentBookName={currentBookName}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {renderView()}
      </main>

      <UsageGuide isOpen={showUsage} onClose={() => setShowUsage(false)} />
      
      <SettingsModal 
         isOpen={showSettings}
         onClose={() => setShowSettings(false)}
         onExportJSON={handleExport}
         onImportJSON={handleImport}
         onLoadBook={handleLoadPresetBook}
         wordCount={words.length}
      />

      <BookListModal 
         isOpen={showBooks}
         onClose={() => setShowBooks(false)}
         books={books}
         currentBookId={currentBookId}
         onSelectBook={handleSelectBook}
         onCreateBook={handleCreateBook}
         onDeleteBook={handleDeleteBook}
         onRenameBook={handleRenameBook}
         allBookId="all"
         allWordsCount={words.filter(w => !w.isTrashed).length}
      />

      <LoginConfirmModal 
         isOpen={showLogin} 
         onClose={() => setShowLogin(false)} 
         onConfirm={handleLogin} 
         onRedirectConfirm={handleLogin} 
      />

      <Toast 
         message={toast.message}
         type={toast.type}
         isVisible={toast.isVisible}
         onClose={hideToast}
      />
    </div>
  );
};

export default App;
