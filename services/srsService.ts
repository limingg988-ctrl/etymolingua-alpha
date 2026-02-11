import { WordEntry, WordStatus } from '../types';

// Constants for SM-2 Algorithm
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

/**
 * Calculates the next review parameters based on the SuperMemo-2 algorithm.
 * Adjusted for 3-button system (Unknown, Learning, Mastered).
 */
export const calculateSRS = (word: WordEntry, rating: WordStatus): Partial<WordEntry> => {
  // Initialize defaults if missing
  const currentInterval = word.interval ?? 0;
  const currentEaseFactor = word.easeFactor ?? INITIAL_EASE_FACTOR;
  const currentStreak = word.streak ?? 0;

  let newInterval: number;
  let newEaseFactor = currentEaseFactor;
  let newStreak = currentStreak;

  // Map 3 buttons to approximate quality grades (0-5 scale in SM-2)
  // Mastered -> Grade 5 (Perfect)
  // Learning -> Grade 3 (Hard/Pass with difficulty)
  // Unknown  -> Grade 0 (Fail)
  
  if (rating === 'mastered') {
    // Correct response
    if (newStreak === 0) {
      newInterval = 1;
    } else if (newStreak === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
    newStreak++;
    
    // Grade 5: EF' = EF + (0.1 - (5-5)*(0.08+(5-5)*0.02)) = EF + 0.1
    // Simplification: Boost EF slightly for easy answer
    newEaseFactor = currentEaseFactor + 0.1;

  } else if (rating === 'learning') {
    // "Hard" / "Learning" response (Grade 3)
    // In strict SM-2, Grade 3 resets interval to 1 or 0? 
    // Standard Anki behavior for "Hard": Interval * 1.2 or constant.
    // Here we treat it as "needs review soon but not total fail".
    
    newInterval = 1; // Reset to 1 day to solidify
    newStreak = 0;   // Reset streak
    
    // Grade 3: EF drops slightly
    // EF' = EF + (0.1 - (5-3)*(0.08+(5-3)*0.02)) = EF - 0.14
    newEaseFactor = currentEaseFactor - 0.15;

  } else {
    // "Unknown" / Fail (Grade 0)
    newInterval = 0; // Review immediately (today/tomorrow)
    newStreak = 0;
    
    // Grade 0: EF drops significantly
    // EF' = EF + (0.1 - (5-0)*(0.08+(5-0)*0.02)) = EF - 0.8
    newEaseFactor = currentEaseFactor - 0.2; 
  }

  // Cap Ease Factor
  if (newEaseFactor < MIN_EASE_FACTOR) newEaseFactor = MIN_EASE_FACTOR;

  // Calculate Next Date
  // If interval is 0, set next review to "Now" or just keep it for today.
  // We add 'newInterval' days to current time.
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  // If Mastered, we push it to future. If Unknown, keep it basically now (or +1 min logic handling in UI).
  // For simplicity: date = Now + Interval * Days
  // If interval is 0 (unknown), it stays "due".
  const nextReviewDate = Date.now() + (newInterval * ONE_DAY_MS);

  return {
    nextReviewDate,
    interval: newInterval,
    easeFactor: newEaseFactor,
    streak: newStreak,
    status: rating // Ensure status is synced
  };
};

/**
 * Helper to check if a word is due for review
 */
export const isDueForReview = (word: WordEntry): boolean => {
  // If never reviewed (no nextReviewDate), it's due (unless mastered without SRS?)
  // Let's assume initialized words have nextReviewDate.
  if (!word.nextReviewDate) return true;
  return word.nextReviewDate <= Date.now();
};

/**
 * Helper to get initial SRS state
 */
export const getInitialSRSState = (): Partial<WordEntry> => ({
  nextReviewDate: Date.now(),
  interval: 0,
  easeFactor: INITIAL_EASE_FACTOR,
  streak: 0
});