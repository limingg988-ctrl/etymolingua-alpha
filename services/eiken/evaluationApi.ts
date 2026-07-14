import {
  EikenSpeakingEvaluation,
  EikenSpeakingEvaluationRequest,
} from "../../shared/eikenSpeaking";

const FUNCTIONS_ORIGIN =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_ORIGIN ||
  "https://asia-northeast1-etymolingua-61e6d.cloudfunctions.net";

export const evaluateEikenSpeaking = async (
  payload: EikenSpeakingEvaluationRequest,
): Promise<EikenSpeakingEvaluation> => {
  const response = await fetch(`${FUNCTIONS_ORIGIN}/evaluateEikenSpeaking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "採点に失敗しました。時間をおいて再試行してください。");
  }

  return response.json();
};
