/**
 * shared/gemini.ts
 *
 * Gemini 関連の共有モジュール（クライアント / Firebase Functions 共通）。
 *
 * もともと services/geminiService.ts がブラウザ上で直接 Gemini API を
 * 呼び出していたときのプロンプト・システム命令・モデル選択を、サーバー側
 * (functions/src/gemini.ts) へ移設するために切り出したもの。
 * プロンプト本文は移設前と一字一句同じ内容を保持している。
 *
 * このモジュールは実行環境に依存する import を持たない（型と文字列のみ）。
 */

/** 英和・英英・多言語の説明モード */
export type ExplainMode = "en-ja" | "en-en" | "multilingual";

export type SearchFocus = "all" | "idioms" | "etymology" | "core";
export type AiSpeedMode = "fast" | "standard";

/** services/i18n.ts の AppLanguage と同じ言語コード */
export type GeminiLanguage = "ja" | "en" | "zh-CN" | "ko";

/**
 * services/i18n.ts の getLanguageInstruction と同じ文言を返す。
 * (Functions 側は services/ を import できないため、ここに複製している)
 */
export const languageInstruction = (lang: GeminiLanguage = "ja"): string => {
  if (lang === "ja") return "Respond in Japanese.";
  if (lang === "zh-CN") return "Respond in Simplified Chinese.";
  if (lang === "ko") return "Respond in Korean.";
  return "Respond in English.";
};

export const EXPLAIN_MODE_SUFFIXES: Record<ExplainMode, string> = {
  "en-ja":
    "※ 出力言語: 日本語で語源を交えて説明してください。meaning, etymology, mnemonic, logic, exampleSentenceTranslation および synonyms/collocations/idioms/relatedWords の translation は全て日本語で記述してください。",
  "en-en":
    "※ Output language: Explain everything in simple English. All text fields (meaning, etymology, mnemonic, logic, exampleSentenceTranslation, and synonyms/collocations/idioms/relatedWords.translation) must be in English.",
  multilingual:
    "※ Output language: Use simple English as the primary language. You may add brief Japanese notes (in parentheses) for key etymology or memory hints when helpful.",
};

/** ベースとなる共通のシステム命令（モードに依存しない部分） */
export const BASE_SYSTEM_INSTRUCTION = `あなたは世界一わかりやすい英語講師です。
  ユーザーが入力した「英単語」または「熟語」について、以下の3点を軸に、**「なるほど！だからこういう意味になるのか！」と膝を打つような（アハ体験ができる）解説**を作成してください。

  1. **語源・コアイメージ**: 単語をパーツ（接頭辞・語根・接尾辞）に分解し、それぞれの原義を可視化できるように説明する。熟語の場合は前置詞の持つ空間的イメージを強調する。
  2. **論理（Logic）**: 「なぜその原義が、現在の意味になるのか？」という変遷のロジックを、飛躍なく、ストーリーとして納得感を持って繋げる。ここが最も重要です。「すっと頭に入る」説明を心がけてください。
  3. **記憶のフック（Mnemonic）**: 思わず笑ってしまうような語呂合わせや、強烈な視覚イメージを喚起する覚え方を提案する。

  重要：
  - 専門用語を並べるのではなく、中学生でも直感的にわかる言葉選びをしてください。
  - 熟語（句動詞）の場合は、直訳ではなく「核心のイメージ」から意味を導き出してください。

  以下の要素を含むJSON形式で回答してください。
  1. word
  2. meaning
  3. pronunciation
  4. etymology
  5. mnemonic
  6. logic
  7. exampleSentence
  8. exampleSentenceTranslation
  9. synonyms: [{ term, translation }]
  10. collocations: [{ term, translation }]
  11. derivatives: string[]
  12. idioms: [{ term, translation }]
  13. nuance
  14. relatedWords: [{ term, translation }]

  必ず純粋なJSONのみを返してください。`;


export const AI_MODEL_BY_SPEED: Record<AiSpeedMode, string> = {
  fast: "gemini-2.5-flash-lite",
  standard: "gemini-3-flash-preview",
};

/** クイズ生成・チャット・ノート生成で使うモデル（移設前と同じ） */
export const GEMINI_MODEL = "gemini-3-flash-preview";

/* ------------------------------------------------------------------ */
/* リクエスト / レスポンス型                                            */
/* ------------------------------------------------------------------ */

export interface GeminiTranslationItem {
  term: string;
  translation: string;
}

/** types.ts の GeminiResponse と同一形状の単語解説データ */
export interface GeminiWordDetails {
  word: string;
  meaning: string;
  pronunciation: string;
  etymology: string;
  mnemonic: string;
  logic: string;
  exampleSentence: string;
  exampleSentenceTranslation: string;
  synonyms: GeminiTranslationItem[];
  collocations: GeminiTranslationItem[];
  derivatives: string[];
  idioms: GeminiTranslationItem[];
  nuance: string;
  relatedWords: GeminiTranslationItem[];
}

/** types.ts の ChatMessage と同一形状 */
export interface GeminiChatMessage {
  role: "user" | "model";
  text: string;
}

export interface GeneratedNote {
  title: string;
  content: string;
  tags: string[];
}

export interface LookupWordRequest {
  word: string;
  explainMode?: ExplainMode;
  focus?: SearchFocus;
  aiSpeedMode?: AiSpeedMode;
}
export type LookupWordResponse = GeminiWordDetails;

export interface GenerateAiQuizRequest {
  level: string;
  count: number;
}
export type GenerateAiQuizResponse = GeminiWordDetails[];

