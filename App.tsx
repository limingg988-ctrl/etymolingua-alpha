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
import { WordIntelligenceView } from "./components/WordIntelligenceView";
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
  const WORDS_PAGE_SIZE = 30;
  const INITIAL_VISIBLE_COUNT = 20;
  const VISIBLE_COUNT_STEP = 20;
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
  const [isWordsLoading, setIsWordsLoading] = useState(false);
  const [isLoadingMoreWords, setIsLoadingMoreWords] = useState(false);
  const [hasMoreWords, setHasMoreWords] = useState(false);
  const [wordsCursor, setWordsCursor] = useState<any>(null);
  const [allWordsCount, setAllWordsCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listSort, setListSort] = useState<"newest" | "oldest" | "wordAsc" | "status">("newest");
  const [selectedRootChip, setSelectedRootChip] = useState<string>("all");
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

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

  const applyLoadedData = useCallback((data: { books: BookMetadata[]; notes: NoteEntry[] }) => {
    setBooks(data.books);
    setNotes(data.notes.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const loadFirstWordsPage = useCallback(async (bookId: string) => {
    setIsWordsLoading(true);
    try {
      const page = await dbService.loadWordsPage(bookId, null, WORDS_PAGE_SIZE, "server");
      setWords(page.words);
      setWordsCursor(page.nextCursor);
      setHasMoreWords(page.hasMore);
    } catch (error) {
      console.error("Failed to load words page:", error);
      showToast("単語の読み込みに失敗しました。通信状態を確認してください。", "error");
      setWords([]);
      setWordsCursor(null);
      setHasMoreWords(false);
    } finally {
      setIsWordsLoading(false);
    }
  }, [WORDS_PAGE_SIZE, showToast]);

  const loadAllWordsCount = useCallback(async () => {
    try {
      const count = await dbService.countWords("all");
      setAllWordsCount(count);
    } catch (error) {
      console.warn("Failed to count all words:", error);
    }
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
      await Promise.all([loadFirstWordsPage(currentBookId), loadAllWordsCount()]);
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
  }, [applyLoadedData, currentBookId, isGlobalLoading, loadAllWordsCount, loadFirstWordsPage, showToast]);

  const loadMoreWords = useCallback(async () => {
    if (!hasMoreWords || isLoadingMoreWords) return;
    setIsLoadingMoreWords(true);
    try {
      const page = await dbService.loadWordsPage(
        currentBookId,
        wordsCursor,
        WORDS_PAGE_SIZE,
        "server",
      );
      setWords((prev) => [...prev, ...page.words]);
      setWordsCursor(page.nextCursor);
      setHasMoreWords(page.hasMore);
    } catch (error) {
      console.error("Failed to load more words:", error);
      showToast("追加読み込みに失敗しました。", "error");
    } finally {
      setIsLoadingMoreWords(false);
    }
  }, [WORDS_PAGE_SIZE, currentBookId, hasMoreWords, isLoadingMoreWords, showToast, wordsCursor]);


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

  useEffect(() => {
    if (isGlobalLoading) return;
    loadFirstWordsPage(currentBookId);
  }, [currentBookId, isGlobalLoading, loadFirstWordsPage]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [currentBookId]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [listSearchQuery, listSort, selectedRootChip]);

  useEffect(() => {
    if (!selectedWordId) return;
    const stillExists = words.some((word) => word.id === selectedWordId && !word.isTrashed);
    if (!stillExists) setSelectedWordId(null);
  }, [selectedWordId, words]);

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
      await loadAllWordsCount();
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

  const handleStartDailyQuiz = useCallback((selectedWords: WordEntry[]) => {
    setQuizTargetWords(selectedWords);
    setCurrentView("quiz");
  }, []);

  const handleMoveWordToTrash = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isTrashed: true } : w)),
      );
      try {
        await dbService.deleteWord(id);
        await loadAllWordsCount();
        showToast("単語をゴミ箱に移動しました", "info");
      } catch (error: any) {
        setWords((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isTrashed: false } : w)),
        );
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast, loadAllWordsCount],
  );

  const handleRestoreWord = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isTrashed: false } : w)),
      );
      try {
        await dbService.restoreWord(id);
        await loadAllWordsCount();
        showToast("単語を復元しました", "success");
      } catch (error: any) {
        setWords((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isTrashed: true } : w)),
        );
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast, loadAllWordsCount],
  );

  const handlePermanentDeleteWord = useCallback(
    async (id: string) => {
      if (!ensureWritableSession()) return;
      const snapshot = words;
      setWords((prev) => prev.filter((w) => w.id !== id));
      try {
        await dbService.permanentDeleteWord(id);
        await loadAllWordsCount();
        showToast("単語を完全削除しました", "success");
      } catch (error: any) {
        setWords(snapshot);
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast, words, loadAllWordsCount],
  );

  const handleEmptyTrash = useCallback(async () => {
    if (!ensureWritableSession()) return;
    const targetIds = words.filter((w) => w.isTrashed).map((w) => w.id);
    if (targetIds.length === 0) return;
    const snapshot = words;
    setWords((prev) => prev.filter((w) => !w.isTrashed));
    try {
      await Promise.all(targetIds.map((id) => dbService.permanentDeleteWord(id)));
      await loadAllWordsCount();
      showToast("ゴミ箱を空にしました", "success");
    } catch (error: any) {
      setWords(snapshot);
      showToast(getFirebaseErrorMessage(error), "error");
    }
  }, [ensureWritableSession, getFirebaseErrorMessage, words, showToast, loadAllWordsCount]);

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

  // 単語フィルタリング: "all" のときのみ全件（ゴミ箱除く）を対象にする
  const activeWords = useMemo(() => {
    const filtered = words.filter((w) => !w.isTrashed);

    if (currentBookId === "all") {
      return filtered;
    }

    return filtered.filter((w) => w.bookId === currentBookId);
  }, [words, currentBookId]);

  const listRootChips = useMemo(() => {
    const allRoots = activeWords.flatMap((word) =>
      (word.etymology.match(/-[a-z]{2,}/gi) || []).map((token) => token.toLowerCase()),
    );
    return ["all", ...Array.from(new Set(allRoots)).slice(0, 16)];
  }, [activeWords]);

  const filteredListWords = useMemo(() => {
    const q = listSearchQuery.trim().toLowerCase();
    return activeWords.filter((word) => {
      const queryHit =
        q.length === 0 ||
        word.word.toLowerCase().includes(q) ||
        word.meaning.toLowerCase().includes(q) ||
        word.etymology.toLowerCase().includes(q);
      const rootHit =
        selectedRootChip === "all" ||
        (word.etymology.match(/-[a-z]{2,}/gi) || [])
          .map((token) => token.toLowerCase())
          .includes(selectedRootChip);
      return queryHit && rootHit;
    });
  }, [activeWords, listSearchQuery, selectedRootChip]);

  const sortedListWords = useMemo(() => {
    const statusRank: Record<WordStatus, number> = {
      unknown: 0,
      learning: 1,
      mastered: 2,
    };
    const copied = [...filteredListWords];
    copied.sort((a, b) => {
      if (listSort === "oldest") return a.timestamp - b.timestamp;
      if (listSort === "wordAsc") return a.word.localeCompare(b.word);
      if (listSort === "status") {
        const statusDiff = statusRank[a.status] - statusRank[b.status];
        return statusDiff !== 0 ? statusDiff : b.timestamp - a.timestamp;
      }
      return b.timestamp - a.timestamp;
    });
    return copied;
  }, [filteredListWords, listSort]);

  const visibleWords = useMemo(
    () => sortedListWords.slice(0, visibleCount),
    [sortedListWords, visibleCount],
  );

  const selectedListWord = useMemo(
    () => activeWords.find((word) => word.id === selectedWordId) || null,
    [activeWords, selectedWordId],
  );

  // 表示用の単語帳名を安定して取得する
  const currentBookName = useMemo(() => {
    if (currentBookId === "all") return "全単語（ゴミ箱除く）";
    const book = books.find((b) => b.id === currentBookId);
    return book ? book.title : "単語帳情報なし（ID指定中）";
  }, [books, currentBookId]);

  const handleUpdateWordStatus = useCallback(
    async (id: string, status: WordStatus) => {
      if (!ensureWritableSession()) return;
      const snapshot = words;
      setWords((prev) => prev.map((word) => (word.id === id ? { ...word, status } : word)));
      try {
        await dbService.updateWord(id, { status });
      } catch (error: any) {
        setWords(snapshot);
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [ensureWritableSession, getFirebaseErrorMessage, showToast, words],
  );

  // 単語帳選択: 未知IDでも即座に "all" / default へ戻さず、選択IDを維持する
  const handleSelectBook = useCallback(
    async (id: string) => {
      if (id === "all") {
        setCurrentBookId("all");
        return;
      }

      setCurrentBookId(id);

      const bookExists = books.some((b) => b.id === id);
      if (bookExists) {
        return;
      }

      const referenced = words.some((w) => w.bookId === id);
      showToast(
        referenced
          ? "注意: 単語帳のメタデータが見つかりません。ID一致の単語のみ表示します。"
          : "選択した単語帳は見つかりません。ID一致の単語があれば表示します。",
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
        await loadAllWordsCount();
        showToast("単語帳と含まれる単語を削除しました", "success");
      } catch (e: any) {
        showToast(getFirebaseErrorMessage(e), "error");
      }
      // 削除後は全表示に戻す
      setCurrentBookId("all");
    },
    [ensureWritableSession, getFirebaseErrorMessage, words, showToast, loadAllWordsCount],
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
    return <div className="p-20 text-center text-surface-700">{t(language, "app.loading")}</div>;

  return (
    <div className="min-h-screen bg-surface-50">
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
      <main className="app-main-shell md:pl-56">
          <section className="app-main-container">
        {currentView === "search" && (
          <div className="view-stack">
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
                className="flex-1 p-4 rounded-2xl border-2 border-surface-200 bg-white text-surface-900 focus:border-primary-500 outline-none"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 rounded-2xl font-bold"
              >
                {t(language, "app.search")}
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-surface-500 font-bold">{t(language, "app.searchMode")}</span>
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
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-surface-700 border-surface-200 hover:border-primary-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-500">
              複数検索は「, / 改行 / ;」区切りで入力できます（例: take off, resilience, look up）。「/」を含む語は1語として扱います。
            </p>
            {isSearching && <SkeletonLoader />}
            {searchResults.map((result, idx) => (
              <div key={`${result.word}-${idx}`} className="space-y-2 ui-glass ui-rounded-panel p-3">
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
                  className="w-full bg-primary-600 text-white py-3 rounded-2xl font-bold ui-elevation"
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
                className="w-full bg-secondary-500 text-white py-4 rounded-2xl font-bold ui-elevation"
              >
                {t(language, "app.addAll", { count: searchResults.length })}
              </button>
            )}
            {searchResults.length === 0 && !isSearching && (
              <StatsDashboard
                history={activeWords}
                onStartDailyQuiz={handleStartDailyQuiz}
              />
            )}
          </div>
        )}
        {currentView === "list" && (
          <div className="view-stack">
            {selectedListWord ? (
              <WordIntelligenceView
                word={selectedListWord}
                onBack={() => setSelectedWordId(null)}
                onSearchRelated={handleSearchWord}
                onMarkMastered={() => handleUpdateWordStatus(selectedListWord.id, "mastered")}
                onPractice={() => handleUpdateWordStatus(selectedListWord.id, "learning")}
                onStartQuiz={() => {
                  setQuizTargetWords([selectedListWord]);
                  setCurrentView("quiz");
                }}
              />
            ) : (
              <>
                <div className="ui-glass ui-rounded-panel p-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {listRootChips.map((root) => (
                      <button
                        key={root}
                        type="button"
                        onClick={() => setSelectedRootChip(root)}
                        className={`px-3 py-1.5 text-xs rounded-full border font-bold transition-colors ${
                          selectedRootChip === root
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        {root === "all" ? "すべてのroot" : root}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      value={listSearchQuery}
                      onChange={(e) => setListSearchQuery(e.target.value)}
                      placeholder="見出し / 意味 / 語源で検索"
                      className="flex-1 p-3 rounded-xl border border-surface-200 bg-white text-surface-900 outline-none focus:border-primary-500"
                    />
                    <select
                      value={listSort}
                      onChange={(e) =>
                        setListSort(e.target.value as "newest" | "oldest" | "wordAsc" | "status")
                      }
                      className="md:w-52 p-3 rounded-xl border border-surface-200 bg-white text-surface-900 outline-none focus:border-primary-500"
                    >
                      <option value="newest">新しい順</option>
                      <option value="oldest">古い順</option>
                      <option value="wordAsc">見出しA→Z</option>
                      <option value="status">ステータス順</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-surface-500 font-medium">
                  {`${visibleWords.length} / ${sortedListWords.length}`}
                </div>
                {visibleWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onDelete={handleMoveWordToTrash}
                    onSearchRelated={handleSearchWord}
                    onStatusChange={handleUpdateWordStatus}
                    compact
                    onOpenDetail={(target) => setSelectedWordId(target.id)}
                  />
                ))}
                {isWordsLoading && <SkeletonLoader />}
                {sortedListWords.length > visibleWords.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + VISIBLE_COUNT_STEP, sortedListWords.length),
                      )
                    }
                    className="w-full bg-white border border-surface-200 text-surface-700 py-3 rounded-2xl font-bold"
                  >
                    さらに表示
                  </button>
                )}
              </>
            )}
          </div>
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
          </section>
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
        allWordsCount={allWordsCount}
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
