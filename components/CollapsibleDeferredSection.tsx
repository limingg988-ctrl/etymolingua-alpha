import React, { useEffect, useState } from "react";

interface CollapsibleDeferredSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleDeferredSection: React.FC<CollapsibleDeferredSectionProps> = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [shouldRender, setShouldRender] = useState(defaultOpen);

  useEffect(() => {
    if (!isOpen || shouldRender) return;
    const timeoutId = window.setTimeout(() => setShouldRender(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, shouldRender]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-semibold text-indigo-600"
        >
          {isOpen ? "折りたたむ" : "展開する"}
        </button>
      </div>

      {isOpen && (
        <div className="animate-fade-in motion-reduce:animate-none">
          {shouldRender ? children : <p className="text-sm text-slate-500">読み込み中...</p>}
        </div>
      )}
    </section>
  );
};
