import React, { useMemo, useState } from "react";

export type FeedbackCategory = "translation" | "typo" | "ui" | "crash" | "request";

export interface FeedbackContext {
  wordId?: string;
  questionId?: string;
  mode?: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { category: FeedbackCategory; message: string; consent: boolean }) => Promise<string>;
  context?: FeedbackContext;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  translation: "誤訳",
  typo: "タイポ",
  ui: "UI",
  crash: "クラッシュ",
  request: "要望",
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, context }) => {
  const [category, setCategory] = useState<FeedbackCategory>("translation");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmNoPii, setConfirmNoPii] = useState(false);
  const [confirmHasSteps, setConfirmHasSteps] = useState(false);

  const contextText = useMemo(
    () =>
      [context?.wordId ? `wordId: ${context.wordId}` : null, context?.questionId ? `questionId: ${context.questionId}` : null, context?.mode ? `mode: ${context.mode}` : null]
        .filter(Boolean)
        .join(" / "),
    [context],
  );

  if (!isOpen) return null;

  const validateBeforeSend = () => {
    setError("");
    if (!message.trim()) return setError("詳細を入力してください。");
    if (message.length > 1000) return setError("本文は1000文字以内で入力してください。");
    if (!consent) return setError("同意チェックが必要です。");
    if (honeypot) return setError("送信に失敗しました。");
    const urlCount = (message.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) return setError("URLは3件までにしてください。");
    return true;
  };

  const handleOpenConfirm = () => {
    if (!validateBeforeSend()) return;
    setIsConfirmOpen(true);
  };

  const handleSend = async () => {
    if (!confirmNoPii || !confirmHasSteps) return setError("送信前チェックを完了してください。");

    setIsSubmitting(true);
    try {
      const ticket = await onSubmit({ category, message: message.trim(), consent });
      setReceipt(ticket);
    } catch (e: any) {
      setError(e?.message || "送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const helperQuestions: Record<FeedbackCategory, string[]> = {
    translation: ["該当単語はどれですか？", "正しい意味候補を教えてください。"],
    typo: ["誤字の箇所をそのまま貼り付けてください。", "正しい表記案があれば記入してください。"],
    ui: ["端末情報（機種/OS/ブラウザ）を教えてください。", "画面サイズと崩れた箇所を教えてください。"],
    crash: ["クラッシュ直前に行った操作を教えてください。", "再現回数と再起動後の再発有無を教えてください。"],
    request: ["どの機能があると嬉しいかを具体的に教えてください。", "利用シーン（いつ/何のため）を教えてください。"],
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">問題を報告</h3>
        {receipt ? (
          <div className="space-y-3 text-sm">
            <p className="text-emerald-700 font-bold">送信しました。受付番号: {receipt}</p>
            <p className="text-slate-600">受付番号を保存してください。</p>
            <p className="text-slate-600">追加情報が必要な場合のみ連絡します。（support@etymolingua.app）</p>
            <button onClick={onClose} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold">閉じる</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
              不具合の早期修正のため、発生手順や期待した動作をご記入ください。
            </p>
            <p className="text-xs text-slate-500">個人情報は本文に記載しないでください。未成年の方は保護者に確認してください。</p>
            {contextText && <p className="text-xs text-indigo-600 bg-indigo-50 rounded p-2">{contextText}</p>}
            <select value={category} onChange={(e) => setCategory(e.target.value as FeedbackCategory)} className="w-full border rounded-lg p-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <p className="text-xs font-bold text-indigo-800 mb-1">補助質問（{CATEGORY_LABELS[category]}）</p>
              <ul className="text-xs text-indigo-700 list-disc ml-4 space-y-1">
                {helperQuestions[category].map((q) => <li key={q}>{q}</li>)}
              </ul>
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full border rounded-lg p-2" placeholder="いつ、どの画面で、何をしたら、どうなったか（期待結果と実際結果）" />
            <input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              送信データが品質改善目的で利用されることに同意します。
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onClose} className="py-2 border rounded-lg">キャンセル</button>
              <button onClick={handleOpenConfirm} disabled={isSubmitting} className="py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:bg-slate-300">{isSubmitting ? "送信中..." : "送信"}</button>
            </div>
          </>
        )}
      </div>
      {isConfirmOpen && !receipt && (
        <div className="absolute inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h4 className="font-bold text-slate-800">送信前の確認</h4>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={confirmNoPii} onChange={(e) => setConfirmNoPii(e.target.checked)} />
              個人情報（氏名・住所・電話番号・メール等）を含めていない
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={confirmHasSteps} onChange={(e) => setConfirmHasSteps(e.target.checked)} />
              再現手順（発生手順）を書いた
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsConfirmOpen(false)} className="py-2 border rounded-lg">戻る</button>
              <button onClick={handleSend} disabled={isSubmitting || !confirmNoPii || !confirmHasSteps} className="py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:bg-slate-300">この内容で送信</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
