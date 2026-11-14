import {
EikenSpeakingEvaluation,
EikenSpeakingEvaluationRequest,
} from "../../shared/eikenSpeaking";
import { postToFunction} from "../functionsClient";

/**
* 英検スピーキング採点 API クライアント。
*
* Functions 側の evaluateEikenSpeaking が Firebase ID トークン
* 必須になったため、fetch を functionsClient.postToFunction に置き換え、
* Authorization: Bearer <ID token> を付与するようにした。
* 未ログイン時は functionsClient がログインを促すエラーを投げる。
*/
export const evaluateEikenSpeaking = async (
payload: EikenSpeakingEvaluationRequest,
): Promise<EikenSpeakingEvaluation> => {
try {
return await postToFunction<EikenSpeakingEvaluation>(
"evaluateEikenSpeaking",
payload,
);
} catch (error: any) {
throw new Error(
error?.message || "採点に失敗しました。時間をおいて再試行してください。",
);
}
};