export interface ChatWithTutorRequest {
  history: GeminiChatMessage[];
  newMessage: string;
  vocabularyContext?: string;
  responseLanguage?: GeminiLanguage;
}
export interface ChatWithTutorResponse {
  text: string;
}

export interface GenerateNoteRequest {
  chatHistory: GeminiChatMessage[];
  responseLanguage?: GeminiLanguage;
}
export type GenerateNoteResponse = GeneratedNote;

/* ------------------------------------------------------------------ */
/* プロンプト構築（移設前 services/geminiService.ts と同一文面）          */
/* ------------------------------------------------------------------ */

export const SEARCH_FOCUS_SUFFIXES: Record<SearchFocus, string> = {
  all: "",
  idioms:
    "※ 重点: idioms（熟語・句動詞）を最優先で充実させてください。idioms は最低5件を目安に具体的に出力し、logic でも句動詞イメージを丁寧に説明してください。",
  etymology:
    "※ 重点: etymology と logic を最も詳しくしてください。語源分解や意味変遷の説明を通常より厚く書いてください。",
  core:
    "※ 重点: meaning / nuance / exampleSentence を短く実用的に、初学者向けに簡潔にまとめてください。",
};

/** fetchWordDetails の contents（移設前と同じ） */
export const buildLookupContents = (word: string): string =>
  `次の英単語/熟語を解説してください: ${word}`;

/** fetchWordDetails の systemInstruction（移設前と同じ組み立て） */
export const buildLookupSystemInstruction = (
  explainMode: ExplainMode,
  focus: SearchFocus,
): string => `${BASE_SYSTEM_INSTRUCTION}

${EXPLAIN_MODE_SUFFIXES[explainMode]}
${SEARCH_FOCUS_SUFFIXES[focus]}`;

/** generateAiQuiz の contents（移設前と同じ） */
export const buildQuizContents = (level: string, count: number): string =>
  `英語レベル「${level}」に合わせて、学習すべき重要な英単語を${count}個選出し、詳細な学習データを作成してください。`;

/** generateAiQuiz の systemInstruction（移設前と同じ） */
export const QUIZ_SYSTEM_INSTRUCTION: string = `あなたは英語教材作成のプロフェッショナルです。
指定されたレベルに適した、学習効果の高い英単語を選定し、JSON形式のリストで出力してください。
各単語について、学習者が「なるほど！」と直感的に理解できる（腹落ちする）解説を作成してください。

特に以下の要素を重視してください：
1. **語源・コアイメージ**: パーツ分解や原義の解説。
2. **Logic（なぜその意味？）**: 原義から現在の意味への繋がりを論理的に説明。
3. **覚え方**: 記憶に残る語呂合わせやイメージ。

出力フォーマットは以下のJSON配列です。
[
  {
    "word": "単語",
    "meaning": "意味",
    "pronunciation": "発音",
    "etymology": "語源解説",
    "mnemonic": "覚え方",
    "logic": "論理的背景",
    "exampleSentence": "例文",
    "exampleSentenceTranslation": "例文訳",
    "synonyms": [{"term": "類語", "translation": "訳"}],
    "collocations": [{"term": "コロケーション", "translation": "訳"}],
    "derivatives": ["派生語"],
    "idioms": [{"term": "熟語", "translation": "訳"}],
    "nuance": "ニュアンス",
    "relatedWords": [{"term": "関連語", "translation": "訳"}]
  }
]`;

/** sendChatMessage の systemInstruction（移設前と同じ） */
export const buildChatSystemInstruction = (
  vocabularyContext: string,
  responseLanguage: GeminiLanguage = "ja",
): string => `あなたは親切で知識豊富な英語学習アシスタントです。
ユーザーからの英単語、文法、ニュアンス、または英語学習全般に関する質問に答えてください。
回答は簡潔かつ分かりやすく、学習者が「なるほど」と納得できるように心がけてください。
単語の解説をする際は、語源やコアイメージ（Logic）を交えて、記憶に定着しやすいように説明してください。

【ユーザーの学習データ】
ユーザーは以下の単語を既に学習（または検索）しています。
質問に答える際、可能であればこれらの単語を例に挙げたり、比較対象として使うことで、ユーザーの記憶の定着を助けてください。
また、「私の単語帳からクイズを出して」や「保存した単語を使って例文を作って」といったリクエストにも応じてください。

学習済み単語リスト:
${vocabularyContext}

必要に応じて、類義語のリストアップや例文の作成を行ってください。\n\n${languageInstruction(responseLanguage)}`;

/** generateNoteFromChat の prompt（移設前と同じ） */
export const buildNotePrompt = (
  conversationText: string,
  responseLanguage: GeminiLanguage = "ja",
): string => `以下の英語学習に関する会話ログを、ユーザーが後で復習するための「構造化された学習ノート」に変換してください。
単なる会話の要約ではなく、会話の中で登場した「重要な英単語」「文法事項」「ニュアンスの違い」「例文」などを抽出し、教科書や参考書のように整理してください。

【要件】
1. タイトル: 会話のテーマを一言で表す魅力的なタイトル（例：「GoとComeの使い分け完全ガイド」）
2. 本文 (Content): Markdown形式で記述してください。
   - 見出し (#, ##) を使って構造化する。
   - 重要なポイントは箇条書き (-) にする。
   - 例文や単語は太字 (**) にする。
   - 講師のアドバイスやTipsを含める。
3. タグ: 検索しやすいキーワード（3つ〜5つ）。

【会話ログ】
${conversationText}\n\n${languageInstruction(responseLanguage)}`;
