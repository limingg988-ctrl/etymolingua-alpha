import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  writeBatch, 
  query, 
  where 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDm1Vxi_N-FL--8OcbMplogaW27W9XpHpE",
  authDomain: "etymolingua-beta-ac64b.firebaseapp.com",
  projectId: "etymolingua-beta-ac64b",
  storageBucket: "etymolingua-beta-ac64b.firebasestorage.app",
  messagingSenderId: "747374309813",
  appId: "1:747374309813:web:c6407abf014850be53e9fc",
  measurementId: "G-L07GNWTG6X"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

export const dbService = {
  getUserId() {
    return auth.currentUser ? auth.currentUser.uid : 'guest';
  },
  async loadAll() {
    try {
      const userId = this.getUserId();
      const wordsQuery = query(collection(db, "words"), where("userId", "==", userId));
      const booksQuery = query(collection(db, "books"), where("userId", "==", userId));
      const notesQuery = query(collection(db, "notes"), where("userId", "==", userId));
      const [wordsSnap, booksSnap, notesSnap] = await Promise.all([
        getDocs(wordsQuery), getDocs(booksQuery), getDocs(notesQuery)
      ]);
      return { 
        words: wordsSnap.docs.map(d => d.data() as any), 
        books: booksSnap.docs.map(d => d.data() as any), 
        notes: notesSnap.docs.map(d => d.data() as any) 
      };
    } catch (error) {
      console.error("Firestore error:", error);
      return { words: [], books: [], notes: [] };
    }
  },
  async addWord(word: any) {
    const dataToSave = { ...word, userId: this.getUserId() };
    await setDoc(doc(db, "words", word.id), dataToSave);
  },
  async updateWord(id: string, updates: any) {
    await updateDoc(doc(db, "words", id), { ...updates, updatedAt: Date.now() });
  },
  async deleteWord(id: string) {
    await updateDoc(doc(db, "words", id), { isTrashed: true, updatedAt: Date.now() });
  },
  async restoreWord(id: string) {
    await updateDoc(doc(db, "words", id), { isTrashed: false, updatedAt: Date.now() });
  },
  async permanentDeleteWord(id: string) {
    await deleteDoc(doc(db, "words", id));
  },
  async saveWordsBatch(words: any[]) {
    const userId = this.getUserId();
    const batchSize = 500;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = words.slice(i, i + batchSize);
      chunk.forEach(word => {
        const ref = doc(db, "words", word.id);
        batch.set(ref, { ...word, userId });
      });
      await batch.commit();
    }
  },
  async addBook(book: any) {
    await setDoc(doc(db, "books", book.id), { ...book, userId: this.getUserId() });
  },
  async updateBook(id: string, updates: any) {
    await updateDoc(doc(db, "books", id), updates);
  },
  async deleteBook(id: string) {
    await deleteDoc(doc(db, "books", id));
  },
  async addNote(note: any) {
    await setDoc(doc(db, "notes", note.id), { ...note, userId: this.getUserId() });
  },
  async permanentDeleteNote(id: string) {
    await deleteDoc(doc(db, "notes", id));
  }
};
