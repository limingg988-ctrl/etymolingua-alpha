import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import {
  buildEikenSpeakingUserPrompt,
  EIKEN_SPEAKING_MODEL,
  EIKEN_SPEAKING_SYSTEM_INSTRUCTION,
  EikenSpeakingEvaluationRequest,
} from "../../shared/eikenSpeaking";

initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

const setCorsHeaders = (res: any) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
};

const sanitizeString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const parseEvaluationRequest = (body: any): EikenSpeakingEvaluationRequest => {
  const mode = body?.mode === "narration" ? "narration" : "qa";
  const text = sanitizeString(body?.text, 12000);
  const context = sanitizeString(body?.context, 8000);
  const userProfile =
    body?.userProfile && typeof body.userProfile === "object" && !Array.isArray(body.userProfile)
      ? body.userProfile
      : {};

  if (!text) {
    throw Object.assign(new Error("No response text was provided to analyze."), { status: 400 });
  }
  if (!context) {
    throw Object.assign(new Error("No prompt context was provided."), { status: 400 });
  }

  return { mode, text, context, userProfile };
};

const createGenAI = () => {
  const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Gemini API key is not configured."), { status: 500 });
  }
  return new GoogleGenAI({ apiKey });
};

export const evaluateEikenSpeaking = onRequest(
  {
    region: "asia-northeast1",
    secrets: [geminiApiKey],
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    try {
      const payload = parseEvaluationRequest(req.body);
      const ai = createGenAI();
      const response = await ai.models.generateContent({
        model: EIKEN_SPEAKING_MODEL,
        contents: buildEikenSpeakingUserPrompt(payload),
        config: {
          systemInstruction: EIKEN_SPEAKING_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["score", "grades", "feedback", "modelAnswer", "suggestedKeywords"],
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Overall evaluation score from 1 to 10 (10 being perfect Pre-1 standard).",
              },
              grades: {
                type: Type.OBJECT,
                required: ["vocabulary", "grammar", "logic", "reflex"],
                properties: {
                  vocabulary: { type: Type.STRING, description: "Grade A, B, C, or D for Vocabulary" },
                  grammar: { type: Type.STRING, description: "Grade A, B, C, or D for Grammar" },
                  logic: { type: Type.STRING, description: "Grade A, B, C, or D for Logic & Argumentation" },
                  reflex: { type: Type.STRING, description: "Grade A, B, C, or D for Reflex & Strategy" },
                },
              },
              feedback: {
                type: Type.OBJECT,
                required: ["vocabulary", "grammar", "logic", "nextAction"],
                properties: {
                  vocabulary: { type: Type.STRING },
                  grammar: { type: Type.STRING },
                  logic: { type: Type.STRING },
                  nextAction: { type: Type.STRING },
                },
              },
              modelAnswer: { type: Type.STRING },
              suggestedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const jsonText = response.text ? response.text.trim() : "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      const status = typeof error?.status === "number" ? error.status : 500;
      console.error("Eiken speaking evaluation failed:", error);
      res.status(status).json({
        error: status === 500 ? "Failed to evaluate the response. Please try again." : error.message,
        details: status === 500 ? error?.message : undefined,
      });
    }
  },
);
