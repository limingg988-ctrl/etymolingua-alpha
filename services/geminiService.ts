import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, ChatMessage, NoteEntry, WordEntry } from "../types";

const getAI = () => {
  // Use process.env.API_KEY exclusively as per guidelines
  // Do not use localStorage or UI input for API key.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is not configured in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

const handleApiError = (error: any) => {
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
  if (msg.includes("fetch failed") || msg.includes("network")) {
      throw new Error("ネットワーク接続エラーが発生しました。インターネット接続を確認してください。");
  }
  
  // Check for Overloaded model
  if (msg.includes("overloaded") || status === 503) {
      throw new Error("AIサーバーが混雑しています。しばらく待ってから再試行してください。");
  }

  throw new Error(`AIエラー: ${error.message || "不明なエラーが発生しました"}`);
};

export const fetchWordDetails = async (word: string): Promise<GeminiResponse> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英単語または熟語「${word}」について、語源や構成、覚え方、すっとなぜその意味なのか頭に入る説明を考え、詳細に解説してください。`,
      config: {
        systemInstruction: `あなたは世界一わかりやすい英語講師です。
  ユーザーが入力した「英単語」または「熟語」について、以下の3点を軸に、**「なるほど！だからこういう意味になるのか！」と膝を打つような（アハ体験ができる）解説**を作成してください。
  
  1. **語源・コアイメージ**: 単語をパーツ（接頭辞・語根・接尾辞）に分解し、それぞれの原義を可視化できるように説明する。熟語の場合は前置詞の持つ空間的イメージを強調する。
  2. **論理（Logic）**: 「なぜその原義が、現在の意味になるのか？」という変遷のロジックを、飛躍なく、ストーリーとして納得感を持って繋げる。ここが最も重要です。「すっと頭に入る」説明を心がけてください。
  3. **記憶のフック（Mnemonic）**: 思わず笑ってしまうような語呂合わせや、強烈な視覚イメージを喚起する覚え方を提案する。

  重要：
  - 専門用語を並べるのではなく、中学生でも直感的にわかる言葉選びをしてください。
  - 熟語（句動詞）の場合は、直訳ではなく「核心のイメージ」から意味を導き出してください。

  以下の要素を含むJSON形式で回答してください。

  1. word: 単語または熟語自体
  2. meaning: 核となる意味（日本語）
  3. pronunciation: カタカナでの読み方とIPA（例：レジリエンス [rɪˈzɪliəns]）
  4. etymology: 語源（熟語の場合は構成単語のイメージや由来）。
  5. mnemonic: 覚え方（語呂合わせ、イメージ、またはストーリー）。
  6. logic: なぜその意味になるのかという論理的・歴史的背景（前置詞のコアイメージを用いた解説を含む）。
  7. exampleSentence: 自然な英語の例文
  8. exampleSentenceTranslation: 例文の日本語訳
  9. synonyms: 類義語のリスト（3つ程度）。{ term: "単語", translation: "簡潔な日本語訳" }
  10. collocations: よく一緒に使われる単語や表現。{ term: "表現", translation: "簡潔な日本語訳" }
  11. derivatives: 派生語や品詞変化形（文字列のリスト）
  12. idioms: その単語を使った重要な熟語・慣用句（入力自体が熟語の場合は関連する他の表現）。{ term: "熟語", translation: "簡潔な日本語訳" }
  13. nuance: 似た単語との違いや、使われる文脈の補足
  14. relatedWords: 同じ語源を持つ他の単語のリスト。{ term: "単語", translation: "簡潔な日本語訳" }

  ※解説においては、学術的に確立された語源説に基づき、俗説や民間語源（Folk Etymology）と区別してください。もし語源が不明確な場合は「諸説ある」と伝えてください。
  必ず純粋なJSONのみを返してください。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            etymology: { type: Type.STRING },
            mnemonic: { type: Type.STRING },
            logic: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            exampleSentenceTranslation: { type: Type.STRING },
            synonyms: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["term", "translation"]
              } 
            },
            collocations: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["term", "translation"]
              } 
            },
            derivatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            idioms: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["term", "translation"]
              } 
            },
            nuance: { type: Type.STRING },
            relatedWords: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["term", "translation"]
              } 
            }
          },
          required: [
            "word", "meaning", "pronunciation", "etymology", "mnemonic", 
            "logic", "exampleSentence", "exampleSentenceTranslation", "synonyms", "collocations", "derivatives",
            "idioms", "nuance", "relatedWords"
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("AIからの応答が空でした。");
    }

    try {
      // Clean up markdown code blocks just in case
      const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON parse error:", text);
      throw new Error("データの解析に失敗しました。");
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const generateAiQuiz = async (level: string, count: number): Promise<WordEntry[]> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英語レベル「${level}」に合わせて、学習すべき重要な英単語を${count}個選出し、詳細な学習データを作成してください。`,
      config: {
        systemInstruction: `あなたは英語教材作成のプロフェッショナルです。
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
]`,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("AIからの応答が空でした。");

    try {
      const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const data = JSON.parse(cleanText);
      // Add required frontend fields
      return data.map((item: any) => ({
        ...item,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
        bookId: 'ai-generated',
        timestamp: Date.now(),
        status: 'unknown',
        isTrashed: false
      }));
    } catch (e) {
      console.error("JSON parse error:", text);
      throw new Error("クイズデータの解析に失敗しました。");
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string,
  vocabularyContext: string = ""
): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `あなたは親切で知識豊富な英語学習アシスタントです。
ユーザーからの英単語、文法、ニュアンス、または英語学習全般に関する質問に答えてください。
回答は簡潔かつ分かりやすく、学習者が「なるほど」と納得できるように心がけてください。
単語の解説をする際は、語源やコアイメージ（Logic）を交えて、記憶に定着しやすいように説明してください。

【ユーザーの学習データ】
ユーザーは以下の単語を既に学習（または検索）しています。
質問に答える際、可能であればこれらの単語を例に挙げたり、比較対象として使うことで、ユーザーの記憶の定着を助けてください。
また、「私の単語帳からクイズを出して」や「保存した単語を使って例文を作って」といったリクエストにも応じてください。

学習済み単語リスト:
${vocabularyContext}

必要に応じて、類義語のリストアップや例文の作成を行ってください。`;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "申し訳ありません、応答を生成できませんでした。";
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const generateNoteFromChat = async (chatHistory: ChatMessage[]): Promise<{ title: string; content: string; tags: string[] }> => {
  const ai = getAI();
  
  const relevantHistory = chatHistory.slice(1);
  if (relevantHistory.length === 0) {
      throw new Error("要約する会話データがありません。");
  }
  const conversationText = relevantHistory.map(msg => `${msg.role}: ${msg.text}`).join("\n");

  const prompt = `以下の英語学習に関する会話ログを、ユーザーが後で復習するための「構造化された学習ノート」に変換してください。
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
${conversationText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "ノートのタイトル" },
            content: { type: Type.STRING, description: "Markdown形式の学習ノート本文" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "関連タグ" }
          },
          required: ["title", "content", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("要約の生成に失敗しました。");
    
    try {
      const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Note generation error:", text);
      throw new Error("ノートの作成に失敗しました。もう一度お試しください。");
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};