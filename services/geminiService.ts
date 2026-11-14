/**
 * services/geminiService.ts
 *
 * Gemini 連携のクライアント側サービス。
 *
 * 【セキュリティ修正】以前はブラウザ埋め込みの API キーを使って直接
 * Gemini API を呼び出していたが、API キーが JS バンドルに露出してしまうため、
 * 呼び出しを Firebase Functions（lookupWord / generateAiQuiz /
 * chatWithTutor / generateNote）経由に変更した。キーはサーバー側の
 * Secret Manager にのみ存在する。
 *
 * 代償として、AI 機能はログイン必須になる（Functions 側で Firebase
 * ID トークンを検証するため）。未ログイン時は functionsClient が
 * ログインを促すエラーを投げる。
 *
 * 関数名・引数・戻り値・キャッシュ挙動・日本語エラーメッセージは
 * 移設前と互換に保っている。
 */
import { GeminiResponse, ChatMessage, WordEntry } from "../types";
import type { AppLanguage } from "./i18n";
import { postToFunction } from "./functionsClient";
import type {
  ChatWithTutorResponse,
  GenerateNoteResponse,
  LookupWordRequest,
} from "../shared/gemini";
import type { ExplainMode, SearchFocus, AiSpeedMode } from "../shared/gemini";

export type { ExplainMode, SearchFocus, AiSpeedMode };

const handleApiError = (error: any) => {
  // 未ログイン（Functions の認証必須化に伴う専用エラー）はそのまま表示する
  if ((error as any)?.code === "login-required") {
    throw error;
  }
  console.error("Gemini API Error:", error);
  
  // Extract error details
  const msg = (error?.message || error?.toString() || "").toLowerCase();
  const status = error?.status || error?.code;
  const errorBody = error?.error || {}; // In case of raw JSON error response

  // Check for Quota/Rate Limit errors (429)
  if (
    msg.includes("429") || 
    msg.includes("resource_exhausted") || 
    msg.includes("quota") ||
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    errorBody.code === 429 ||
    errorBody.status === "RESOURCE_EXHAUSTED"
  ) {
    throw new Error("【利用制限】AIの利用上限（クォータ）に達しました。\nしばらく時間（1〜2分程度）をおいてから再度お試しください。");
  }

  // Check for Auth errors
  if (msg.includes("api key") || status === 403 || status === 401) {
     throw new Error("APIキーが無効か、アクセス権限がありません。");
  }

  // Check for Network errors
  if (error instanceof TypeError || msg.includes("fetch failed") || msg.includes("network") || msg.includes("failed to fetch")) {
      throw new Error("ネットワーク接続エラーが発生しました。インターネット接続を確認してください。");
  }
  
  // Check for Overloaded model
  if (msg.includes("overloaded") || status === 503) {
      throw new Error("AIサーバーが混雑しています。しばらく待ってから再試行してください。");
  }

  throw new Error(`AIエラー: ${error.message || "不明なエラーが発生しました"}`);
};

const AI_CACHE_VERSION = "v1";
const AI_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;



const aiCacheKey = (word: string, explainMode: ExplainMode, focus: SearchFocus, aiSpeedMode: AiSpeedMode) =>
  `ai-word-cache:${AI_CACHE_VERSION}:${aiSpeedMode}:${explainMode}:${focus}:${word.trim().toLowerCase()}`;

const readCachedWordDetails = (key: string): GeminiResponse | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.timestamp || Date.now() - cached.timestamp > AI_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return cached.data as GeminiResponse;
  } catch {
    return null;
  }
};

const writeCachedWordDetails = (key: string, data: GeminiResponse) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Cache is an optimization; storage failures should not break lookup.
  }
};

export const fetchWordDetails = async (
  word: string,
  options?: { explainMode?: ExplainMode; focus?: SearchFocus; aiSpeedMode?: AiSpeedMode },
): Promise<GeminiResponse> => {
  const explainMode = options?.explainMode ?? "en-ja";
  const focus = options?.focus ?? "all";
  const aiSpeedMode = options?.aiSpeedMode ?? "fast";
  const cacheKey = aiCacheKey(word, explainMode, focus, aiSpeedMode);
  const cached = readCachedWordDetails(cacheKey);
  if (cached) return cached;

  try {
    const payload: LookupWordRequest = { word, explainMode, focus, aiSpeedMode };
    const parsed = await postToFunction<GeminiResponse>("lookupWord", payload);
    writeCachedWordDetails(cacheKey, parsed);
    return parsed;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const generateAiQuiz = async (level: string, count: number): Promise<WordEntry[]> => {
  try {
    const data = await postToFunction<GeminiResponse[]>("generateAiQuiz", { level, count });
    // Add required frontend fields
    return data.map((item) => ({
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
      bookId: 'ai-generated',
      timestamp: Date.now(),
      status: 'unknown' as const,
      isTrashed: false
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  vocabularyContext: string = "",
  responseLanguage: AppLanguage = "ja",
): Promise<string> => {
  try {
    const result = await postToFunction<ChatWithTutorResponse>("chatWithTutor", {
      history,
      newMessage,
      vocabularyContext,
      responseLanguage,
    });
    return result.text;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const generateNoteFromChat = async (
  chatHistory: ChatMessage[],
  responseLanguage: AppLanguage = "ja",
): Promise<{ title: string; content: string; tags: string[] }> => {
  const relevantHistory = chatHistory.slice(1);
  if (relevantHistory.length === 0) {
      throw new Error("要約する会話データがありません。");
  }

  try {
    return await postToFunction<GenerateNoteResponse>("generateNote", {
      chatHistory,
      responseLanguage,
    });
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
