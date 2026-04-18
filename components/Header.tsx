import React from "react";
import { AppLanguage, getLanguageLabel, t } from "../services/i18n";

type ViewMode =
  | "search"
  | "list"
  | "analytics"
  | "chat"
  | "notebook"
  | "thesaurus"
  | "quiz"
  | "trash";

interface HeaderProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  onOpenUsage: () => void;
  onOpenSettings: () => void;
  onOpenBooks: () => void;
  currentBookName: string;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onRepairBooks?: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

const NAV_ITEMS: { key: ViewMode; labelKey: string; icon: string }[] = [
  { key: "search", labelKey: "header.dictionary", icon: "fa-solid fa-magnifying-glass" },
  { key: "list", labelKey: "header.list", icon: "fa-solid fa-list-ul" },
  { key: "analytics", labelKey: "header.analytics", icon: "fa-solid fa-chart-simple" },
  { key: "quiz", labelKey: "header.quiz", icon: "fa-solid fa-layer-group" },
  { key: "chat", labelKey: "header.chat", icon: "fa-solid fa-comments" },
  { key: "notebook", labelKey: "header.notebook", icon: "fa-solid fa-book-bookmark" },
  { key: "trash", labelKey: "header.trash", icon: "fa-solid fa-trash-can" },
];

const SideNav: React.FC<Pick<HeaderProps, "currentView" | "onChangeView" | "language">> = ({
  currentView,
  onChangeView,
  language,
}) => (
  <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-56 bg-white/90 backdrop-blur-md border-r border-slate-200 p-3 z-40">
    <p className="font-bold text-xs text-slate-500 px-3 py-2 tracking-wide uppercase">Workspace</p>
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChangeView(item.key)}
          className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors ${
            currentView === item.key
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          <i className={item.icon}></i>
          <span>{t(language, item.labelKey)}</span>
        </button>
      ))}
    </nav>
  </aside>
);

const TopBar: React.FC<HeaderProps> = ({
  onChangeView,
  onOpenBooks,
  currentBookName,
  user,
  onLogin,
  onLogout,
  onRepairBooks,
  onOpenUsage,
  onOpenSettings,
  language,
  onLanguageChange,
}) => (
  <div className="h-16 px-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
      <button
        onClick={() => onChangeView("search")}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
      >
        <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200 hidden sm:block">
          <i className="fa-solid fa-book-sparkles text-white text-xl"></i>
        </div>
        <span className="font-black text-slate-800 text-lg hidden sm:block tracking-tight">Etymolingua-alpha</span>
        <span className="font-black text-indigo-600 text-xl sm:hidden">
          <i className="fa-solid fa-book-sparkles"></i>
        </span>
      </button>

      <button
        onClick={onOpenBooks}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-xl transition-all group max-w-[220px]"
        title={t(language, "header.switchBook")}
      >
        <i className="fa-solid fa-book text-slate-400 group-hover:text-indigo-500"></i>
        <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-sm truncate">{currentBookName}</span>
        <i className="fa-solid fa-chevron-down text-xs text-slate-400 group-hover:text-indigo-400"></i>
      </button>
    </div>

    <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
      <div className="flex items-center gap-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
        <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
        <input
          type="text"
          placeholder="検索（UIプレースホルダ）"
          className="w-full bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400"
        />
      </div>
      <button type="button" className="w-9 h-9 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" title="履歴（未接続）">
        <i className="fa-solid fa-clock-rotate-left"></i>
      </button>
    </div>

    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={onOpenBooks}
        className="sm:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100"
        title={t(language, "header.switchBook")}
      >
        <i className="fa-solid fa-book"></i>
      </button>

      {user ? (
        <div className="flex items-center gap-2 bg-slate-50 pl-1 pr-3 py-1 rounded-full border border-slate-100">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <button
            onClick={onLogout}
            className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
            title={t(language, "header.logout")}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <i className="fa-regular fa-user"></i> {t(language, "header.login")}
        </button>
      )}

      <label className="hidden lg:flex items-center gap-1 text-xs text-slate-500 font-bold">
        <i className="fa-solid fa-language"></i>
        <span>{t(language, "header.language")}</span>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
          className="ml-1 border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
          title={t(language, "header.language")}
        >
          {(["ja", "en", "zh-CN", "ko"] as AppLanguage[]).map((lang) => (
            <option key={lang} value={lang}>
              {getLanguageLabel(lang)}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={onRepairBooks}
        className="hidden sm:flex w-8 h-8 items-center justify-center text-slate-400 hover:text-amber-600 transition-colors rounded-full hover:bg-slate-100"
        title="欠損単語帳を修復する"
      >
        <i className="fa-solid fa-wrench"></i>
      </button>
      <button
        onClick={onOpenUsage}
        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100"
        title="使い方"
      >
        <i className="fa-regular fa-circle-question"></i>
      </button>
      <button
        onClick={onOpenSettings}
        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100"
        title="設定"
      >
        <i className="fa-solid fa-gear"></i>
      </button>
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = (props) => {
  const { currentView, onChangeView, language } = props;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      <TopBar {...props} />
      <SideNav currentView={currentView} onChangeView={onChangeView} language={language} />

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 pb-safe overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.filter((item) => item.key !== "notebook").map((item) => (
          <button
            key={item.key}
            onClick={() => onChangeView(item.key)}
            className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${
              currentView === item.key
                ? item.key === "trash"
                  ? "text-red-500 bg-red-50"
                  : "text-indigo-600 bg-indigo-50"
                : "text-slate-400"
            }`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-[10px] font-bold">{t(language, item.labelKey)}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
