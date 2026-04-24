import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs,
  getDocsFromCache,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNzWg03LkWuUCawaYbSUssshH0S06zGDQ",
  authDomain: "etymolingua-61e6d.firebaseapp.com",
  projectId: "etymolingua-61e6d",
  storageBucket: "etymolingua-61e6d.firebasestorage.app",
  messagingSenderId: "483566326389",
  appId: "1:483566326389:web:7d8afbe3dc981bf24d1e3c",
  measurementId: "G-2NKN7JKTBY",
};

const app = initializeApp(firebaseConfig);
const supportsPersistentFirestoreCache =
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
const cacheHydrationKey = (userId: string) => `firestore-cache-hydrated:${userId}`;

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: supportsPersistentFirestoreCache
    ? persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      })
    : memoryLocalCache(),
});

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGooglePopup = () => signInWithPopup(auth, provider);
export const loginWithGoogleRedirect = () => signInWithRedirect(auth, provider);
export const consumeRedirectResult = () => getRedirectResult(auth);
export const logout = () => signOut(auth);

const waitForAuthReady = async (): Promise<User | null> => {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const requireUserId = async () => {
  const user = await waitForAuthReady();
  if (!user?.uid) {
    throw new Error("auth-required");
  }
  return user.uid;
};

export const dbService = {
  async getUserId() {
    const user = await waitForAuthReady();
    return user?.uid || "guest";
  },
  async loadBooks(source: "cache" | "server" = "server") {
    const userId = await this.getUserId();
    const booksQuery = query(collection(db, "books"), where("userId", "==", userId));
    const read = source === "cache" ? getDocsFromCache : getDocs;
    const booksSnap = await read(booksQuery);
    return booksSnap.docs.map((d) => d.data() as any);
  },
  async loadNotes(source: "cache" | "server" = "server") {
    const userId = await this.getUserId();
    const notesQuery = query(collection(db, "notes"), where("userId", "==", userId));
    const read = source === "cache" ? getDocsFromCache : getDocs;
    const notesSnap = await read(notesQuery);
    return notesSnap.docs.map((d) => d.data() as any);
  },
  async loadWordsPage(
    bookId: string,
    cursor: any | null = null,
    pageSize = 30,
    source: "cache" | "server" = "server",
  ) {
    const userId = await this.getUserId();
    const wordsRef = collection(db, "words");
    const baseConstraints: any[] = [
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(pageSize),
    ];
    if (bookId !== "all") {
      baseConstraints.unshift(where("bookId", "==", bookId));
    }
    if (cursor) {
      baseConstraints.push(startAfter(cursor));
    }
    const wordsQuery = query(wordsRef, ...baseConstraints);
    const read = source === "cache" ? getDocsFromCache : getDocs;
    const wordsSnap = await read(wordsQuery);
    const docs = wordsSnap.docs;
    if (source === "server" && typeof window !== "undefined") {
      window.localStorage.setItem(cacheHydrationKey(userId), "true");
    }

    return {
      words: docs.map((d) => d.data() as any),
      nextCursor: docs.length > 0 ? docs[docs.length - 1] : null,
      hasMore: docs.length === pageSize,
    };
  },
  async countWords(bookId: string = "all") {
    const userId = await this.getUserId();
    const wordsRef = collection(db, "words");
    const constraints: any[] = [where("userId", "==", userId)];
    if (bookId !== "all") {
      constraints.push(where("bookId", "==", bookId));
    }
    const q = query(wordsRef, ...constraints);
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },
  async loadAllFromCache() {
    const userId = await this.getUserId();
    const hasHydratedCache =
      typeof window !== "undefined" &&
      window.localStorage.getItem(cacheHydrationKey(userId)) === "true";
    if (!hasHydratedCache) {
      return null;
    }

    try {
      const [books, notes] = await Promise.all([
        this.loadBooks("cache"),
        this.loadNotes("cache"),
      ]);
      return { books, notes };
    } catch (error) {
      console.warn("Firestore cache read failed:", error);
      return null;
    }
  },
  async loadAll() {
    try {
      const [books, notes] = await Promise.all([
        this.loadBooks("server"),
        this.loadNotes("server"),
      ]);
      return { books, notes };
    } catch (error) {
      console.error("Firestore server read error:", error);
      throw error;
    }
  },
  async addWord(word: any) {
    const userId = await requireUserId();
    const dataToSave = { ...word, userId: word.userId || userId };
    await setDoc(doc(db, "words", word.id), dataToSave);
  },
  async updateWord(id: string, updates: any) {
    await requireUserId();
    await updateDoc(doc(db, "words", id), { ...updates, updatedAt: Date.now() });
  },
  async deleteWord(id: string) {
    await requireUserId();
    await updateDoc(doc(db, "words", id), { isTrashed: true, updatedAt: Date.now() });
  },
  async restoreWord(id: string) {
    await requireUserId();
    await updateDoc(doc(db, "words", id), { isTrashed: false, updatedAt: Date.now() });
  },
  async permanentDeleteWord(id: string) {
    await requireUserId();
    await deleteDoc(doc(db, "words", id));
  },
  async saveWordsBatch(words: any[]) {
    const userId = await requireUserId();
    const batchSize = 500;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = words.slice(i, i + batchSize);
      chunk.forEach((word) => {
        const ref = doc(db, "words", word.id);
        batch.set(ref, { ...word, userId: word.userId || userId });
      });
      await batch.commit();
    }
  },
  async addBook(book: any) {
    const userId = await requireUserId();
    await setDoc(doc(db, "books", book.id), { ...book, userId: book.userId || userId });
  },
  async updateBook(id: string, updates: any) {
    await requireUserId();
    await updateDoc(doc(db, "books", id), updates);
  },
  async deleteBook(id: string) {
    await requireUserId();
    await deleteDoc(doc(db, "books", id));
  },
  async addNote(note: any) {
    const userId = await requireUserId();
    await setDoc(doc(db, "notes", note.id), { ...note, userId: note.userId || userId });
  },
  async permanentDeleteNote(id: string) {
    await requireUserId();
    await deleteDoc(doc(db, "notes", id));
  },
};
