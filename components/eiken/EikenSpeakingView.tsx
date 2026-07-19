import React, { useEffect, useMemo, useRef, useState } from "react";
import { evaluateEikenSpeaking } from "../../services/eiken/evaluationApi";
import { EikenSpeakingEvaluation, EikenSpeakingMode } from "../../shared/eikenSpeaking";
import { WhisperDictation } from "./WhisperDictation";
import solarImg from "./assets/images/solar_panels_v2_1783740855203.jpg";
import tabletsImg from "./assets/images/school_tablets_v2_1783740868696.jpg";
import organicImg from "./assets/images/organic_store_v2_1783740879272.jpg";
import bicycleImg from "./assets/images/bicycle_lanes_v2_1783740891221.jpg";
import plasticImg from "./assets/images/plastic_bags_v2_1783740819763.jpg";
import teleworkImg from "./assets/images/telework_v2_1783740834014.jpg";

type Grade = "A" | "B" | "C" | "D";

interface ComicPanel {
  id: number;
  description: string;
  hints: string[];
}

interface ComicSituation {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  panels: ComicPanel[];
}

interface QAItem {
  id: string;
  question: string;
  category: string;
}

interface PracticeSession {
  id: string;
  timestamp: string;
  mode: EikenSpeakingMode;
  title: string;
  userAnswer: string;
  evaluation: EikenSpeakingEvaluation;
}

const COMIC_SITUATIONS: ComicSituation[] = [
  {
    id: "solar_panels",
    title: "Solar Panels and Neighbors",
    description: "A couple installs solar panels, then faces a glare complaint from a neighbor.",
    imagePath: solarImg,
    panels: [
      { id: 1, description: "A husband and wife read a flyer about installing solar panels to reduce electricity bills.", hints: ["read a flyer", "save on electricity bills", "decide to install"] },
      { id: 2, description: "A few weeks later, they are pleased because their utility bill has gone down.", hints: ["be pleased", "utility bills decrease", "save money"] },
      { id: 3, description: "However, a neighbor complains that glare from the panels shines into his bedroom.", hints: ["neighbor complains", "glare reflects", "feel embarrassed"] },
      { id: 4, description: "The next day, the couple discusses how to solve the reflection issue.", hints: ["discuss a solution", "look worried", "cope with the complaint"] },
    ],
  },
  {
    id: "school_tablets",
    title: "Tablets in High School",
    description: "A school introduces tablets, but parents later complain about late-night screen use.",
    imagePath: tabletsImg,
    panels: [
      { id: 1, description: "A principal proposes introducing tablet computers to improve classes.", hints: ["introduce tablets", "modernize education", "improve classes"] },
      { id: 2, description: "A teacher uses a tablet in class, and the students are highly engaged.", hints: ["interactive materials", "highly engaged", "lesson goes smoothly"] },
      { id: 3, description: "However, parents complain that students stay up too late using the devices.", hints: ["parental concern", "stay up late", "screen-time distraction"] },
      { id: 4, description: "Teachers discuss time limits and app blocks to create better guidelines.", hints: ["establish rules", "restrict apps", "set guidelines"] },
    ],
  },
  {
    id: "organic_store",
    title: "The Organic Food Challenge",
    description: "An organic shop succeeds through social media, then faces competition from a supermarket.",
    imagePath: organicImg,
    panels: [
      { id: 1, description: "A woman opens an organic grocery store but struggles to attract customers.", hints: ["open a store", "local produce", "lack of customers"] },
      { id: 2, description: "She hands out flyers near a station, but commuters ignore them.", hints: ["hand out flyers", "be ignored", "feel discouraged"] },
      { id: 3, description: "She posts recipes on social media, and her store becomes crowded.", hints: ["leverage social media", "post recipes", "attract customers"] },
      { id: 4, description: "A large supermarket opens an organic corner next door at lower prices.", hints: ["major chain", "intense competition", "undercut prices"] },
    ],
  },
  {
    id: "bicycle_lanes",
    title: "Bicycle Lane Conflict",
    description: "A city adds bicycle lanes for safety, but the change causes traffic congestion.",
    imagePath: bicycleImg,
    panels: [
      { id: 1, description: "Residents complain that bicycles on narrow sidewalks endanger pedestrians.", hints: ["narrow sidewalks", "pedestrian safety", "propose bicycle lanes"] },
      { id: 2, description: "The city paints bicycle lanes, and cyclists ride more safely.", hints: ["paint lanes", "ride safely", "separate cyclists"] },
      { id: 3, description: "However, car lanes become narrower and drivers get stuck in traffic.", hints: ["traffic congestion", "frustrated drivers", "narrow car lanes"] },
      { id: 4, description: "Officials discuss how to balance the needs of drivers and cyclists.", hints: ["public complaints", "balance needs", "road design"] },
    ],
  },
  {
    id: "plastic_bags",
    title: "No-Plastic Campaign",
    description: "A supermarket charges for plastic bags, then faces congestion at packing counters.",
    imagePath: plasticImg,
    panels: [
      { id: 1, description: "A manager proposes charging for plastic bags to reduce waste.", hints: ["charge for bags", "reduce plastic waste", "bring reusable bags"] },
      { id: 2, description: "Customers bring eco-bags, and the manager is pleased with the campaign.", hints: ["reusable bags", "checkout", "look pleased"] },
      { id: 3, description: "However, the packing counter becomes crowded and customers complain.", hints: ["crowded counter", "narrow space", "complain"] },
      { id: 4, description: "The manager discusses expanding or rearranging the packing area.", hints: ["rearrange spaces", "prevent chaos", "improve layout"] },
    ],
  },
  {
    id: "telework",
    title: "Teleworking Initiative",
    description: "A company adopts telework, then struggles with communication delays.",
    imagePath: teleworkImg,
    panels: [
      { id: 1, description: "A company president announces a fully remote policy to improve job satisfaction.", hints: ["announce a policy", "reduce commuting stress", "increase satisfaction"] },
      { id: 2, description: "An employee works happily from home and feels more productive.", hints: ["work from home", "comfortable environment", "improve productivity"] },
      { id: 3, description: "However, a manager says remote work has caused communication delays.", hints: ["communication delays", "online meeting", "track progress"] },
      { id: 4, description: "Executives discuss a hybrid model with both remote and office days.", hints: ["hybrid model", "office days", "look worried"] },
    ],
  },
];

