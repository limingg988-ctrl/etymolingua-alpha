
import React from 'react';

interface UsageGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageGuide: React.FC<UsageGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-regular fa-lightbulb text-indigo-500"></i>
            EtymoLinguaの使い方
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">単語を「深く」調べる</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                ただの意味だけでなく、<strong>語源（Etymology）</strong>や<strong>覚え方（Mnemonic）</strong>、そして<strong>論理的な背景（Logic）</strong>をAIが解説します。「なぜその意味になるのか？」を知ることで、記憶に強く定着します。
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">音声と例文で実践する</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                スピーカーアイコン <i className="fa-solid fa-volume-high text-xs bg-indigo-100 p-1 rounded"></i> を押すと、AIがネイティブに近い発音で単語を読み上げます。例文も再生できるので、リズムと一緒に覚えましょう。
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">3</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Study Chat & Smart Note</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                <strong>Study Chat</strong>でAI先生と英会話やクイズを行い、終わったら右上の「ノートに保存」を押してください。
                AIが会話の重要ポイントを自動でまとめ、<strong>Smart Note</strong>に自分だけの参考書ページとして保存します。
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">4</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">データを守る・復元する</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                調べた単語はブラウザに自動保存されますが、もしものためにファイル保存が可能です。
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded">ファイルに保存</span>
                  <span>現在の単語帳をJSONファイルとしてダウンロードします。</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="bg-white border border-slate-300 text-slate-600 text-[10px] px-2 py-0.5 rounded">ファイルから復元</span>
                   <span>保存したファイルを読み込み、リストを復元します。</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-lg">5</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">関連語へジャンプ</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                解説の中にある類義語や語源の仲間をクリックすると、その単語を即座に調べることができます。知識のネットワークを広げましょう。
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">6</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">辞典検索の新機能（重要）</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                辞典タブに<strong>検索モード切替</strong>を追加しました。初期状態は「すべて」で、必要に応じて「idiom重視」「語源重視」「要点のみ」に切り替えられます。
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                さらに、複数語の一括検索に対応しました。入力欄で <code className="bg-slate-100 px-1 rounded">,</code>・改行・<code className="bg-slate-100 px-1 rounded">;</code> 区切りで複数語を入力できます（<code className="bg-slate-100 px-1 rounded">/</code> を含む語は1語として扱います）。
              </p>
            </div>
          </section>


        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl text-center">
          <button 
            onClick={onClose}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            理解しました！
          </button>
        </div>
      </div>
    </div>
  );
};
