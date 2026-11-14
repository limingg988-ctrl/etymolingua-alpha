/**
 * worker/src/index.ts
 *
 * Cloudflare Workers 版の AI プロキシ。
 *
 * 旧 services/geminiService.ts（ブラウザから VITE_API_KEY で直接 Gemini を
 * 呼び出していた実装）のサーバー移設版。Firebase Functions 版
 * (functions/src/gemini.ts) と同じ振る舞いを、Functions のデプロイに必要な
 * Blaze プラン（クレジットカード）を避けるため Cloudflare Workers の
 * 無料枠へ移植したもの。
 *
 * - API キーは Worker の Secret (GEMINI_API_KEY) からのみ読む。
 *   ブラウザのバンドルには一切含まれない。
 * - 全ルートで Firebase ID トークン (Authorization: Bearer <token>) を
 *   Google の公開鍵 (JWKS) で検証し、未ログイン / 不正トークンは 401。
 * - プロンプト・モデル・スキーマは shared/gemini.ts の
 *   移設前と同一のものを使う。Gemini へは REST fetch で接続する
 *   （@google/genai SDK は使わない）。
 *
 * ルート (すべて POST / JSON):
 *   /lookupWord              旧 fetchWordDetails
 *   /generateAiQuiz          旧 generateAiQuiz
 *   /chatWithTutor           旧 sendChatMessage
 *   /generateNote            旧 generateNoteFromChat
 *   /evaluateEikenSpeaking   英検スピーキング採点（旧 Functions 版の移植）
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  AI_MODEL_BY_SPEED,
  buildChatSystemInstruction,
  buildLookupContents,
  buildLookupSystemInstruction,
  buildNotePrompt,
  buildQuizContents,
  GEMINI_MODEL,
  QUIZ_SYSTEM_INSTRUCTION,
} from "../../shared/gemini";
import type {
  AiSpeedMode,
  ChatWithTutorResponse,
  ExplainMode,
  GeminiChatMessage,
  GeminiLanguage,
  SearchFocus,
} from "../../shared/gemini";
import {
  buildEikenSpeakingUserPrompt,
  EIKEN_SPEAKING_MODEL,
  EIKEN_SPEAKING_SYSTEM_INSTRUCTION,
} from "../../shared/eikenSpeaking";
import type { EikenSpeakingEvaluationRequest } from "../../shared/eikenSpeaking";

export interface Env {
  /** wrangler secret put / ダッシュボードの Secret で設定する。toml には書かない */
  GEMINI_API_KEY: string;
  /** vars（wrangler.toml [vars]） */
  FIREBASE_PROJECT_ID?: string;
}

const DEFAULT_FIREBASE_PROJECT_ID = "etymolingua-61e6d";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const QUOTA_MESSAGE =
  "AIの利用上限（クォータ）に達しました。\nしばらく時間（1〜2分程度）をおいてから再度お試しください。";
const OVERLOADED_MESSAGE =
  "AIサーバーが混雑しています。しばらく待ってから再試行してください。";
const GENERIC_MESSAGE =
  "AIサーバーでエラーが発生しました。時間をおいて再試行してください。";

/* ------------------------------------------------------------------ */
/* エラー型                                                             */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  status: number;
  /** true のとき message をそのままユーザーへ返してよい */
  expose: boolean;
  constructor(status: number, message: string, expose = true) {
    super(message);
    this.status = status;
    this.expose = expose;
  }
}

const badRequest = (message: string) => new HttpError(400, message);

/* ------------------------------------------------------------------ */
/* 認証（Firebase ID トークンを JWKS で検証）                           */
/* ------------------------------------------------------------------ */

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const getJwks = () => {
  if (!cachedJwks) cachedJwks = createRemoteJWKSet(JWKS_URL);
  return cachedJwks;
};

/**
 * Authorization: Bearer <Firebase ID token> を検証し uid (sub) を返す。
 * 欠落・不正の場合は 401 を投げる。Firebase 版 requireAuth と同じ文面。
 */
const requireAuth = async (request: Request, env: Env): Promise<string> => {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError(401, "認証が必要です。ログインしてからお試しください。");
  }
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  try {
    const { payload } = await jwtVerify(match[1].trim(), getJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload.sub ?? "";
  } catch {
    throw new HttpError(401, "認証に失敗しました。再度ログインしてお試しください。");
  }
};

/* ------------------------------------------------------------------ */
/* 入力バリデーション（Firebase 版 functions/src/gemini.ts と同一）     */
/* ------------------------------------------------------------------ */

const requireString = (value: unknown, name: string, maxLength: number): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`「${name}」は必須です。`);
  }
  if (value.length > maxLength) {
    throw badRequest(`「${name}」が長すぎます（最大${maxLength}文字）。`);
  }
  return value;
};