const QA_ITEMS: QAItem[] = [
  { id: "tuition", question: "Do you think public university tuition should be made completely free in Japan?", category: "Education & Economy" },
  { id: "social_media", question: "Do you think social media has a more positive impact than negative impact on young people's relationships?", category: "Technology & Society" },
  { id: "immigration", question: "Should Japan accept more foreign workers to solve its long-term labor shortages?", category: "Social Policy & Labor" },
  { id: "culture", question: "Do you think the government should spend more tax revenue promoting traditional Japanese culture to tourists?", category: "Culture & Tourism" },
  { id: "retailers", question: "Can small local shops survive in the long run against giant online retailers?", category: "Economy & Business" },
  { id: "work_life", question: "Do you think Japanese companies are doing enough to help their employees achieve a good work-life balance?", category: "Workplace & Labor" },
  { id: "renewable_energy", question: "Do you think Japan should fully phase out nuclear power plants in favor of renewable energy?", category: "Environment & Energy" },
  { id: "telework_future", question: "Do you think working from home will become the standard way of working for most office workers in the future?", category: "Workplace & Technology" },
  { id: "reusable_bags", question: "Should supermarkets stop selling plastic bags entirely and force all consumers to use reusable bags?", category: "Environment & Consumer Policy" },
];

const STORAGE_KEY = "etymolingua_eiken_speaking_sessions";

