import React from "react";

type ViewMode =
  | "search"
  | "list"
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
  user: any; // 追加: ユーザー情報
  onLogin: () => void; // 追加: ログインボタン用
  onLogout: () => void; // 追加: ログアウトボタン用
  onRepairBooks?: () => void; // 単語帳修復ボタン
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  onOpenUsage,
  onOpenSettings,
  onOpenBooks,
  currentBookName,
  user,
  onLogin,
  onLogout,
  onRepairBooks,
}) => {
  const getButtonClass = (view: ViewMode) =>
    `px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
      currentView === view
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
    }`;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Book Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onChangeView("search")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200 hidden sm:block">
              <i className="fa-solid fa-book-sparkles text-white text-xl"></i>
            </div>
            <span className="font-black text-slate-800 text-lg hidden sm:block tracking-tight">
              Etymolingua-alpha
            </span>
            <span className="font-black text-indigo-600 text-xl sm:hidden">
              <i className="fa-solid fa-book-sparkles"></i>
            </span>
          </button>

          {/* Book Switcher */}
          <button
            onClick={onOpenBooks}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-xl transition-all group max-w-[140px] sm:max-w-[200px]"
            title="単語帳を切り替える"
          >
            <i className="fa-solid fa-book text-slate-400 group-hover:text-indigo-500"></i>
            <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-xs sm:text-sm truncate">
              {currentBookName}
            </span>
            <i className="fa-solid fa-chevron-down text-xs text-slate-400 group-hover:text-indigo-400"></i>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onChangeView("search")}
            className={getButtonClass("search")}
          >
            <i className="fa-solid fa-magnifying-glass"></i>辞典
          </button>
          <button
            onClick={() => onChangeView("list")}
            className={getButtonClass("list")}
          >
            <i className="fa-solid fa-list-ul"></i>リスト
          </button>
          <button
            onClick={() => onChangeView("quiz")}
            className={getButtonClass("quiz")}
          >
            <i className="fa-solid fa-layer-group"></i>クイズ
          </button>
          <button
            onClick={() => onChangeView("chat")}
            className={getButtonClass("chat")}
          >
            <i className="fa-solid fa-comments"></i>AI会話
          </button>
          <button
            onClick={() => onChangeView("notebook")}
            className={getButtonClass("notebook")}
          >
            <i className="fa-solid fa-book-bookmark"></i>ノート
          </button>
          <button
            onClick={() => onChangeView("trash")}
            className={getButtonClass("trash")}
          >
            <i className="fa-solid fa-trash-can"></i>ゴミ箱
          </button>
        </nav>

        {/* Right Actions & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-50 pl-1 pr-3 py-1 rounded-full border border-slate-100">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User"
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <button
                onClick={onLogout}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                title="ログアウト"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <i className="fa-regular fa-user"></i> ログイン
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            onClick={onRepairBooks}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors rounded-full hover:bg-slate-100"
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

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 pb-safe overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => onChangeView("search")}
          className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${currentView === "search" ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
        >
          <i className="fa-solid fa-magnifying-glass text-lg mb-1"></i>
          <span className="text-[10px] font-bold">辞典</span>
        </button>
        <button
          onClick={() => onChangeView("list")}
          className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${currentView === "list" ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
        >
          <i className="fa-solid fa-list-ul text-lg mb-1"></i>
          <span className="text-[10px] font-bold">単語帳</span>
        </button>
        <button
          onClick={() => onChangeView("quiz")}
          className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${currentView === "quiz" ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
        >
          <i className="fa-solid fa-layer-group text-lg mb-1"></i>
          <span className="text-[10px] font-bold">クイズ</span>
        </button>
        <button
          onClick={() => onChangeView("chat")}
          className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${currentView === "chat" ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
        >
          <i className="fa-solid fa-comments text-lg mb-1"></i>
          <span className="text-[10px] font-bold">AI会話</span>
        </button>
        <button
          onClick={() => onChangeView("trash")}
          className={`flex flex-col items-center p-2 min-w-[3.5rem] rounded-xl ${currentView === "trash" ? "text-red-500 bg-red-50" : "text-slate-400"}`}
        >
          <i className="fa-solid fa-trash-can text-lg mb-1"></i>
          <span className="text-[10px] font-bold">ゴミ箱</span>
        </button>
      </div>
    </header>
  );
};
