import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Header } from "./components/Header";
import { WordCard } from "./components/WordCard";
import { StatsDashboard } from "./components/StatsDashboard";
import { ChatAssistant } from "./components/ChatAssistant";
import { SmartNotebook } from "./components/SmartNotebook";
import { SettingsModal } from "./components/SettingsModal";
import { BookListModal } from "./components/BookListModal";
import { QuizView } from "./components/QuizView";
import { TrashView } from "./components/TrashView";
import { ThesaurusView } from "./components/ThesaurusView";
import { UsageGuide } from "./components/UsageGuide";
import { Toast } from "./components/Toast";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { LoginConfirmModal } from "./components/LoginConfirmModal";
import { VirtualizedWordList } from "./components/VirtualizedWordList";
import {
  WordEntry,
  NoteEntry,
  BookMetadata,
  GeminiResponse,
  WordStatus,
} from "./types";
import { fetchWordDetails, SearchFocus } from "./services/geminiService";
import { dbService, auth, loginWithGoogle, logout } from "./services/firebase";
import { exportToJSON } from "./services/csvExportService";
import { onAuthStateChanged } from "firebase/auth";
import { AppLanguage, t } from "./services/i18n";

type ViewMode =
  | "search"
  | "list"
  | "chat"
  | "notebook"
  | "thesaurus"
  | "quiz"
  | "trash";

