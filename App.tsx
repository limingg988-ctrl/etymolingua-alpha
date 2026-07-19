import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
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
import { AnalyticsView } from "./components/AnalyticsView";
import { FeedbackModal, FeedbackCategory, FeedbackContext } from "./components/FeedbackModal";
import { EikenSpeakingView } from "./components/eiken/EikenSpeakingView";
import {
  WordEntry,
  NoteEntry,
  BookMetadata,
  GeminiResponse,
  WordStatus,
} from "./types";
import { fetchWordDetails, SearchFocus, AiSpeedMode } from "./services/geminiService";
import {
  dbService,
  auth,
  ClientAuthErrorLog,
  loginWithGooglePopup,
  loginWithGoogleRedirect,
  consumeRedirectResult,
  logout,
} from "./services/firebase";
import { exportToJSON } from "./services/csvExportService";
import { onAuthStateChanged } from "firebase/auth";
import { AppLanguage, t } from "./services/i18n";

type ViewMode =
  | "search"
  | "list"
  | "analytics"
  | "chat"
  | "notebook"
  | "thesaurus"
  | "quiz"
  | "eikenSpeaking"
  | "trash";

const App: React.FC = () => {
  const NOTICE_KEY = "notice_api_fix_dismissed";
  const NOTICE_EXPIRY = new Date(2026, 5, 5).getTime();
  const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;
  const MAX_IMPORT_WORDS = 2000;
  const MAX_IMPORT_BOOKS = 100;
  const WORDS_PAGE_SIZE = 30;
  const INITIAL_VISIBLE_COUNT = 20;
  const VISIBLE_COUNT_STEP = 20;
  const INITIAL_SEARCH_RESULTS_VISIBLE = 3;
  const SEARCH_RESULTS_VISIBLE_STEP = 3;
  const [showNotice, setShowNotice] = useState(() => {
    try {
      return !localStorage.getItem(NOTICE_KEY) && Date.now() < NOTICE_EXPIRY;
    } catch {
      return Date.now() < NOTICE_EXPIRY;
    }
  });
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
  const [aiSpeedMode, setAiSpeedMode] = useState<AiSpeedMode>("fast");
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
  const [visibleSearchResultsCount, setVisibleSearchResultsCount] = useState(INITIAL_SEARCH_RESULTS_VISIBLE);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext | undefined>(undefined);

  const showToast = useCallback((message: string, type: any = "info") => {
    setToast({ message, type, isVisible: true });
  }, []);

  const isPlainObject = useCallback((value: unknown): value is Record<string, any> => {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }, []);

  const sanitizeImportText = useCallback((value: unknown, maxLength = 5000) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
  }, []);

  const validateImportedWord = useCallback((value: unknown, index: number) => {
    if (!isPlainObject(value)) {
      throw new Error(`単語データ ${index + 1} 件目の形式が不正です。`);
    }
    const word = sanitizeImportText(value.word, 120);
    const meaning = sanitizeImportText(value.meaning, 3000);
    if (!word || !meaning) {
      throw new Error(`単語データ ${index + 1} 件目に word / meaning がありません。`);
    }
    const status = ["unknown", "learning", "mastered"].includes(value.status)
      ? value.status as WordStatus
      : "unknown";
    const timestamp = typeof value.timestamp === "number" && Number.isFinite(value.timestamp)
      ? value.timestamp
      : Date.now();
    return {
      id: typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 160) : crypto.randomUUID(),
      bookId: typeof value.bookId === "string" && value.bookId.trim() ? value.bookId.trim().slice(0, 160) : "default",
      word,
      meaning,
      pronunciation: sanitizeImportText(value.pronunciation, 500),
      etymology: sanitizeImportText(value.etymology, 5000),
      mnemonic: sanitizeImportText(value.mnemonic, 3000),
      logic: sanitizeImportText(value.logic, 5000),
      exampleSentence: sanitizeImportText(value.exampleSentence, 2000),
      exampleSentenceTranslation: sanitizeImportText(value.exampleSentenceTranslation, 2000),
      synonyms: Array.isArray(value.synonyms) ? value.synonyms.slice(0, 50) : [],
      collocations: Array.isArray(value.collocations) ? value.collocations.slice(0, 50) : [],
      derivatives: Array.isArray(value.derivatives) ? value.derivatives.filter((item: unknown) => typeof item === "string").slice(0, 80) : [],
      idioms: Array.isArray(value.idioms) ? value.idioms.slice(0, 50) : [],
      nuance: sanitizeImportText(value.nuance, 3000),
      relatedWords: Array.isArray(value.relatedWords) ? value.relatedWords.slice(0, 50) : [],
      timestamp,
      status,
      isTrashed: !!value.isTrashed,
    } as WordEntry;
  }, [isPlainObject, sanitizeImportText]);

  const validateImportedBook = useCallback((value: unknown, index: number) => {
    if (!isPlainObject(value)) {
      throw new Error(`単語帳データ ${index + 1} 件目の形式が不正です。`);
    }
    const title = sanitizeImportText(value.title, 120);
    if (!title) {
      throw new Error(`単語帳データ ${index + 1} 件目に title がありません。`);
    }
    return {
      id: typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 160) : crypto.randomUUID(),
      title,
      description: sanitizeImportText(value.description, 1000),
      createdAt: typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
        ? value.createdAt
        : Date.now(),
      color: typeof value.color === "string" ? value.color.slice(0, 120) : undefined,
    } as BookMetadata;
  }, [isPlainObject, sanitizeImportText]);

  const parseEtymolinguaImport = useCallback((raw: unknown) => {
    const importedWordsRaw = Array.isArray(raw)
      ? raw
      : isPlainObject(raw) && Array.isArray(raw.words)
        ? raw.words
        : null;
    const importedBooksRaw = isPlainObject(raw) && Array.isArray(raw.books) ? raw.books : [];

    if (!importedWordsRaw) {
      throw new Error("EtymolinguaのJSON形式ではありません。");
    }
    if (importedWordsRaw.length === 0) {
      throw new Error(t(language, "app.noWordsImported"));
    }
    if (importedWordsRaw.length > MAX_IMPORT_WORDS) {
      throw new Error(`一度に取り込める単語は${MAX_IMPORT_WORDS}語までです。`);
    }
    if (importedBooksRaw.length > MAX_IMPORT_BOOKS) {
      throw new Error(`一度に取り込める単語帳は${MAX_IMPORT_BOOKS}件までです。`);
    }

    return {
      words: importedWordsRaw.map(validateImportedWord),
      books: importedBooksRaw.map(validateImportedBook),
    };
  }, [MAX_IMPORT_BOOKS, MAX_IMPORT_WORDS, isPlainObject, language, t, validateImportedBook, validateImportedWord]);

  const dismissNotice = useCallback(() => {
    try {
      localStorage.setItem(NOTICE_KEY, "1");
    } catch {
      // Ignore storage failures and just hide the banner for this session.
    }
    setShowNotice(false);
  }, []);

  const openFeedback = useCallback((context?: FeedbackContext) => {
    setFeedbackContext(context);
    setShowFeedback(true);
  }, []);

  const submitFeedback = useCallback(async (payload: { category: FeedbackCategory; message: string; consent: boolean }) => {
    const now = Date.now();
    const throttleKey = "feedback-last-submit-at";
    const last = Number(localStorage.getItem(throttleKey) || "0");
    if (now - last < 60 * 1000) {
      throw new Error("短時間での連投はできません。1分後に再試行してください。");
    }
    localStorage.setItem(throttleKey, String(now));
    return dbService.submitFeedback({
      ...payload,
      issueId: `ISSUE-${now.toString(36).toUpperCase()}`,
      context: feedbackContext || {},
      appVersion: (import.meta as any).env?.VITE_APP_VERSION || "web-dev",
      osBrowser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      occurredAtUtc: new Date().toISOString(),
      priority: payload.category === "crash" ? "P1" : payload.category === "translation" ? "P2" : "P3",
    });
  }, [feedbackContext]);

  const getFirebaseErrorMessage = useCallback((error: any) => {
    if (error?.code === "permission-denied") {
      return t(language, "app.firebaseDenied");
    }
    if (error?.message === "auth-required") {
      return t(language, "app.loginRequired");
    }
    if (error?.code) {
      return `Firebase Auth Error: ${error.code}`;
    }
    return error?.message || "操作に失敗しました";
  }, [language]);

  const logAuthError = useCallback(
    async (context: ClientAuthErrorLog["context"], error: any) => {
      try {
        await dbService.logClientAuthError({
          context,
          errorCode: error?.code || "unknown",
          errorMessage: error?.message || String(error),
          origin: typeof window !== "undefined" ? window.location.origin : "unknown",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        });
      } catch (logError) {
        console.warn("Failed to send auth error log:", logError);
      }
    },
    [],
  );

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
    if (!showNotice) return;
    const remaining = NOTICE_EXPIRY - Date.now();
    if (remaining <= 0) {
      setShowNotice(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowNotice(false);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [showNotice, NOTICE_EXPIRY]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("currentUser.uid", currentUser?.uid || null);
      setUser(currentUser);
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = dbService.subscribeUserData(user.uid, {
      onBooks: (syncedBooks) => {
        setBooks(syncedBooks);
      },
      onNotes: (syncedNotes) => {
        setNotes(syncedNotes);
      },
      onWords: (syncedWords) => {
        setWords(syncedWords);
        setAllWordsCount(syncedWords.length);
        setWordsCursor(null);
        setHasMoreWords(false);
        setIsWordsLoading(false);
      },
      onError: () => {
        showToast("リアルタイム同期に失敗しました。通信状態を確認してください。", "error");
      },
    });
    return () => unsubscribe();
  }, [showToast, user?.uid]);

  useEffect(() => {
    const readRedirectResult = async () => {
      try {
        const result = await consumeRedirectResult();
        if (!result) return;
        setShowLogin(false);
        showToast("リダイレクトでログインしました", "success");
      } catch (error: any) {
        void logAuthError("redirect-result", error);
        showToast(`リダイレクトログインに失敗しました: ${getFirebaseErrorMessage(error)}`, "error");
      }
    };

    readRedirectResult();
  }, [getFirebaseErrorMessage, logAuthError, showToast]);

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
    setVisibleSearchResultsCount(INITIAL_SEARCH_RESULTS_VISIBLE);
  }, [searchQuery, searchFocus]);

  useEffect(() => {
    if (!selectedWordId) return;
    const stillExists = words.some((word) => word.id === selectedWordId && !word.isTrashed);
    if (!stillExists) setSelectedWordId(null);
  }, [selectedWordId, words]);

  const handlePopupLogin = async () => {
    try {
      await loginWithGooglePopup();
      setShowLogin(false);
      showToast("ポップアップでログインしました", "success");
    } catch (error: any) {
      void logAuthError("popup-login", error);
      showToast(`ポップアップログインに失敗しました: ${getFirebaseErrorMessage(error)}`, "error");
    }
  };

  const handleRedirectLogin = async () => {
    try {
      await loginWithGoogleRedirect();
    } catch (error: any) {
      void logAuthError("redirect-login", error);
      showToast(`リダイレクトログインに失敗しました: ${getFirebaseErrorMessage(error)}`, "error");
    }
  };

  const handleAddWord = async (geminiData: GeminiResponse) => {
    if (!ensureWritableSession()) return;
    if (
      words.some(
        (word) =>
          word.word.trim().toLowerCase() === geminiData.word.trim().toLowerCase() &&
          !word.isTrashed,
      )
    ) {
      showToast(`「${geminiData.word}」は既に保存されています`, "info");
      return;
    }

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
        const result = await fetchWordDetails(query, { focus: searchFocus, aiSpeedMode });
        setSearchResults([result]);
      } catch (err: any) {
        showToast(err.message || t(language, "app.searchFailed"), "error");
      } finally {
        setIsSearching(false);
      }
    },
    [aiSpeedMode, language, searchFocus, showToast],
  );

  const handleSearchSubmit = useCallback(async () => {
    const queries = parseSearchQueries(searchQuery);
    if (queries.length === 0) return;

    setIsSearching(true);
    setSearchResults([]);
    setVisibleSearchResultsCount(INITIAL_SEARCH_RESULTS_VISIBLE);

    const results: GeminiResponse[] = [];
    const CHUNK_SIZE = 5;
    for (let i = 0; i < queries.length; i += CHUNK_SIZE) {
      const chunk = queries.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (query) => {
          try {
            return await fetchWordDetails(query, { focus: searchFocus, aiSpeedMode });
          } catch (err: any) {
            showToast(`「${query}」: ${err.message || t(language, "app.searchFailed")}`, "error");
            return null;
          }
        }),
      );
      results.push(...chunkResults.filter((result): result is GeminiResponse => result !== null));
    }
    setSearchResults(results);
    setIsSearching(false);
  }, [INITIAL_SEARCH_RESULTS_VISIBLE, aiSpeedMode, language, parseSearchQueries, searchFocus, searchQuery, showToast]);

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
        const isJsonFile =
          file.name.toLowerCase().endsWith(".json") ||
          file.type === "application/json" ||
          file.type === "text/json";
        if (!isJsonFile) {
          showToast("JSONファイル（.json）のみ読み込めます。", "error");
          return;
        }
        if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
          showToast("ファイルサイズが大きすぎます。2MB以下のJSONを選択してください。", "error");
          return;
        }
        const text = await file.text();
        const raw = JSON.parse(text);
        const { words: importedWords, books: importedBooks } = parseEtymolinguaImport(raw);

        const normalizedWords = importedWords.map((w) => ({
          ...w,
          userId: user?.uid || "guest",
        }));
        const normalizedBooks = importedBooks.map((b: any) => ({
          ...b,
          userId: user?.uid || "guest",
        }));

        await dbService.saveWordsBatch(normalizedWords);
        await Promise.all(normalizedBooks.map((book: any) => dbService.addBook(book)));

        await loadData();
        showToast(`インポート完了: ${normalizedWords.length} 語`, "success");
      } catch (error: any) {
        showToast(getFirebaseErrorMessage(error), "error");
      }
    },
    [
      MAX_IMPORT_FILE_SIZE_BYTES,
      ensureWritableSession,
      getFirebaseErrorMessage,
      loadData,
      parseEtymolinguaImport,
      showToast,
      user,
    ],
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

  const visibleSearchResults = useMemo(
    () => searchResults.slice(0, visibleSearchResultsCount),
    [searchResults, visibleSearchResultsCount],
  );

  const isSearchResultAlreadySaved = useCallback(
    (result: GeminiResponse) =>
      words.some(
        (word) =>
          word.word.trim().toLowerCase() === result.word.trim().toLowerCase() &&
          !word.isTrashed,
      ),
    [words],
  );

  const handleClearSearchResults = useCallback(() => {
    setSearchResults([]);
    setVisibleSearchResultsCount(INITIAL_SEARCH_RESULTS_VISIBLE);
  }, [INITIAL_SEARCH_RESULTS_VISIBLE]);

  const handleSaveAllSearchResults = useCallback(async () => {
    if (!ensureWritableSession()) return;
    const unsavedResults = searchResults.filter(
      (result) => !isSearchResultAlreadySaved(result),
    );
    if (unsavedResults.length === 0) {
      showToast("すべての単語は既に保存されています", "info");
      return;
    }

    for (const result of unsavedResults) {
      await handleAddWord(result);
    }
  }, [ensureWritableSession, handleAddWord, isSearchResultAlreadySaved, searchResults, showToast]);

  const unsavedSearchResultsCount = useMemo(
    () => searchResults.filter((result) => !isSearchResultAlreadySaved(result)).length,
    [searchResults, isSearchResultAlreadySaved],
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

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-50 text-surface-900">
        <main>
          <section className="px-5 py-10 md:px-8 md:py-14">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-indigo-200">
                  <i className="fa-solid fa-book-sparkles text-xl"></i>
                </div>
                <span className="text-lg font-black tracking-tight text-surface-900">Etymolingua</span>
              </div>

              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-6">
                  <h1 className="text-4xl font-extrabold leading-tight text-surface-900 md:text-5xl">
                    Etymolingua - 語源で学ぶ英語学習アプリ
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-surface-700">
                    Etymolinguaは、英単語を丸暗記ではなく、語源、接頭辞、語根、接尾辞から理解して覚えるための英語学習アプリです。
                    単語の由来や意味のつながりを読み解くことで、知らない単語にも推測の手がかりを持てる語彙力を育てます。
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowLogin(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-primary-500"
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      今すぐ語源を検索する
                    </button>
                    <a
                      href="#etymology-examples"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-surface-200 bg-white px-6 py-4 text-sm font-bold text-surface-700 transition-colors hover:border-primary-600 hover:text-primary-600"
                    >
                      <i className="fa-solid fa-seedling"></i>
                      語源学習の例を見る
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-xl shadow-slate-200/70">
                  <p className="mb-4 text-sm font-bold text-primary-600">語源でつながる単語例</p>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xl font-extrabold text-surface-900">inspect</p>
                      <p className="mt-2 text-sm leading-6 text-surface-700">
                        in-（中へ）+ spect（見る）。「中をよく見る」から、調査する、点検するという意味につながります。
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xl font-extrabold text-surface-900">perspective</p>
                      <p className="mt-2 text-sm leading-6 text-surface-700">
                        per-（通して）+ spect（見る）。物事を通して見る視点、見方という意味を理解できます。
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xl font-extrabold text-surface-900">predict</p>
                      <p className="mt-2 text-sm leading-6 text-surface-700">
                        pre-（前もって）+ dict（言う）。前もって言うことから、予測するという意味になります。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="etymology-examples" className="border-y border-surface-200 bg-white px-5 py-10 md:px-8">
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              <div>
                <h2 className="text-xl font-extrabold text-surface-900">Etymolinguaとは何か</h2>
                <p className="mt-3 text-sm leading-7 text-surface-700">
                  Etymolinguaは、英単語を構成するパーツに注目します。接頭辞の方向感、語根のコアイメージ、接尾辞の品詞や役割を組み合わせて、単語の意味を体系的に理解します。
                </p>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-surface-900">学習メリット</h2>
                <p className="mt-3 text-sm leading-7 text-surface-700">
                  語源を知ると、関連語をまとめて覚えやすくなります。inspect、respect、perspectiveのように共通語根を持つ単語を関連づけ、記憶に残りやすい単語帳を作れます。
                </p>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-surface-900">対象ユーザー</h2>
                <p className="mt-3 text-sm leading-7 text-surface-700">
                  英単語の丸暗記が苦手な学習者、TOEICや英検に向けて語彙を増やしたい人、技術英語やビジネス英語を語源から整理したい人に向いています。
                </p>
              </div>
            </div>
          </section>
        </main>

        <LoginConfirmModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onPopupConfirm={handlePopupLogin}
          onRedirectConfirm={handleRedirectLogin}
        />
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 overflow-x-hidden">
      {showNotice && (
        <div className="relative z-30 bg-primary-600 px-4 py-4 shadow-lg sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-white">
                <path
                  fill="currentColor"
                  d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9L12 2.5Zm6.5 10.7l1 2.9 2.9 1-2.9 1-1 2.9-1-2.9-2.9-1 2.9-1 1-2.9Z"
                />
              </svg>
            </div>
            <div className="flex-1 pr-8">
              <p className="text-[14px] font-bold leading-tight text-white sm:text-[15px]">
                以前発生していたAI検索機能のエラーを修正しました。ご不便をおかけしました。
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={dismissNotice}
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white">
                <path
                  fill="currentColor"
                  d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.29 6.3-6.29 1.41 1.42Z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
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
        onReportIssue={() => openFeedback({ mode: currentView })}
      />
      <main className="app-main-shell md:pl-56 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
          <section className="app-main-container">
        {currentView === "search" && (
          <div className="view-stack mobile-view-shell">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-surface-900">
                Etymolingua - 語源で覚える英単語
              </h1>
              <p className="text-sm md:text-base text-surface-600">
                語源や単語の背景を理解しながら、英語の語彙力を効率的に伸ばせる英語学習アプリです。
              </p>
            </div>
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
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-surface-500 font-bold">AI速度</span>
              {([
                { key: "fast", label: "Fast", title: "最速・軽量" },
                { key: "standard", label: "Standard", title: "標準" },
              ] as { key: AiSpeedMode; label: string; title: string }[]).map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  title={mode.title}
                  onClick={() => setAiSpeedMode(mode.key)}
                  className={`px-3 py-1.5 rounded-full border font-bold transition-colors ${
                    aiSpeedMode === mode.key
                      ? "bg-secondary-500 text-white border-secondary-500"
                      : "bg-white text-surface-700 border-surface-200 hover:border-secondary-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-500">
              複数検索は「, / 改行 / ;」区切りで入力できます（例: take off, resilience, look up）。「/」を含む語は1語として扱います。
            </p>
            {searchResults.length > 0 && (
              <div className="ui-glass ui-rounded-panel p-4 border border-surface-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    検索結果 {searchResults.length} 件
                  </p>
                  <p className="text-xs text-slate-500">
                    保存後もこの画面は残ります。必要な語を続けて保存できます。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAllSearchResults}
                    className="px-4 py-2 bg-secondary-500 text-white rounded-2xl font-bold hover:bg-secondary-600 transition-colors"
                  >
                    すべて保存
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearchResults}
                    className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
            {isSearching && <SkeletonLoader />}
            {visibleSearchResults.map((result, idx) => {
              const alreadySaved = isSearchResultAlreadySaved(result);
              return (
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
                    disabled={alreadySaved}
                    className={`w-full py-3 rounded-2xl font-bold ui-elevation transition-colors ${
                      alreadySaved
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    {alreadySaved
                      ? "保存済み"
                      : t(language, "app.addWord", { word: result.word })}
                  </button>
                </div>
              );
            })}
            {searchResults.length > visibleSearchResults.length && (
              <button
                type="button"
                onClick={() =>
                  setVisibleSearchResultsCount((prev) =>
                    Math.min(prev + SEARCH_RESULTS_VISIBLE_STEP, searchResults.length),
                  )
                }
                className="w-full bg-white border border-surface-200 text-surface-700 py-3 rounded-2xl font-bold"
              >
                検索結果をさらに表示
              </button>
            )}
            {searchResults.length > 1 && (
              <button
                type="button"
                onClick={handleSaveAllSearchResults}
                disabled={unsavedSearchResultsCount === 0}
                className={`w-full py-4 rounded-2xl font-bold ui-elevation transition-colors ${
                  unsavedSearchResultsCount === 0
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-secondary-500 text-white hover:bg-secondary-600"
                }`}
              >
                {unsavedSearchResultsCount === 0
                  ? "すべて保存済み"
                  : `残り ${unsavedSearchResultsCount} 件を保存`}
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
          <div className="view-stack mobile-view-shell">
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
                onDelete={() => handleMoveWordToTrash(selectedListWord.id)}
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
        {currentView === "analytics" && (
          <div className="mobile-view-shell"><AnalyticsView words={activeWords} /></div>
        )}
        {currentView === "notebook" && (
          <SmartNotebook notes={notes} onDeleteNote={handleDeleteNote} />
        )}
        {currentView === "thesaurus" && (
          <ThesaurusView history={activeWords} onSearch={handleSearchWord} />
        )}
        {currentView === "quiz" && (
          <div className="mobile-view-shell"><QuizView
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
            onReportIssue={(context) => openFeedback({ mode: currentView, ...context })}
          /></div>
        )}
        {currentView === "eikenSpeaking" && (
          <div className="mobile-view-shell"><EikenSpeakingView /></div>
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

      <BottomNav
        currentView={currentView}
        onChangeView={setCurrentView}
        language={language}
      />

      <UsageGuide isOpen={showUsage} onClose={() => setShowUsage(false)} />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExportJSON={() => exportToJSON(words.filter((w) => !w.isTrashed))}
        onImportJSON={handleImportJSON}
        wordCount={activeWords.length}
        user={user}
        showToast={showToast}
        onReportIssue={() => openFeedback({ mode: currentView })}
      />
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        context={feedbackContext}
        onSubmit={submitFeedback}
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
        onPopupConfirm={handlePopupLogin}
        onRedirectConfirm={handleRedirectLogin}
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
