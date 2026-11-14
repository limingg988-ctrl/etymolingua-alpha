/**
* functions/src/gemini.ts
*
* 旧 services/geminiService.ts（ブラウザから VITE_API_KEY で直接 Gemini を
* 呼び出していた実装）をサーバー側へ移した Firebase Functions ハンドラ群。
*
* - API キーは Secret Manager (GEMINI_API_KEY) からのみ読む。
* evaluateEikenSpeaking (index.ts) と同じパターン。
* - 全ハンドラで Firebase ID トークン (Authorization: Bearer <token>) を
* 検証し、未ログイン / 不正トークンは 401 を返す。
* - プロンプト・モデル・スキーマは shared/gemini.ts に移設した
* 移設前と同一のものを使う。
*/
import { GoogleGenAI, Type} from "@google/genai";
import { getAuth} from "firebase-admin/auth";
import { onRequest} from "firebase-functions/v2/https";
import { defineSecret} from "firebase-functions/params";
import {
AI_MODEL_BY_SPEED,
buildChatSystemInstruction,
buildLookupContents,
buildLookupSystemInstruction,
buildNotePrompt,
buildQuizContents,
GEMINI_MODEL,
QUIZ_SYSTEM_INSTRUCTION,
} from "../../shared/gemini.js";
import type {
AiSpeedMode,
ChatWithTutorResponse,
ExplainMode,
GeminiChatMessage,
GeminiLanguage,
SearchFocus,
} from "../../shared/gemini.js";

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

const setCorsHeaders = (res: any) => {
res.set("Access-Control-Allow-Origin", "*");
res.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
res.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
};

const createGenAI = () => {
const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
if (!apiKey) {
throw Object.assign(new Error("Gemini API key is not configured."), { status: 500});
}
return new GoogleGenAI({ apiKey});
};

/* ------------------------------------------------------------------ */
/* 認証 */
/* ------------------------------------------------------------------ */

/**
* Authorization: Bearer <Firebase ID token> を検証し uid を返す。
* 欠落・不正の場合は status 401 / expose: true のエラーを投げる。
* index.ts の evaluateEikenSpeaking からも使う。
*/
export const requireAuth = async (req: any): Promise<string> => {
const header =
typeof req.headers?.authorization === "string"? req.headers.authorization: "";
const match = header.match(/^Bearer\s+(.+)$/i);
if (!match) {
throw Object.assign(
new Error("認証が必要です。ログインしてからお試しください。"),
{ status: 401, expose: true},
);
}
try {
const decoded = await getAuth().verifyIdToken(match[1].trim());
return decoded.uid;
} catch {
throw Object.assign(
new Error("認証に失敗しました。再度ログインしてお試しください。"),
{ status: 401, expose: true},
);
}
};

/* ------------------------------------------------------------------ */
/* 入力バリデーション */
/* ------------------------------------------------------------------ */

const badRequest = (message: string) =>
Object.assign(new Error(message), { status: 400, expose: true});

const requireString = (value: unknown, name: string, maxLength: number): string => {
if (typeof value!== "string" || value.trim().length === 0) {
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
if (typeof value!== "string") {
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
if (!msg || typeof msg!== "object") {
throw badRequest(`「${name}」の形式が不正です。`);
}
const role = (msg as { role?: unknown}).role;
const text = (msg as { text?: unknown}).text;
if (role!== "user" && role!== "model") {
throw badRequest(`「${name}」の role が不正です（'user' | 'model' のみ）。`);
}
if (typeof text!== "string") {
throw badRequest(`「${name}」の text が不正です。`);
}
if (text.length > 4000) {
throw badRequest(`「${name}」のメッセージが長すぎます（最大4000文字）。`);
}
return { role, text} as GeminiChatMessage;
});
};

/* ------------------------------------------------------------------ */
/* レスポンススキーマ（移設前 services/geminiService.ts と同一） */
/* ------------------------------------------------------------------ */

const translationItemSchema = {
type: Type.OBJECT,
properties: {
term: { type: Type.STRING},
translation: { type: Type.STRING},
},
required: ["term", "translation"],
};

