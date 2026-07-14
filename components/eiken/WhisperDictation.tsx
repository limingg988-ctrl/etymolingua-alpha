import React, { useEffect, useRef, useState } from "react";
import { loadWhisperTranscriber, transcribeAudioBlob } from "../../services/eiken/whisperTranscription";

interface WhisperDictationProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onAnchorSet?: (keyword: string) => void;
  anchorKeyword?: string;
}

type WhisperState = "idle" | "loading" | "recording" | "transcribing";

const statusText: Record<WhisperState, string> = {
  idle: "録音できます",
  loading: "Whisperモデルを読み込み中",
  recording: "録音中",
  transcribing: "文字起こし中",
};

export const WhisperDictation: React.FC<WhisperDictationProps> = ({
  value,
  onChange,
  placeholder = "Your spoken response will appear here after recording...",
  onAnchorSet,
  anchorKeyword,
}) => {
  const [state, setState] = useState<WhisperState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    return () => {
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const appendTranscript = (transcript: string) => {
    if (!transcript.trim()) return;
    const next = [valueRef.current.trim(), transcript.trim()].filter(Boolean).join(" ");
    onChangeRef.current(next);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("このブラウザはマイク録音に対応していません。手入力してください。");
      return;
    }

    try {
      setError(null);
      setState("loading");
      await loadWhisperTranscriber();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setState("transcribing");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const transcript = await transcribeAudioBlob(blob);
          appendTranscript(transcript);
          if (!transcript) {
            setError("音声を検出できませんでした。もう一度録音するか、手入力してください。");
          }
        } catch (err: any) {
          setError(err?.message || "Whisperの文字起こしに失敗しました。手入力してください。");
        } finally {
          chunksRef.current = [];
          setState("idle");
        }
      };

      recorder.start();
      setState("recording");
    } catch (err: any) {
      setError(err?.message || "マイクを開始できませんでした。権限を確認してください。");
      setState("idle");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (state === "recording") {
      stopRecording();
      return;
    }
    if (state === "loading" || state === "transcribing") return;
    void startRecording();
  };

  const isBusy = state === "loading" || state === "transcribing";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-surface-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {state === "recording" && (
              <span className="absolute -inset-1.5 animate-ping rounded-full bg-rose-500/20" />
            )}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isBusy}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm transition-colors ${
                state === "recording"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : isBusy
                    ? "bg-slate-300"
                    : "bg-primary-600 hover:bg-primary-500"
              }`}
              title={state === "recording" ? "録音停止" : "録音開始"}
            >
              <i className={`fa-solid ${state === "recording" ? "fa-stop" : "fa-microphone"}`} />
            </button>
          </div>
          <div>
            <div className="text-sm font-extrabold text-surface-900">{statusText[state]}</div>
            <p className="text-xs leading-relaxed text-surface-500">
              初回のみWhisper baseモデルを読み込みます。録音停止後にブラウザ内で文字起こしします。
            </p>
          </div>
        </div>

        {onAnchorSet && (
          <label className="grid gap-1 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs">
            <span className="font-extrabold text-primary-600">3s Reflex Anchor</span>
            <input
              type="text"
              value={anchorKeyword || ""}
              onChange={(event) => onAnchorSet(event.target.value)}
              placeholder="keyword"
              className="w-full rounded-lg border border-surface-200 bg-white px-2 py-1 text-surface-900 outline-none focus:border-primary-600 md:w-44"
            />
          </label>
        )}
      </div>

      {(state === "loading" || state === "transcribing" || state === "recording") && (
        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-xs font-bold text-primary-600">
          {state === "recording"
            ? "話し終えたら停止ボタンを押してください。"
            : state === "loading"
              ? "モデル準備中です。初回は時間がかかることがあります。"
              : "音声をテキスト化しています。"}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-2xl border border-surface-200 bg-white p-4 text-sm leading-relaxed text-surface-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
      />
    </div>
  );
};
