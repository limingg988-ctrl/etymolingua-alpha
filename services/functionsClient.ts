import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

/**
 * services/functionsClient.ts
 *
 * AI プロキシ（Cloudflare Worker / Firebase Functions）を呼び出すための
 * 共通クライアント。プロキシ側の実装はどちらでも、ルート名と
 * リクエスト / レスポンス形式は共通。
 *
 * AI 系エンドポイントは Firebase ID トークンによる認証が必須のため、
 * 全リクエストに Authorization: Bearer <ID token> を付与する。
 * 未ログインの場合は、ログインを促す日本語エラーを投げる。
 */

// ※ このリポジトリには vite-env.d.ts が無く import.meta.env の型が無いため、
//   型を絞って安全に読む（実行時は Vite が env を提供する）。
const viteEnv = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env;

// 接続先の優先順位:
//   1. VITE_AI_PROXY_ORIGIN（Cloudflare Worker 化後の正式な指定）
//   2. VITE_FIREBASE_FUNCTIONS_ORIGIN（Firebase Functions 版の旧指定）
//   3. デフォルト値（プレースホルダ）
// ※ デフォルト値は仮の URL。実際にデプロイした Worker の workers.dev URL に
//   必ず差し替えること（または環境変数 VITE_AI_PROXY_ORIGIN で指定すること）。
export const FUNCTIONS_ORIGIN =
  viteEnv?.VITE_AI_PROXY_ORIGIN ||
  viteEnv?.VITE_FIREBASE_FUNCTIONS_ORIGIN ||
  "https://etymolingua-ai-proxy.workers.dev";

export const LOGIN_REQUIRED_CODE = "login-required";

const createLoginRequiredError = () => {
  const error = new Error(
    "ログインが必要です。AI機能を利用するには、ログインしてから再度お試しください。",
  ) as Error & { code?: string };
  error.code = LOGIN_REQUIRED_CODE;
  return error;
};

// services/firebase.ts の waitForAuthReady と同じ待ち方
const waitForAuthReady = async (): Promise<User | null> => {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/** 現在のユーザーの Firebase ID トークンを返す。未ログインなら LOGIN_REQUIRED_CODE 付きエラーを投げる */
export const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser ?? (await waitForAuthReady());
  if (!user) {
    throw createLoginRequiredError();
  }
  return user.getIdToken();
};

export type FunctionCallError = Error & { status?: number };

/**
 * Functions のエンドポイントへ JSON POST する。
 * - 成功時: パース済み JSON を返す
 * - HTTP エラー時: サーバーの { error } メッセージと .status を持つ Error を投げる
 * - ネットワーク失敗時: fetch の TypeError がそのまま伝播する
 *   （呼び出し側の handleApiError がネットワーク用メッセージへ変換する）
 */
export const postToFunction = async <T>(name: string, payload: unknown): Promise<T> => {
  const token = await getIdToken();

  const response = await fetch(`${FUNCTIONS_ORIGIN}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(
      errorData?.error || `サーバーエラーが発生しました。(HTTP ${response.status})`,
    ) as FunctionCallError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
};
