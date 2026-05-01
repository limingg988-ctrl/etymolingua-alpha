import React, { useState } from "react";
import { dbService } from "../services/firebase";

interface TroubleReportFormProps {
  user?: { uid?: string } | null;
  showToast: (message: string, type?: "info" | "success" | "warning" | "error") => void;
}

export const TroubleReportForm: React.FC<TroubleReportFormProps> = ({ user, showToast }) => {
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim() || !context.trim()) {
      showToast("必須項目を入力してください", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await dbService.submitFeedback({
        category: "trouble_report",
        content,
        context,
        email: email.trim() || "",
        userId: user?.uid || "anonymous",
        timestamp: Date.now(),
      });

      showToast("送信しました", "success");
      setContent("");
      setContext("");
      setEmail("");
    } catch (error: any) {
      showToast(error?.message || "送信に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor="trouble-content" className="mb-1 block text-sm font-semibold text-slate-700">
          エラー内容
        </label>
        <textarea
          id="trouble-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="発生したエラー内容を入力してください"
        />
      </div>

      <div>
        <label htmlFor="trouble-context" className="mb-1 block text-sm font-semibold text-slate-700">
          操作内容
        </label>
        <textarea
          id="trouble-context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="エラー発生時に行った操作を入力してください"
        />
      </div>

      <div>
        <label htmlFor="trouble-email" className="mb-1 block text-sm font-semibold text-slate-700">
          メールアドレス（任意）
        </label>
        <input
          id="trouble-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="your-email@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "送信中..." : "送信"}
      </button>
    </form>
  );
};