const optionalString = (
  value: unknown,
  name: string,
  maxLength: number,
  fallback = "",
): string => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") {
    throw badRequest(`「${name}」の形式が不正です。`);
  }
  if (value.length > maxLength) {
    throw badRequest(`「${name}」が長すぎます（最大${maxLength}文字）。`);
  }
  return value;
};

const optionalEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  name: string,
): T => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw badRequest(`「${name}」の値が不正です。`);
};

const parseChatHistory = (
  value: unknown,
  name: string,
  maxMessages: number,
): GeminiChatMessage[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw badRequest(`「${name}」の形式が不正です。`);
  }
  if (value.length > maxMessages) {
    throw badRequest(`「${name}」が長すぎます（最大${maxMessages}件）。`);
  }
  return value.map((msg) => {
    if (!msg || typeof msg !== "object") {
      throw badRequest(`「${name}」の形式が不正です。`);
    }
    const role = (msg as { role?: unknown }).role;
    const text = (msg as { text?: unknown }).text;
    if (role !== "user" && role !== "model") {
      throw badRequest(`「${name}」の role が不正です（'user' | 'model' のみ）。`);
    }
    if (typeof text !== "string") {
      throw badRequest(`「${name}」の text が不正です。`);
    }
    if (text.length > 4000) {
      throw badRequest(`「${name}」のメッセージが長すぎます（最大4000文字）。`);
    }
    return { role, text } as GeminiChatMessage;
  });
};

/** 英検採点用（Firebase 版 index.ts の sanitizeString と同じ） */
const sanitizeString = (value: unknown, maxLength: number): string => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

/* ------------------------------------------------------------------ */
/* レスポンススキーマ（Firebase 版の Type スキーマを plain JSON 化）    */
/* ------------------------------------------------------------------ */

const translationItemSchema = {
  type: "OBJECT",
  properties: {
    term: { type: "STRING" },
    translation: { type: "STRING" },
  },
  required: ["term", "translation"],
};

/** fetchWordDetails の responseSchema（移設前と同一） */
const wordDetailsSchema = {
  type: "OBJECT",
  properties: {
    word: { type: "STRING" },
    meaning: { type: "STRING" },
    pronunciation: { type: "STRING" },
    etymology: { type: "STRING" },
    mnemonic: { type: "STRING" },
    logic: { type: "STRING" },
    exampleSentence: { type: "STRING" },
    exampleSentenceTranslation: { type: "STRING" },
    synonyms: { type: "ARRAY", items: translationItemSchema },
    collocations: { type: "ARRAY", items: translationItemSchema },
    derivatives: { type: "ARRAY", items: { type: "STRING" } },
    idioms: { type: "ARRAY", items: translationItemSchema },
    nuance: { type: "STRING" },
    relatedWords: { type: "ARRAY", items: translationItemSchema },
  },
  required: [
    "word",
    "meaning",
    "pronunciation",
    "etymology",
    "mnemonic",
    "logic",
    "exampleSentence",
    "exampleSentenceTranslation",
    "synonyms",
    "collocations",
    "derivatives",
    "idioms",
    "nuance",
    "relatedWords",
  ],
};

/** generateNoteFromChat の responseSchema（移設前と同一） */
const noteSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "ノートのタイトル" },
    content: { type: "STRING", description: "Markdown形式の学習ノート本文" },
    tags: { type: "ARRAY", items: { type: "STRING" }, description: "関連タグ" },
  },
  required: ["title", "content", "tags"],
};