/** fetchWordDetails の responseSchema（移設前と同一） */
const wordDetailsSchema = {
type: Type.OBJECT,
properties: {
word: { type: Type.STRING},
meaning: { type: Type.STRING},
pronunciation: { type: Type.STRING},
etymology: { type: Type.STRING},
mnemonic: { type: Type.STRING},
logic: { type: Type.STRING},
exampleSentence: { type: Type.STRING},
exampleSentenceTranslation: { type: Type.STRING},
synonyms: {
type: Type.ARRAY,
items: translationItemSchema,
},
collocations: {
type: Type.ARRAY,
items: translationItemSchema,
},
derivatives: { type: Type.ARRAY, items: { type: Type.STRING}},
idioms: {
type: Type.ARRAY,
items: translationItemSchema,
},
nuance: { type: Type.STRING},
relatedWords: {
type: Type.ARRAY,
items: translationItemSchema,
},
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
type: Type.OBJECT,
properties: {
title: { type: Type.STRING, description: "ノートのタイトル"},
content: { type: Type.STRING, description: "Markdown形式の学習ノート本文"},
tags: { type: Type.ARRAY, items: { type: Type.STRING}, description: "関連タグ"},
},
required: ["title", "content", "tags"],
};

/* ------------------------------------------------------------------ */
/* 共通処理 */
/* ------------------------------------------------------------------ */

const parseGeminiJson = (
text: string | undefined,
emptyMessage: string,
parseMessage: string,
): any => {
if (!text) {
throw Object.assign(new Error(emptyMessage), { status: 502, expose: true});
}
const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
try {
return JSON.parse(cleanText);
} catch {
throw Object.assign(new Error(parseMessage), { status: 502, expose: true});
}
};

const respondError = (res: any, error: any, logLabel: string) => {
const status = typeof error?.status === "number"? error.status: 500;
console.error(`${logLabel} failed:`, error);
if (status === 429) {
res.status(429).json({
error:
"AIの利用上限（クォータ）に達しました。\nしばらく時間（1〜2分程度）をおいてから再度お試しください。",
});
return;
}
if (error?.expose) {
// 自前で投げた、ユーザーに見せてよいメッセージ（検証・認証・解析エラー）
res.status(status).json({ error: error.message});
return;
}
if (status === 503) {
res.status(503).json({
error: "AIサーバーが混雑しています。しばらく待ってから再試行してください。",
});
return;
}
// Gemini 側エラー等は内部情報を漏らさず汎用メッセージにする
res.status(status >= 400 && status < 600? status: 500).json({
error: "AIサーバーでエラーが発生しました。時間をおいて再試行してください。",
});
};

type HandlerLogic = (body: any) => Promise<any>;

const makeHandler = (logLabel: string, logic: HandlerLogic) =>
onRequest(
{
region: "asia-northeast1",
secrets: [geminiApiKey],
timeoutSeconds: 120,
memory: "512MiB",
},
async (req, res) => {
setCorsHeaders(res);
if (req.method === "OPTIONS") {
res.status(204).send("");
return;
}
if (req.method!== "POST") {
res.status(405).json({ error: "Method not allowed."});
return;
}
try {
await requireAuth(req);
const result = await logic(req.body?? {});
res.json(result);
} catch (error: any) {
respondError(res, error, logLabel);
}
},
);

/* ------------------------------------------------------------------ */
/* ハンドラ */
/* ------------------------------------------------------------------ */

/** 旧 fetchWordDetails（単語解説） */
export const lookupWord = makeHandler("lookupWord", async (body) => {
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

const ai = createGenAI();
const response = await ai.models.generateContent({
model: AI_MODEL_BY_SPEED[aiSpeedMode],
contents: buildLookupContents(word),
config: {
systemInstruction: buildLookupSystemInstruction(explainMode, focus),
responseMimeType: "application/json",
responseSchema: wordDetailsSchema,
},
});

return parseGeminiJson(
response.text,
"AIからの応答が空でした。",
"AIの応答を解析できませんでした。",
);
});

/** 旧 generateAiQuiz（AIクイズ用単語リスト生成）。frontend 用フィールド付与はクライアント側で行う */
export const generateAiQuiz = makeHandler("generateAiQuiz", async (body) => {
const level = requireString(body?.level, "level", 50);
const count = body?.count;
if (typeof count!== "number" ||!Number.isInteger(count) || count < 1 || count > 20) {
throw badRequest("「count」は1〜20の整数で指定してください。");
}

const ai = createGenAI();
const response = await ai.models.generateContent({
model: GEMINI_MODEL,
contents: buildQuizContents(level, count),
config: {
systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
responseMimeType: "application/json",
},
});

const data = parseGeminiJson(
response.text,
"AIからの応答が空でした。",
"クイズデータの解析に失敗しました。",
);
if (!Array.isArray(data)) {
throw Object.assign(new Error("クイズデータの解析に失敗しました。"), {
status: 502,
expose: true,
});
}
return data;
});

/** 旧 sendChatMessage（AIチューター会話） */
export const chatWithTutor = makeHandler("chatWithTutor", async (body) => {
const history = parseChatHistory(body?.history, "history", 30);
const newMessage = requireString(body?.newMessage, "newMessage", 4000);
const vocabularyContext = optionalString(
body?.vocabularyContext,
"vocabularyContext",
20000,
"",
);
const responseLanguage = optionalEnum<GeminiLanguage>(
body?.responseLanguage,
["ja", "en", "zh-CN", "ko"],
"ja",
"responseLanguage",
);

const ai = createGenAI();
const chat = ai.chats.create({
model: GEMINI_MODEL,
config: {
systemInstruction: buildChatSystemInstruction(vocabularyContext, responseLanguage),
},
history: history.map((msg) => ({
role: msg.role,
parts: [{ text: msg.text}],
})),
});

const result = await chat.sendMessage({ message: newMessage});
const text = result.text || "Failed to generate response.";
return { text} satisfies ChatWithTutorResponse;
});

/** 旧 generateNoteFromChat（会話から学習ノート生成） */
export const generateNote = makeHandler("generateNote", async (body) => {
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
const conversationText = relevantHistory
.map((msg) => `${msg.role}: ${msg.text}`)
.join("\n");

const ai = createGenAI();
const response = await ai.models.generateContent({
model: GEMINI_MODEL,
contents: buildNotePrompt(conversationText, responseLanguage),
config: {
responseMimeType: "application/json",
responseSchema: noteSchema,
},
});

return parseGeminiJson(
response.text,
"要約の生成に失敗しました。",
"ノートの作成に失敗しました。もう一度お試しください。",
);
});