const gradeClass = (grade: Grade) => {
  if (grade === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (grade === "B") return "border-sky-200 bg-sky-50 text-sky-700";
  if (grade === "C") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const speakEnglish = (text: string, rate = 0.9) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((item) => item.lang.startsWith("en-US") && item.name.includes("Natural")) ||
    voices.find((item) => item.lang.startsWith("en-US")) ||
    voices.find((item) => item.lang.startsWith("en"));
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
};

export const EikenSpeakingView: React.FC = () => {
  const [tab, setTab] = useState<"practice" | "progress" | "guide">("practice");
  const [mode, setMode] = useState<EikenSpeakingMode | null>(null);
  const [step, setStep] = useState<"setup" | "prep" | "speak" | "evaluating" | "feedback">("setup");
  const [selectedComic, setSelectedComic] = useState<ComicSituation | null>(null);
  const [selectedQA, setSelectedQA] = useState<QAItem | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [speakTimeLeft, setSpeakTimeLeft] = useState(120);
  const [reflexTimeLeft, setReflexTimeLeft] = useState(3);
  const [answer, setAnswer] = useState("");
  const [anchorKeyword, setAnchorKeyword] = useState("");
  const [reflexSuccess, setReflexSuccess] = useState<boolean | null>(null);
  const [evaluation, setEvaluation] = useState<EikenSpeakingEvaluation | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModelPlaying, setIsModelPlaying] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<"vocabulary" | "grammar" | "logic" | "nextAction">("vocabulary");
  const prepTimerRef = useRef<number | null>(null);
  const speakTimerRef = useRef<number | null>(null);
  const reflexTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (step !== "prep") return;
    if (prepTimeLeft <= 0) {
      startSpeakingPhase();
      return;
    }
    prepTimerRef.current = window.setTimeout(() => setPrepTimeLeft((prev) => prev - 1), 1000);
    return () => {
      if (prepTimerRef.current) window.clearTimeout(prepTimerRef.current);
    };
  }, [step, prepTimeLeft]);

  useEffect(() => {
    if (step !== "speak" || speakTimeLeft <= 0) return;
    speakTimerRef.current = window.setTimeout(() => setSpeakTimeLeft((prev) => prev - 1), 1000);
    return () => {
      if (speakTimerRef.current) window.clearTimeout(speakTimerRef.current);
    };
  }, [step, speakTimeLeft]);

  useEffect(() => {
    if (step !== "speak" || reflexTimeLeft <= 0 || reflexSuccess !== null) return;
    reflexTimerRef.current = window.setTimeout(() => setReflexTimeLeft((prev) => prev - 1), 1000);
    return () => {
      if (reflexTimerRef.current) window.clearTimeout(reflexTimerRef.current);
    };
  }, [step, reflexTimeLeft, reflexSuccess]);

  const currentTitle = useMemo(() => {
    if (mode === "narration") return selectedComic?.title || "Narration Practice";
    return selectedQA?.question || "Social Q&A";
  }, [mode, selectedComic, selectedQA]);

  const saveSession = (session: PracticeSession) => {
    const next = [session, ...sessions].slice(0, 50);
    setSessions(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const startPrepPhase = (comic: ComicSituation) => {
    setMode("narration");
    setSelectedComic(comic);
    setSelectedQA(null);
    setStep("prep");
    setPrepTimeLeft(60);
    setSpeakTimeLeft(120);
    setReflexTimeLeft(3);
    setReflexSuccess(null);
    setAnchorKeyword("");
    setAnswer("");
    setEvaluation(null);
    setError(null);
  };

  const startQAPractice = (qa: QAItem) => {
    setMode("qa");
    setSelectedQA(qa);
    setSelectedComic(null);
    setStep("speak");
    setSpeakTimeLeft(60);
    setReflexTimeLeft(3);
    setReflexSuccess(null);
    setAnchorKeyword("");
    setAnswer("");
    setEvaluation(null);
    setError(null);
    window.setTimeout(() => speakEnglish(qa.question), 200);
  };

  const startSpeakingPhase = () => {
    if (prepTimerRef.current) window.clearTimeout(prepTimerRef.current);
    setStep("speak");
    setSpeakTimeLeft(mode === "narration" ? 120 : 60);
    setReflexTimeLeft(3);
    setReflexSuccess(null);
  };

  const setAnchor = (value: string) => {
    setAnchorKeyword(value);
    if (value.trim() && reflexSuccess === null) {
      setReflexSuccess(reflexTimeLeft > 0);
    }
  };

  const resetPractice = () => {
    window.speechSynthesis.cancel();
    setStep("setup");
    setMode(null);
    setSelectedComic(null);
    setSelectedQA(null);
    setAnswer("");
    setAnchorKeyword("");
    setEvaluation(null);
    setError(null);
    setIsModelPlaying(false);
  };

  const submitResponse = async () => {
    if (!mode) return;
    if (!answer.trim()) {
      setError("回答を録音または入力してから採点してください。");
      return;
    }
    setStep("evaluating");
    setError(null);

    const context = mode === "narration" && selectedComic
      ? `Comic Title: "${selectedComic.title}"\n${selectedComic.panels.map((panel) => `Panel ${panel.id}: ${panel.description}`).join("\n")}`
      : `Question: "${selectedQA?.question || ""}"`;

    try {
      const result = await evaluateEikenSpeaking({
        mode,
        text: answer,
        context,
        userProfile: {
          anchorKeywordUsed: anchorKeyword || "None specified",
          anchorChallengeSuccess: reflexSuccess === true ? "Passed within 3 seconds" : "Failed or not attempted",
        },
      });
      setEvaluation(result);
      saveSession({
        id: `eiken-${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode,
        title: currentTitle,
        userAnswer: answer,
        evaluation: result,
      });
      setStep("feedback");
      setActiveFeedback("vocabulary");
    } catch (err: any) {
      setError(err?.message || "採点に失敗しました。");
      setStep("speak");
    }
  };

  const loadSession = (session: PracticeSession) => {
    setMode(session.mode);
    setEvaluation(session.evaluation);
    setAnswer(session.userAnswer);
    setSelectedComic(COMIC_SITUATIONS.find((item) => item.title === session.title) || null);
    setSelectedQA(QA_ITEMS.find((item) => item.question === session.title) || null);
    setStep("feedback");
    setTab("practice");
  };

  const clearHistory = () => {
    if (!window.confirm("英検スピーキング練習履歴をすべて削除しますか？")) return;
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleModelAnswer = () => {
    if (!evaluation) return;
    if (isModelPlaying) {
      window.speechSynthesis.cancel();
      setIsModelPlaying(false);
      return;
    }
    setIsModelPlaying(true);
    const utterance = new SpeechSynthesisUtterance(evaluation.modelAnswer);
    utterance.rate = 0.95;
    utterance.onend = () => setIsModelPlaying(false);
    utterance.onerror = () => setIsModelPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const averageScore = sessions.length
    ? (sessions.reduce((sum, session) => sum + session.evaluation.score, 0) / sessions.length).toFixed(1)
    : "0.0";

  return (
    <div className="mobile-view-shell space-y-6">
      <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-indigo-200">
              <i className="fa-solid fa-microphone-lines text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-surface-900 md:text-2xl">英検準1級 Speaking AI</h1>
              <p className="text-xs font-semibold text-surface-500">3秒でキーワードを1つ確保し、話し始める練習に特化</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-extrabold">
            {[
              { key: "practice", label: "Practice", icon: "fa-microphone" },
              { key: "progress", label: "Progress", icon: "fa-chart-line" },
              { key: "guide", label: "Guide", icon: "fa-circle-info" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as typeof tab)}
                className={`rounded-lg px-3 py-2 transition-colors ${tab === item.key ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-surface-900"}`}
              >
                <i className={`fa-solid ${item.icon} mr-1.5`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "practice" && (
        <div className="space-y-6">
          {step === "setup" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("narration")}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors ${mode === "narration" ? "border-primary-600 ring-2 ring-primary-100" : "border-surface-200 hover:border-primary-200"}`}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <i className="fa-solid fa-layer-group" />
                  </div>
                  <h2 className="text-lg font-black text-surface-900">Narration Practice</h2>
                  <p className="mt-2 text-sm leading-6 text-surface-600">4コマを1分準備し、2分で描写します。起承転結と時制をAIが診断します。</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("qa")}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors ${mode === "qa" ? "border-secondary-500 ring-2 ring-emerald-100" : "border-surface-200 hover:border-emerald-200"}`}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <i className="fa-solid fa-comments" />
                  </div>
                  <h2 className="text-lg font-black text-surface-900">Social Q&A</h2>
                  <p className="mt-2 text-sm leading-6 text-surface-600">社会問題への意見を60秒で回答します。理由の具体性と瞬発力を鍛えます。</p>
                </button>
              </div>

              {mode === "narration" && (
                <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-sm font-black text-surface-900">4コマシナリオを選択</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COMIC_SITUATIONS.map((comic) => (
                      <button
                        key={comic.id}
                        type="button"
                        onClick={() => startPrepPhase(comic)}
                        className="flex items-center gap-3 rounded-xl border border-surface-200 p-3 text-left transition-colors hover:border-primary-200 hover:bg-primary-50"
                      >
                        <img src={comic.imagePath} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-surface-900">{comic.title}</span>
                          <span className="line-clamp-2 text-xs leading-5 text-surface-500">{comic.description}</span>
                        </span>
                        <i className="fa-solid fa-chevron-right text-xs text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "qa" && (
                <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-sm font-black text-surface-900">社会問題トピックを選択</h2>
                  <div className="grid gap-2">
                    {QA_ITEMS.map((qa) => (
                      <button
                        key={qa.id}
                        type="button"
                        onClick={() => startQAPractice(qa)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <span>
                          <span className="mb-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{qa.category}</span>
                          <span className="block text-sm font-extrabold leading-6 text-surface-900">{qa.question}</span>
                        </span>
                        <i className="fa-solid fa-volume-high text-emerald-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "prep" && selectedComic && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <i className="fa-solid fa-clock" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-amber-600">Preparation Phase</p>
                    <h2 className="text-base font-black text-surface-900">構成とキーワードを準備してください</h2>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-3xl font-black text-amber-500">{prepTimeLeft}s</span>
                  <button type="button" onClick={startSpeakingPhase} className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-black text-white">
                    <i className="fa-solid fa-play mr-1.5" />
                    Speakingへ
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                  <img src={selectedComic.imagePath} alt={selectedComic.title} className="w-full rounded-xl border border-surface-200 object-contain" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedComic.panels.map((panel, index) => (
                    <div key={panel.id} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wide text-primary-600">
                          {index === 0 ? "One day" : index === 1 ? "A few weeks later" : index === 2 ? "However" : "The next day"}
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-black text-primary-600">{panel.id}</span>
                      </div>
                      <p className="text-xs font-semibold leading-6 text-surface-700">{panel.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-surface-100 pt-3">
                        {panel.hints.map((hint) => (
                          <span key={hint} className="rounded-lg border border-surface-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">{hint}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(step === "speak" || step === "evaluating") && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-primary-600">{mode === "narration" ? "Narration" : "Q&A"}</p>
                    <h2 className="text-lg font-black leading-7 text-surface-900">{currentTitle}</h2>
                    {selectedQA && (
                      <button type="button" onClick={() => speakEnglish(selectedQA.question)} className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                        <i className="fa-solid fa-volume-high mr-1.5" />
                        質問をもう一度聞く
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 px-4 py-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Time</p>
                      <p className="text-2xl font-black text-surface-900">{speakTimeLeft}s</p>
                    </div>
                    <div className={`rounded-xl px-4 py-2 ${reflexSuccess === true ? "bg-emerald-50" : reflexSuccess === false ? "bg-rose-50" : "bg-primary-50"}`}>
                      <p className="text-[10px] font-black uppercase text-slate-400">3s Anchor</p>
                      <p className="text-2xl font-black text-primary-600">{reflexSuccess === null ? `${reflexTimeLeft}s` : reflexSuccess ? "OK" : "Late"}</p>
                    </div>
                  </div>
                </div>

                {selectedComic && (
                  <div className="mb-4 rounded-xl border border-surface-200 bg-slate-50 p-3 text-xs leading-6 text-surface-600">
                    {selectedComic.panels.map((panel) => `Panel ${panel.id}: ${panel.description}`).join(" / ")}
                  </div>
                )}

                <WhisperDictation
                  value={answer}
                  onChange={setAnswer}
                  anchorKeyword={anchorKeyword}
                  onAnchorSet={setAnchor}
                  placeholder="録音後の文字起こし、または手入力の回答をここに入れてください。"
                />

                {error && <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button type="button" onClick={resetPractice} className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-black text-surface-700">
                    <i className="fa-solid fa-rotate-left mr-1.5" />
                    選び直す
                  </button>
                  <button
                    type="button"
                    onClick={submitResponse}
                    disabled={step === "evaluating"}
                    className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300"
                  >
                    <i className={`fa-solid ${step === "evaluating" ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"} mr-1.5`} />
                    {step === "evaluating" ? "AI採点中" : "AIで採点する"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "feedback" && evaluation && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-primary-600">Practice Evaluation</p>
                    <h2 className="text-xl font-black text-surface-900">{currentTitle}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary-100 bg-primary-50">
                      <span className="text-3xl font-black text-primary-600">{evaluation.score}</span>
                    </div>
                    <span className="text-sm font-black text-surface-700">/10<br />Overall</span>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    ["語彙・表現", evaluation.grades.vocabulary],
                    ["文法・構文", evaluation.grades.grammar],
                    ["論理・一貫性", evaluation.grades.logic],
                    ["瞬発キーワード", evaluation.grades.reflex],
                  ].map(([label, grade]) => (
                    <div key={label} className={`rounded-xl border p-3 text-center ${gradeClass(grade as Grade)}`}>
                      <p className="text-xs font-bold opacity-80">{label}</p>
                      <p className="text-2xl font-black">{grade}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-surface-200 bg-white shadow-sm">
                <div className="grid grid-cols-2 border-b border-surface-200 text-xs font-black md:grid-cols-4">
                  {[
                    ["vocabulary", "語彙"],
                    ["grammar", "文法"],
                    ["logic", "論理"],
                    ["nextAction", "次の一手"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFeedback(key as typeof activeFeedback)}
                      className={`px-3 py-3 ${activeFeedback === key ? "bg-primary-50 text-primary-600" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="min-h-44 p-5 text-sm leading-7 text-surface-700 whitespace-pre-line">
                  {evaluation.feedback[activeFeedback]}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-700 pb-4">
                  <h3 className="text-lg font-black">Model Response</h3>
                  <button type="button" onClick={toggleModelAnswer} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-100">
                    <i className={`fa-solid ${isModelPlaying ? "fa-stop" : "fa-volume-high"} mr-1.5`} />
                    {isModelPlaying ? "Stop" : "Listen"}
                  </button>
                </div>
                <p className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 font-display text-lg leading-8 text-slate-100">{evaluation.modelAnswer}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {evaluation.suggestedKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-bold text-indigo-300">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-black text-surface-900">Your Original Attempt</h3>
                <p className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-surface-700">{answer}</p>
              </div>

              <div className="flex justify-center">
                <button type="button" onClick={resetPractice} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white">
                  <i className="fa-solid fa-rotate-right mr-1.5" />
                  もう一度練習する
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-400">Total Practices</p>
              <p className="mt-1 text-3xl font-black text-surface-900">{sessions.length}</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-400">Average Score</p>
              <p className="mt-1 text-3xl font-black text-surface-900">{averageScore}<span className="text-sm text-slate-400"> /10</span></p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-400">Latest Mode</p>
              <p className="mt-1 text-2xl font-black text-surface-900">{sessions[0]?.mode === "qa" ? "Q&A" : sessions[0] ? "Narration" : "-"}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-200 p-4">
              <div>
                <h2 className="font-black text-surface-900">Practice History</h2>
                <p className="text-xs text-surface-500">過去の採点結果を開いて復習できます。</p>
              </div>
              {sessions.length > 0 && (
                <button type="button" onClick={clearHistory} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-black text-rose-600">
                  <i className="fa-solid fa-trash-can mr-1.5" />
                  Clear
                </button>
              )}
            </div>
            {sessions.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-400">まだ練習履歴がありません。</div>
            ) : (
              <div className="divide-y divide-surface-200">
                {sessions.map((session) => (
                  <button key={session.id} type="button" onClick={() => loadSession(session)} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="mb-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{session.mode}</span>
                      <span className="block truncate text-sm font-black text-surface-900">{session.title}</span>
                      <span className="text-xs text-slate-400">{new Date(session.timestamp).toLocaleString("ja-JP")}</span>
                    </span>
                    <span className="shrink-0 text-lg font-black text-primary-600">{session.evaluation.score}/10</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "guide" && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["1分準備", "4コマは One day / A few weeks later / However / The next day の流れで骨組みを作ります。"],
            ["3秒キーワード", "話し始める前に fee, safety, productivity など1語だけ確保し、最初の文に変換します。"],
            ["回答の型", "Q&Aは結論、理由、具体例、短いまとめの順に話すと論理評価が安定します。"],
          ].map(([title, body], index) => (
            <div key={title} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <span className="font-black">{index + 1}</span>
              </div>
              <h2 className="text-lg font-black text-surface-900">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-surface-600">{body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
