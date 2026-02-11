
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, WordEntry } from '../types';
import { sendChatMessage, generateNoteFromChat } from '../services/geminiService';

interface ChatAssistantProps {
  onSaveNote: (title: string, content: string, tags: string[]) => void;
  wordHistory: WordEntry[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onSaveNote, wordHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'こんにちは！AIチューターです。\n\n【この機能の使い方】\n私と英語について会話をした後、右上の「ノートに保存」ボタンを押してください。\n\n会話の内容から、重要単語や文法ポイントをまとめた「あなただけの参考書ページ」を作成して「Smart Note」に保存します。\n\nまずは「単語帳からクイズを出して」や「この単語の類義語は？」など、何でも聞いてください！' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Create a condensed string representation of the user's vocabulary
  const vocabularyContext = useMemo(() => {
    if (wordHistory.length === 0) return "（学習済みの単語はまだありません）";
    return wordHistory.map(w => {
        const synonyms = w.synonyms.map(s => s.term).join(", ");
        return `- ${w.word}: ${w.meaning} (Synonyms: ${synonyms})`;
    }).join("\n");
  }, [wordHistory]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Send chat context + new message to AI (Stateless approach)
      const responseText = await sendChatMessage(
        messages, // Pass current history (excluding the new user msg, as helper adds it)
        input,    // New message
        vocabularyContext
      );
      
      const modelMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'すみません、エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummarize = async () => {
    // Check if there is actual conversation to summarize (more than just the initial greeting)
    if (messages.length <= 1) {
      return; // Do nothing if button is disabled effectively
    }

    setIsSummarizing(true);
    try {
      const summary = await generateNoteFromChat(messages);
      onSaveNote(summary.title, summary.content, summary.tags);
      
      // Reset chat UI after saving
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '✅ 会話をノートに保存しました！「Smart Note」タブで確認できます。' 
      }]);
    } catch (error) {
      console.error(error);
      alert('ノートの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Loading Overlay for Summarization */}
      {isSummarizing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col items-center max-w-sm text-center">
             <div className="w-16 h-16 mb-4 relative">
               <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
               <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
               <i className="fa-solid fa-pen-nib absolute inset-0 flex items-center justify-center text-indigo-600 text-xl"></i>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">ノートを作成中...</h3>
             <p className="text-sm text-slate-500">
               会話の要点をまとめています。<br/>
               Smart Noteに保存中...
             </p>
           </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-200">
             <i className="fa-solid fa-robot"></i>
           </div>
           <div>
             <h3 className="font-bold text-slate-700 leading-tight">AI Tutor</h3>
             <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Online
             </p>
           </div>
        </div>
        
        <div className="flex flex-col items-end">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || messages.length <= 1}
            className="bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            title="会話の内容を要約して保存"
          >
            <i className="fa-solid fa-floppy-disk group-hover:scale-110 transition-transform"></i>
            <span className="text-xs">ノートに保存</span>
          </button>
          {messages.length <= 1 && (
             <span className="text-[9px] text-slate-400 mt-1 mr-1">※会話後に有効になります</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
              <span className="text-xs text-slate-400 mr-2 font-bold">Thinking</span>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力（例: この単語で例文を作って / クイズを出して）"
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
            disabled={isTyping || isSummarizing}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping || isSummarizing}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 transition-all active:scale-95"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
};
