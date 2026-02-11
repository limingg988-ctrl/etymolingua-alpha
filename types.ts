
export type WordStatus = 'unknown' | 'learning' | 'mastered';

export interface TranslationItem {
  term: string;
  translation: string;
}

export interface BookMetadata {
  id: string;
  userId?: string; // Added for user ownership
  title: string;
  description?: string;
  createdAt: number;
  color?: string;
}

export interface WordEntry {
  id: string;
  userId?: string; // Added for user ownership
  bookId?: string;
  word: string;
  meaning: string;
  pronunciation: string;
  etymology: string;
  mnemonic: string;
  logic: string;
  exampleSentence: string;
  exampleSentenceTranslation: string;
  synonyms: TranslationItem[];
  collocations: TranslationItem[];
  derivatives: string[];
  idioms: TranslationItem[];
  nuance: string;
  relatedWords: TranslationItem[];
  timestamp: number;
  updatedAt?: number; // Added for logical delete tracking
  status: WordStatus;
  isTrashed?: boolean;
  
  // SRS (Spaced Repetition System) fields
  nextReviewDate?: number; // Unix Timestamp for next review
  interval?: number;       // Current interval in days
  easeFactor?: number;     // SM-2 Ease Factor (default 2.5)
  streak?: number;         // Consecutive correct answers
}

export interface GeminiResponse {
  word: string;
  meaning: string;
  pronunciation: string;
  etymology: string;
  mnemonic: string;
  logic: string;
  exampleSentence: string;
  exampleSentenceTranslation: string;
  synonyms: TranslationItem[];
  collocations: TranslationItem[];
  derivatives: string[];
  idioms: TranslationItem[];
  nuance: string;
  relatedWords: TranslationItem[];
}

export interface NoteEntry {
  id: string;
  userId?: string; // Added for user ownership
  title: string;
  content: string;
  tags: string[];
  timestamp: number;
  updatedAt?: number;
  isTrashed?: boolean; // Added for logical delete
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
