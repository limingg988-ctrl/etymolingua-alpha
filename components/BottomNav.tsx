import React from "react";
import { AppLanguage, t } from "../services/i18n";

type ViewMode =
  | "search"
  | "list"
  | "analytics"
  | "chat"
  | "notebook"
  | "thesaurus"
  | "quiz"
  | "trash";

interface BottomNavProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  language: AppLanguage;
}

const MOBILE_NAV_ITEMS: { key: ViewMode; labelKey: string; icon: string }[] = [
  { key: "search", labelKey: "header.dictionary", icon: "fa-solid fa-house" },
  { key: "list", labelKey: "header.list", icon: "fa-solid fa-book-open" },
  { key: "quiz", labelKey: "header.quiz", icon: "fa-solid fa-layer-group" },
  { key: "analytics", labelKey: "header.analytics", icon: "fa-solid fa-chart-simple" },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, language }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-4 gap-1">
        {MOBILE_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onChangeView(item.key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 min-w-0 ${
              currentView === item.key ? "text-indigo-600 bg-indigo-50" : "text-slate-400"
            }`}
          >
            <i className={`${item.icon} text-base`}></i>
            <span className="text-[10px] font-bold truncate">{t(language, item.labelKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