/** 英検スピーキング採点の responseSchema（Functions 版 index.ts からそのまま移植） */
const eikenSpeakingSchema = {
  type: "OBJECT",
  required: ["score", "grades", "feedback", "modelAnswer", "suggestedKeywords"],
  properties: {
    score: {
      type: "INTEGER",
      description: "Overall evaluation score from 1 to 10 (10 being perfect Pre-1 standard).",
    },
    grades: {
      type: "OBJECT",
      required: ["vocabulary", "grammar", "logic", "reflex"],
      properties: {
        vocabulary: { type: "STRING", description: "Grade A, B, C, or D for Vocabulary" },
        grammar: { type: "STRING", description: "Grade A, B, C, or D for Grammar" },
        logic: { type: "STRING", description: "Grade A, B, C, or D for Logic & Argumentation" },
        reflex: { type: "STRING", description: "Grade A, B, C, or D for Reflex & Strategy" },
      },
    },
    feedback: {
      type: "OBJECT",
      required: ["vocabulary", "grammar", "logic", "nextAction"],
      properties: {
        vocabulary: { type: "STRING" },
        grammar: { type: "STRING" },
        logic: { type: "STRING" },
        nextAction: { type: "STRING" },
      },
    },
    modelAnswer: { type: "STRING" },
    suggestedKeywords: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
};

/* ------------------------------------------------------------------ */
/* Gemini REST 呼び出し                                                 */
/* ------------------------------------------------------------------ */

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface CallGeminiOptions {
  model: string;
  systemInstruction?: string;
  contents: GeminiContent[];
  responseMimeType?: string;
  responseSchema?: unknown;
  /** 上流エラー時の汎用メッセージ（エンドポイントごとに文面が異なるため） */
  genericMessage?: string;
}

/**
 * Gemini generateContent (REST) を呼び出し、生成テキストを返す。
 * キーは x-goog-api-key ヘッダーで送る（URL に載せない）。
 * 上流のレスポンスボディ・キー・スタックは呼び出し側へ漏らさない。
 */
const callGemini = async (env: Env, options: CallGeminiOptions): Promise<string> => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, GENERIC_MESSAGE, false);
  }

  const body: Record<string, unknown> = { contents: options.contents };
  if (options.systemInstruction) {
    body.system_instruction = { parts: [{ text: options.systemInstruction }] };
  }
  const generationConfig: Record<string, unknown> = {};
  if (options.responseMimeType) generationConfig.responseMimeType = options.responseMimeType;
  if (options.responseSchema) generationConfig.responseSchema = options.responseSchema;
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${options.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      },
    );
  } catch {
    // ネットワーク失敗等: 内部情報は出さず汎用エラーにする
    throw new HttpError(500, options.genericMessage ?? GENERIC_MESSAGE, false);
  }

  if (response.status === 429) {
    throw new HttpError(429, QUOTA_MESSAGE);
  }
  if (response.status === 503) {
    throw new HttpError(503, OVERLOADED_MESSAGE);
  }
  if (!response.ok) {
    console.error(`Gemini upstream error: HTTP ${response.status}`);
    throw new HttpError(500, options.genericMessage ?? GENERIC_MESSAGE, false);
  }

  const data = (await response.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part?.text ?? "").join("");
};

/** Firebase 版 parseGeminiJson と同じ（```json フェンス剥がし＋パース） */
const parseGeminiJson = (text: string, emptyMessage: string, parseMessage: string): unknown => {
  if (!text) {
    throw new HttpError(502, emptyMessage);
  }
  const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch {
    throw new HttpError(502, parseMessage);
  }
};

const userContent = (text: string): GeminiContent[] => [
  { role: "user", parts: [{ text }] },
];

/* ------------------------------------------------------------------ */
/* ハンドラ                                                             */
/* ------------------------------------------------------------------ */

type HandlerLogic = (body: Record<string, unknown>, env: Env) => Promise<unknown>;

/** 旧 fetchWordDetails（単語解説） */
const lookupWord: HandlerLogic = async (body, env) => {
  const word = requireString(body?.word, "word", 100);
  const explainMode = optionalEnum<ExplainMode>(
    body?.explainMode,
    ["en-ja", "en-en", "multilingual"],
    "en-ja",
    "explainMode",
  );
  const focus = optionalEnum<SearchFocus>(
    body?.focus,
    ["all", "idioms", "etymology", "core"],
    "all",
    "focus",
  );
  const aiSpeedMode = optionalEnum<AiSpeedMode>(
    body?.aiSpeedMode,
    ["fast", "standard"],
    "fast",
    "aiSpeedMode",
  );

  const text = await callGemini(env, {
    model: AI_MODEL_BY_SPEED[aiSpeedMode],
    systemInstruction: buildLookupSystemInstruction(explainMode, focus),
    contents: userContent(buildLookupContents(word)),
    responseMimeType: "application/json",
    responseSchema: wordDetailsSchema,
  });

  return parseGeminiJson(text, "AIからの応答が空でした。", "AIの応答を解析できませんでした。");
};

/** 旧 generateAiQuiz（AIクイズ用単語リスト生成）。frontend 用フィールド付与はクライアント側で行う */
const generateAiQuiz: HandlerLogic = async (body, env) => {
  const level = requireString(body?.level, "level", 50);
  const count = body?.count;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 20) {
    throw badRequest("「count」は1〜20の整数で指定してください。");
  }

  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
    contents: userContent(buildQuizContents(level, count)),
    responseMimeType: "application/json",
  });

  const data = parseGeminiJson(text, "AIからの応答が空でした。", "クイズデータの解析に失敗しました。");
  if (!Array.isArray(data)) {
    throw new HttpError(502, "クイズデータの解析に失敗しました。");
  }
  return data;
};

