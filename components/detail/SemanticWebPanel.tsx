import React from "react";

type SemanticNode = {
  id: string;
  term: string;
  translation?: string;
  group: "synonym" | "idiom" | "related";
};

interface SemanticWebPanelProps {
  semanticNodes: SemanticNode[];
  onSearchRelated?: (term: string) => void;
}

export const SemanticWebPanel: React.FC<SemanticWebPanelProps> = React.memo(({ semanticNodes, onSearchRelated }) => {
  if (semanticNodes.length === 0) {
    return <p className="text-sm text-slate-500">関連ノードがありません。</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {semanticNodes.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onSearchRelated?.(node.term)}
          className={`text-left p-3 rounded-xl border transition-colors motion-reduce:transition-none ${
            node.group === "synonym"
              ? "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
              : node.group === "idiom"
                ? "bg-amber-50 border-amber-100 hover:bg-amber-100"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <p className="text-sm font-bold text-slate-900">{node.term}</p>
          {node.translation && <p className="text-xs text-slate-500">{node.translation}</p>}
        </button>
      ))}
    </div>
  );
});

SemanticWebPanel.displayName = "SemanticWebPanel";
