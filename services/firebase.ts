import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

export const loginWithGoogle = () => signInWithPopup(auth, provider);
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
  async loadUserCollections(source: "cache" | "server") {
    const userId = await this.getUserId();
    const wordsQuery = query(collection(db, "words"), where("userId", "==", userId));
    const booksQuery = query(collection(db, "books"), where("userId", "==", userId));
    const notesQuery = query(collection(db, "notes"), where("userId", "==", userId));

    const read = source === "cache" ? getDocsFromCache : getDocs;
    const [wordsSnap, booksSnap, notesSnap] = await Promise.all([
      read(wordsQuery),
      read(booksQuery),
      read(notesQuery),
    ]);

    if (source === "server" && typeof window !== "undefined") {
      window.localStorage.setItem(cacheHydrationKey(userId), "true");
    }

    return {
      words: wordsSnap.docs.map((d) => d.data() as any),
      books: booksSnap.docs.map((d) => d.data() as any),
      notes: notesSnap.docs.map((d) => d.data() as any),
    };
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
      return await this.loadUserCollections("cache");
    } catch (error) {
      console.warn("Firestore cache read failed:", error);
      return null;
    }
  },
  async loadAll() {
    try {
      return await this.loadUserCollections("server");
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