/** 旧 sendChatMessage（AIチューター会話） */
const chatWithTutor: HandlerLogic = async (body, env) => {
  const history = parseChatHistory(body?.history, "history", 30);
  const newMessage = requireString(body?.newMessage, "newMessage", 4000);
  const vocabularyContext = optionalString(body?.vocabularyContext, "vocabularyContext", 20000, "");
  const responseLanguage = optionalEnum<GeminiLanguage>(
    body?.responseLanguage,
    ["ja", "en", "zh-CN", "ko"],
    "ja",
    "responseLanguage",
  );

  // SDK の chats.create(history) + sendMessage(newMessage) と等価な contents を組む
  const contents: GeminiContent[] = [
    ...history.map((msg) => ({ role: msg.role, parts: [{ text: msg.text }] })),
    { role: "user" as const, parts: [{ text: newMessage }] },
  ];

  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    systemInstruction: buildChatSystemInstruction(vocabularyContext, responseLanguage),
    contents,
  });

  return { text: text || "Failed to generate response." } satisfies ChatWithTutorResponse;
};

/** 旧 generateNoteFromChat（会話から学習ノート生成） */
const generateNote: HandlerLogic = async (body, env) => {
  const chatHistory = parseChatHistory(body?.chatHistory, "chatHistory", 50);
  const responseLanguage = optionalEnum<GeminiLanguage>(
    body?.responseLanguage,
    ["ja", "en", "zh-CN", "ko"],
    "ja",
    "responseLanguage",
  );

  // 移設前と同じく、先頭メッセージ（AIからの初期挨拶）を除いて要約する
  const relevantHistory = chatHistory.slice(1);
  if (relevantHistory.length === 0) {
    throw badRequest("要約する会話データがありません。");
  }
  const conversationText = relevantHistory.map((msg) => `${msg.role}: ${msg.text}`).join("\n");

  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    contents: userContent(buildNotePrompt(conversationText, responseLanguage)),
    responseMimeType: "application/json",
    responseSchema: noteSchema,
  });

  return parseGeminiJson(
    text,
    "要約の生成に失敗しました。",
    "ノートの作成に失敗しました。もう一度お試しください。",
  );
};

/** 英検スピーキング採点（Functions 版 evaluateEikenSpeaking の移植） */
const evaluateEikenSpeaking: HandlerLogic = async (body, env) => {
  const payload: EikenSpeakingEvaluationRequest = {
    mode: body?.mode === "narration" ? "narration" : "qa",
    text: sanitizeString(body?.text, 12000),
    context: sanitizeString(body?.context, 8000),
    userProfile:
      body?.userProfile && typeof body.userProfile === "object" && !Array.isArray(body.userProfile)
        ? (body.userProfile as Record<string, unknown>)
        : {},
  };

  if (!payload.text) {
    throw new HttpError(400, "No response text was provided to analyze.");
  }
  if (!payload.context) {
    throw new HttpError(400, "No prompt context was provided.");
  }

  const text = await callGemini(env, {
    model: EIKEN_SPEAKING_MODEL,
    systemInstruction: EIKEN_SPEAKING_SYSTEM_INSTRUCTION,
    contents: userContent(buildEikenSpeakingUserPrompt(payload)),
    responseMimeType: "application/json",
    responseSchema: eikenSpeakingSchema,
    genericMessage: "Failed to evaluate the response. Please try again.",
  });

  const jsonText = text ? text.trim() : "{}";
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new HttpError(500, "Failed to evaluate the response. Please try again.", false);
  }
};

const ROUTES: Record<string, HandlerLogic> = {
  "/lookupWord": lookupWord,
  "/generateAiQuiz": generateAiQuiz,
  "/chatWithTutor": chatWithTutor,
  "/generateNote": generateNote,
  "/evaluateEikenSpeaking": evaluateEikenSpeaking,
};

/* ------------------------------------------------------------------ */
/* ルーター                                                             */
/* ------------------------------------------------------------------ */

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

const respondError = (error: unknown, logLabel: string): Response => {
  if (error instanceof HttpError) {
    console.error(`${logLabel} failed: HTTP ${error.status}`);
    if (error.status === 429) {
      return jsonResponse({ error: QUOTA_MESSAGE }, 429);
    }
    if (error.status === 503) {
      return jsonResponse({ error: OVERLOADED_MESSAGE }, 503);
    }
    return jsonResponse({ error: error.expose ? error.message : GENERIC_MESSAGE }, error.status);
  }
  console.error(`${logLabel} failed:`, error);
  return jsonResponse({ error: GENERIC_MESSAGE }, 500);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS プリフライトは認証なしで応答する（Firebase 版と同じ）
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);
    const logic = ROUTES[pathname];
    if (!logic) {
      return jsonResponse({ error: "Not found." }, 404);
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    try {
      await requireAuth(request, env);
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const result = await logic(body ?? {}, env);
      return jsonResponse(result);
    } catch (error) {
      return respondError(error, pathname);
    }
  },
};
