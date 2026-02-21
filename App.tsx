import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { WordCard } from "./components/WordCard";
import { StatsDashboard } from "./components/StatsDashboard";
import { ChatAssistant } from "./components/ChatAssistant";
import { SmartNotebook } from "./components/SmartNotebook";
import { SettingsModal } from "./components/SettingsModal";
import { BookListModal } from "./components/BookListModal";
import { QuizView } from "./components/QuizView";
import { TrashView } from "./components/TrashView";
import { Toast } from "./components/Toast";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { LoginConfirmModal } from "./components/LoginConfirmModal";
import {
  WordEntry,
  NoteEntry,
  BookMetadata,
  GeminiResponse,
  WordStatus,
} from "./types";
import { fetchWordDetails } from "./services/geminiService";
import { dbService, auth, loginWithGoogle, logout } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";

const App: React.FC = () => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [currentView, setCurrentView] = useState<any>("search");
  const [user, setUser] = useState<any>(null);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<GeminiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [quizTargetWords, setQuizTargetWords] = useState<WordEntry[]>([]);
  const [toast, setToast] = useState({
    message: "",
    type: "info" as any,
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: any = "info") => {
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
    const newWord: WordEntry = {
      ...geminiData,
      id: crypto.randomUUID(),
      userId: user?.uid || "guest",
      bookId: currentBookId,
      timestamp: Date.now(),
      status: "unknown",
      isTrashed: false,
    };
    setWords((prev) => [newWord, ...prev]);
    await dbService.addWord(newWord);
    showToast(`「${newWord.word}」を保存しました`, "success");
    setSearchResult(null);
    setSearchQuery("");
  };

  // 強化された単語フィルタリング: 単語帳が見つからない場合は全表示にフォールバック
  const activeWords = useMemo(() => {
    let filtered = words.filter((w) => !w.isTrashed);
    // もし「すべて」が選ばれているか、選んだ単語帳が存在しない場合は全表示
    if (currentBookId === "all" || !books.find((b) => b.id === currentBookId)) {
      return filtered;
    }
    return filtered.filter((w) => w.bookId === currentBookId);
  }, [words, currentBookId, books]);

  // 表示用の単語帳名を安定して取得する
  const currentBookName = useMemo(() => {
    if (currentBookId === "all") return "すべての単語";
    const book = books.find((b) => b.id === currentBookId);
    return book ? book.title : "未分類の単語";
  }, [books, currentBookId]);

  // 単語帳選択の堅牢化: 指定の単語帳が見つからない場合は可能な復旧を試みる
  const handleSelectBook = useCallback(
    async (id: string) => {
      if (id === "all") {
        setCurrentBookId("all");
        return;
      }
      const bookExists = books.find((b) => b.id === id);
      if (bookExists) {
        setCurrentBookId(id);
        return;
      }
      // 指定された単語帳が見つからない場合、同じ id を参照する単語が存在するか確認
      const referenced = words.find((w) => w.bookId === id);
      if (referenced) {
        // 単語は存在するがメタデータが欠けているケース
        setCurrentBookId(id);
        showToast(
          "注意: 単語帳のメタデータが見つかりません。該当IDの単語を表示します。",
          "warning",
        );
        return;
      }
      // 最後の手段で全表示に戻す
      setCurrentBookId("all");
      showToast(
        "選択した単語帳は見つかりませんでした。全ての単語を表示します。",
        "info",
      );
    },
    [books, words, showToast],
  );

  // 単語帳の作成/変更/削除ハンドラ
  const handleCreateBook = useCallback(
    async (title: string, description: string) => {
      const newBook = {
        id: crypto.randomUUID(),
        title,
        description,
        timestamp: Date.now(),
        userId: user?.uid || "guest",
      } as any;
      setBooks((prev) => [newBook, ...prev]);
      await dbService.addBook(newBook);
      setCurrentBookId(newBook.id);
      showToast("単語帳を作成しました", "success");
    },
    [user, showToast],
  );

  const handleRenameBook = useCallback(
    async (id: string, newTitle: string) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, title: newTitle } : b)),
      );
      await dbService.updateBook(id, { title: newTitle });
      showToast("単語帳名を変更しました", "success");
    },
    [showToast],
  );

  const handleDeleteBook = useCallback(
    async (id: string) => {
      // ローカル状態を先に更新
      setBooks((prev) => prev.filter((b) => b.id !== id));
      const affected = words.filter((w) => w.bookId === id).map((w) => w.id);
      setWords((prev) => prev.filter((w) => w.bookId !== id));
      // DB側の削除
      try {
        await dbService.deleteBook(id);
        // 単語も完全削除する
        await Promise.all(
          affected.map((id) => dbService.permanentDeleteWord(id)),
        );
        showToast("単語帳と含まれる単語を削除しました", "success");
      } catch (e: any) {
        showToast("削除中にエラーが発生しました", "error");
      }
      // 削除後は全表示に戻す
      setCurrentBookId("all");
    },
    [words, showToast],
  );

  // 欠損している bookId を参照する単語帳を自動復元（参照されている id と同じ id のプレースホルダを作成）
  const repairMissingBooks = useCallback(async () => {
    const existingBookIds = new Set(books.map((b) => b.id));
    const referencedIds = Array.from(
      new Set<string>(
        words
          .map((w) => w.bookId)
          .filter((v): v is string => typeof v === "string"),
      ),
    );

    const missing: string[] = referencedIds.filter(
      (id) => !existingBookIds.has(id) && id !== "all" && id !== "default",
    );
    if (missing.length === 0) {
      showToast("欠損している単語帳は見つかりませんでした", "info");
      return;
    }
    const created: string[] = [];
    for (const id of missing) {
      const title = `復元: 単語帳 (${id.slice(0, 6)})`;
      const newBook = {
        id,
        title,
        description: "自動復元された単語帳",
        timestamp: Date.now(),
        userId: user?.uid || "guest",
      } as any;
      try {
        await dbService.addBook(newBook);
        created.push(title);
      } catch (e) {
        console.error("book create error", e);
      }
    }
    // 再読み込みしてローカル状態を更新
    const data = await dbService.loadAll();
    setBooks(data.books);
    showToast(`復元完了: ${created.length} 件`, "success");
  }, [books, words, user, showToast]);

  if (isGlobalLoading)
    return <div className="p-20 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenUsage={() => {}}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBooks={() => setShowBooks(true)}
        currentBookName={currentBookName}
        onRepairBooks={repairMissingBooks}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={() => logout()}
      />
      <main className="max-w-4xl mx-auto p-4">
        {currentView === "search" && (
          <div className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setIsSearching(true);
                  fetchWordDetails(searchQuery)
                    .then(setSearchResult)
                    .catch((err) => showToast(err.message, "error"))
                    .finally(() => setIsSearching(false));
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="英単語を入力..."
                className="flex-1 p-4 rounded-2xl border-2 focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 rounded-2xl font-bold"
              >
                検索
              </button>
            </form>
            {isSearching && <SkeletonLoader />}
            {searchResult && (
              <WordCard
                word={
                  {
                    ...searchResult,
                    id: "temp",
                    status: "unknown",
                    timestamp: Date.now(),
                  } as any
                }
              />
            )}
            {searchResult && (
              <button
                onClick={() => handleAddWord(searchResult)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg"
              >
                単語帳に追加
              </button>
            )}
            {!searchResult && !isSearching && (
              <StatsDashboard
                history={activeWords}
                onStartDailyQuiz={(w) => {
                  setQuizTargetWords(w);
                  setCurrentView("quiz");
                }}
              />
            )}
          </div>
        )}
        {currentView === "list" && (
          <div className="space-y-4">
            {activeWords.map((w) => (
              <WordCard
                key={w.id}
                word={w}
                onStatusChange={(id, status) =>
                  dbService.updateWord(id, { status })
                }
              />
            ))}
          </div>
        )}
        {currentView === "quiz" && (
          <QuizView
            history={activeWords}
            onUpdateStatus={dbService.updateWord.bind(dbService)}
            onExit={() => setCurrentView("search")}
            preselectedWords={quizTargetWords}
          />
        )}
      </main>
      <BookListModal
        isOpen={showBooks}
        onClose={() => setShowBooks(false)}
        books={books}
        currentBookId={currentBookId}
        onSelectBook={handleSelectBook}
        onCreateBook={handleCreateBook}
        onDeleteBook={handleDeleteBook}
        onRenameBook={handleRenameBook}
        allBookId={"all"}
        allWordsCount={words.filter((w) => !w.isTrashed).length}
      />

      <LoginConfirmModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onConfirm={handleLogin}
        onRedirectConfirm={handleLogin}
      />
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};
export default App;
