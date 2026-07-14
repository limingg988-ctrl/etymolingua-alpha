type AutomaticSpeechRecognitionPipeline = (
  audio: Float32Array,
  options: {
    chunk_length_s?: number;
    stride_length_s?: number;
    language?: string;
    task?: "transcribe" | "translate";
  },
) => Promise<{ text?: string } | { text?: string }[]>;

const WHISPER_MODEL = "Xenova/whisper-base";
const TARGET_SAMPLE_RATE = 16000;

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

const getAudioContext = () => {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("このブラウザは音声デコードに対応していません。");
  }
  return new AudioContextCtor({ sampleRate: TARGET_SAMPLE_RATE });
};

const mixToMono = (audioBuffer: AudioBuffer) => {
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);

  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i] / channelCount;
    }
  }

  return mono;
};

const resampleLinear = (input: Float32Array, inputSampleRate: number) => {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return input;

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const sourceIndex = i * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(left + 1, input.length - 1);
    const weight = sourceIndex - left;
    output[i] = input[left] * (1 - weight) + input[right] * weight;
  }

  return output;
};

export const loadWhisperTranscriber = async () => {
  if (!transcriberPromise) {
    transcriberPromise = import("@xenova/transformers").then(async ({ env, pipeline }) => {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline("automatic-speech-recognition", WHISPER_MODEL) as Promise<AutomaticSpeechRecognitionPipeline>;
    });
  }

  return transcriberPromise;
};

export const transcribeAudioBlob = async (blob: Blob) => {
  const [transcriber, arrayBuffer] = await Promise.all([
    loadWhisperTranscriber(),
    blob.arrayBuffer(),
  ]);

  const audioContext = getAudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const mono = mixToMono(audioBuffer);
    const audio = resampleLinear(mono, audioBuffer.sampleRate);
    const result = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "english",
      task: "transcribe",
    });
    const text = Array.isArray(result)
      ? result.map((item) => item.text || "").join(" ")
      : result.text || "";
    return text.trim();
  } finally {
    void audioContext.close();
  }
};