const App: React.FC = () => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>("search");
  const [user, setUser] = useState<any>(null);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeminiResponse[]>([]);
  const [searchFocus, setSearchFocus] = useState<SearchFocus>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [quizTargetWords, setQuizTargetWords] = useState<WordEntry[]>([]);
  const [language, setLanguage] = useState<AppLanguage>(() => (localStorage.getItem("app-language") as AppLanguage) || "ja");
  const [toast, setToast] = useState({
    message: "",
    type: "info" as any,
    isVisible: false,
  });
  const loadRequestIdRef = useRef(0);
  const [isHydratingFreshData, setIsHydratingFreshData] = useState(false);

  const showToast = useCallback((message: string, type: any = "info") => {
    setToast({ message, type, isVisible: true });
  }, []);

  const getFirebaseErrorMessage = useCallback((error: any) => {
    if (error?.code === "permission-denied") {
      return t(language, "app.firebaseDenied");
    }
    if (error?.message === "auth-required") {
      return t(language, "app.loginRequired");
    }
    return error?.message || "操作に失敗しました";
  }, [language]);

  const ensureWritableSession = useCallback(() => {
    if (isHydratingFreshData) {
      showToast("同期中です。少し待ってから再度お試しください。", "info");
      return false;
    }
    if (!user) {
      setShowLogin(true);
      showToast(t(language, "app.saveLoginRequired"), "warning");
      return false;
    }
    return true;
  }, [isHydratingFreshData, language, user, showToast]);

  const applyLoadedData = useCallback((data: { words: WordEntry[]; books: BookMetadata[]; notes: NoteEntry[] }) => {
    setWords(data.words.sort((a, b) => b.timestamp - a.timestamp));
    setBooks(data.books);
    setNotes(data.notes.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const loadData = useCallback(async () => {
    const requestId = Date.now();
    loadRequestIdRef.current = requestId;
    let hasAppliedCachedData = false;

    try {
      const cached = await dbService.loadAllFromCache();
      if (cached && loadRequestIdRef.current === requestId) {
        applyLoadedData(cached);
        hasAppliedCachedData = true;
        setIsGlobalLoading(false);
      }

      setIsHydratingFreshData(true);
      const freshData = await dbService.loadAll();
      if (loadRequestIdRef.current === requestId) {
        applyLoadedData(freshData);
      }
    } catch (error) {
      console.error("Failed to load fresh Firestore data:", error);
      if (loadRequestIdRef.current === requestId && isGlobalLoading) {
        setIsGlobalLoading(false);
      }
      if (hasAppliedCachedData) {
        showToast("最新データの同期に失敗しました。キャッシュ表示を継続します。", "warning");
      } else {
        showToast("データの読み込みに失敗しました。通信状態を確認してください。", "error");
      }
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setIsHydratingFreshData(false);
        setIsGlobalLoading(false);
      }
    }
  }, [applyLoadedData, isGlobalLoading, showToast]);


  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);
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
    if (!ensureWritableSession()) return;
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
    try {
      await dbService.addWord(newWord);
      showToast(`「${newWord.word}」を保存しました`, "success");
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      setWords((prev) => prev.filter((w) => w.id !== newWord.id));
      showToast(getFirebaseErrorMessage(error), "error");
    }
  };

  const parseSearchQueries = useCallback((raw: string) => {
    const normalized = raw.replace(/、/g, ",").replace(/\n/g, ",").replace(/;/g, ",");
    return normalized
      .split(",")
      .map((q) => q.trim())
      .filter(Boolean);
  }, []);

  const handleSearchWord = useCallback(
    async (word: string) => {
      const query = word.trim();
      if (!query) return;
      setCurrentView("search");
      setSearchQuery(query);
      setIsSearching(true);
      try {
        const result = await fetchWordDetails(query, { focus: searchFocus });
        setSearchResults([result]);
      } catch (err: any) {
        showToast(err.message || t(language, "app.searchFailed"), "error");
      } finally {
        setIsSearching(false);
      }
    },
    [language, searchFocus, showToast],
  );

  const handleSearchSubmit = useCallback(async () => {
    const queries = parseSearchQueries(searchQuery);
    if (queries.length === 0) return;

    setIsSearching(true);
    setSearchResults([]);

    const results: GeminiResponse[] = [];
    for (const query of queries) {
      try {
        const result = await fetchWordDetails(query, { focus: searchFocus });
        results.push(result);
      } catch (err: any) {
        showToast(`「${query}」: ${err.message || t(language, "app.searchFailed")}`, "error");
      }
    }
    setSearchResults(results);
    setIsSearching(false);
  }, [language, parseSearchQueries, searchFocus, searchQuery, showToast]);

  const handleMoveWordToTrash = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isTrashed: true } : w)),
      );
      try {
        await dbService.deleteWord(id);
        showToast("単語をゴミ箱に移動しました", "info");
      } catch (error: any) {
        setWords((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isTrashed: false } : w)),
        );
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast],
  );

  const handleRestoreWord = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isTrashed: false } : w)),
      );
      try {
        await dbService.restoreWord(id);
        showToast("単語を復元しました", "success");
      } catch (error: any) {
        setWords((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isTrashed: true } : w)),
        );
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast],
  );

  const handlePermanentDeleteWord = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      const snapshot = words;
      setWords((prev) => prev.filter((w) => w.id !== id));
      try {
        await dbService.permanentDeleteWord(id);
        showToast("単語を完全削除しました", "success");
      } catch (error: any) {
        setWords(snapshot);
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast, words],
  );

  const handleEmptyTrash = useCallback(async () => {
    if (!ensureWritableSession()) return;
    const targetIds = words.filter((w) => w.isTrashed).map((w) => w.id);
    if (targetIds.length === 0) return;
    const snapshot = words;
    setWords((prev) => prev.filter((w) => !w.isTrashed));
    try {
      await Promise.all(targetIds.map((id) => dbService.permanentDeleteWord(id)));
      showToast("ゴミ箱を空にしました", "success");
    } catch (error: any) {
      setWords(snapshot);
      showToast(getFirebaseErrorMessage(error), "error");
    }
  }, [ensureWritableSession, getFirebaseErrorMessage, words, showToast]);

  const handleSaveNote = useCallback(
    async (title: string, content: string, tags: string[]) => {
      if (!ensureWritableSession()) return;
      const note: NoteEntry = {
        id: crypto.randomUUID(),
        userId: user?.uid || "guest",
        title,
        content,
        tags,
        timestamp: Date.now(),
      };
      setNotes((prev) => [note, ...prev]);
      try {
        await dbService.addNote(note);
        showToast("ノートに保存しました", "success");
      } catch (error: any) {
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, user, showToast],
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      const snapshot = notes;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      try {
        await dbService.permanentDeleteNote(id);
        showToast("ノートを削除しました", "info");
      } catch (error: any) {
        setNotes(snapshot);
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, notes, showToast],
  );

  const handleImportJSON = useCallback(
    async (file: File) => {
      if (!ensureWritableSession()) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text);

        const importedWords: WordEntry[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.words)
            ? raw.words
            : [];
        const importedBooks: BookMetadata[] = Array.isArray(raw.books)
          ? raw.books
          : [];

        if (importedWords.length === 0) {
          showToast(t(language, "app.noWordsImported"), "warning");
          return;
        }

        const normalizedWords = importedWords.map((w) => ({
          ...w,
          id: w.id || crypto.randomUUID(),
          userId: user?.uid || "guest",
          timestamp: w.timestamp || Date.now(),
          status: w.status || "unknown",
          isTrashed: !!w.isTrashed,
        }));
        const normalizedBooks = importedBooks.map((b: any) => ({
          ...b,
          userId: user?.uid || "guest",
        }));

        await dbService.saveWordsBatch(normalizedWords);
        await Promise.all(normalizedBooks.map((book: any) => dbService.addBook(book)));

        await loadData();
        showToast(`インポート完了: ${normalizedWords.length} 語`, "success");
      } catch (error) {
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, loadData, showToast, user],
  );

  // 単語フィルタリング: "all" 以外は常に選択中の bookId のみを対象にする
  const activeWords = useMemo(() => {
    const filtered = words.filter((w) => !w.isTrashed);

    if (currentBookId === "all") {
      return filtered;
    }

    const selectedBook = books.find((b) => b.id === currentBookId);
    if (!selectedBook) {
      return [];
    }

    return filtered.filter((w) => w.bookId === currentBookId);
  }, [words, currentBookId, books]);

  // 表示用の単語帳名を安定して取得する
  const currentBookName = useMemo(() => {
    if (currentBookId === "all") return "すべての単語";
    const book = books.find((b) => b.id === currentBookId);
    return book ? book.title : "不明な単語帳（参照切れ）";
  }, [books, currentBookId]);

  const handleUpdateWordStatus = useCallback(
    async (id: string, status: WordStatus) => {
      if (!ensureWritableSession()) return;
      try {
        await dbService.updateWord(id, { status });
      } catch (error: any) {
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast],
  );

  // 単語帳選択: 見つからない場合は即時 all に戻さず、default へ復帰させる
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
      // 最後の手段で default に戻し、全件表示への誤誘導を避ける
      const defaultBook = books.find((b) => b.id === "default");
      if (defaultBook) {
        setCurrentBookId("default");
        showToast(
          "選択した単語帳は見つかりませんでした。既定の単語帳に戻します。",
          "warning",
        );
        return;
      }

      setCurrentBookId(id);
      showToast(
        "選択した単語帳は見つかりませんでした。選択状態を維持します。",
        "warning",
      );
    },
    [books, words, showToast],
  );

  // 単語帳の作成/変更/削除ハンドラ
  const handleCreateBook = useCallback(
    async (title: string, description: string) => {
      if (!ensureWritableSession()) return;
      const newBook = {
        id: crypto.randomUUID(),
        title,
        description,
        timestamp: Date.now(),
        userId: user?.uid || "guest",
      } as any;
      setBooks((prev) => [newBook, ...prev]);
      try {
        await dbService.addBook(newBook);
        setCurrentBookId(newBook.id);
        showToast("単語帳を作成しました", "success");
      } catch (error: any) {
        setBooks((prev) => prev.filter((b) => b.id !== newBook.id));
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, user, showToast],
  );

  const handleRenameBook = useCallback(
    async (id: string, newTitle: string) => {
      if (!ensureWritableSession()) return;
      const snapshot = books;
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, title: newTitle } : b)),
      );
      try {
        await dbService.updateBook(id, { title: newTitle });
        showToast("単語帳名を変更しました", "success");
      } catch (error: any) {
        setBooks(snapshot);
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [books, ensureWritableSession, getFirebaseErrorMessage, showToast],
  );

  const handleDeleteBook = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
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
        showToast(getFirebaseErrorMessage(e), "error");
      }
      // 削除後は全表示に戻す
      setCurrentBookId("all");
    },
    [ensureWritableSession, getFirebaseErrorMessage, words, showToast],
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
    return <div className="p-20 text-center">{t(language, "app.loading")}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenUsage={() => setShowUsage(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBooks={() => setShowBooks(true)}
        currentBookName={currentBookName}
        onRepairBooks={repairMissingBooks}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={() => logout()}
        language={language}
        onLanguageChange={setLanguage}
      />
      <main className="max-w-4xl mx-auto p-4">
        {currentView === "search" && (
          <div className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(language, "app.searchPlaceholder")}
                className="flex-1 p-4 rounded-2xl border-2 focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 rounded-2xl font-bold"
              >
                {t(language, "app.search")}
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">{t(language, "app.searchMode")}</span>
              {([
                { key: "all", label: "すべて" },
                { key: "idioms", label: "idiom重視" },
                { key: "etymology", label: "語源重視" },
                { key: "core", label: "要点のみ" },
              ] as { key: SearchFocus; label: string }[]).map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setSearchFocus(mode.key)}
                  className={`px-3 py-1.5 rounded-full border font-bold transition-colors ${
                    searchFocus === mode.key
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              複数検索は「, / 改行 / ;」区切りで入力できます（例: take off, resilience, look up）。「/」を含む語は1語として扱います。
            </p>
            {isSearching && <SkeletonLoader />}
            {searchResults.map((result, idx) => (
              <div key={`${result.word}-${idx}`} className="space-y-2">
                <WordCard
                  word={
                    {
                      ...result,
                      id: `temp-${idx}`,
                      status: "unknown",
                      timestamp: Date.now(),
                    } as any
                  }
                />
                <button
                  onClick={() => handleAddWord(result)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg"
                >
                  {t(language, "app.addWord", { word: result.word })}
                </button>
              </div>
            ))}
            {searchResults.length > 1 && (
              <button
                onClick={async () => {
                  for (const result of searchResults) {
                    await handleAddWord(result);
                  }
                }}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg"
              >
                {t(language, "app.addAll", { count: searchResults.length })}
              </button>
            )}
            {searchResults.length === 0 && !isSearching && (
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
          <VirtualizedWordList
            words={activeWords}
            onDelete={handleMoveWordToTrash}
            onSearchRelated={handleSearchWord}
            onStatusChange={handleUpdateWordStatus}
          />
        )}
        {currentView === "chat" && (
          <ChatAssistant onSaveNote={handleSaveNote} wordHistory={activeWords} language={language} />
        )}
        {currentView === "notebook" && (
          <SmartNotebook notes={notes} onDeleteNote={handleDeleteNote} />
        )}
        {currentView === "thesaurus" && (
          <ThesaurusView history={activeWords} onSearch={handleSearchWord} />
        )}
        {currentView === "quiz" && (
          <QuizView
            history={activeWords}
            onUpdateStatus={async (id, status, srsUpdates) => {
              if (!ensureWritableSession()) return;
              try {
                await dbService.updateWord(id, { status, ...(srsUpdates || {}) });
              } catch (error: any) {
                showToast(getFirebaseErrorMessage(error), "error");
              }
            }}
            onExit={() => setCurrentView("search")}
            preselectedWords={quizTargetWords}
            onLookupWord={handleSearchWord}
            language={language}
          />
        )}
        {currentView === "trash" && (
          <TrashView
            trashHistory={words.filter((w) => w.isTrashed)}
            onRestore={handleRestoreWord}
            onDeletePermanently={handlePermanentDeleteWord}
            onEmptyTrash={handleEmptyTrash}
            onClose={() => setCurrentView("list")}
          />
        )}
      </main>

      <UsageGuide isOpen={showUsage} onClose={() => setShowUsage(false)} />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExportJSON={() => exportToJSON(words.filter((w) => !w.isTrashed))}
        onImportJSON={handleImportJSON}
        wordCount={activeWords.length}
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
