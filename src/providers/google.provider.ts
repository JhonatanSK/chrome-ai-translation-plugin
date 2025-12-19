import { AiProvider } from "./provider.interface";
import { PairSuggestionRequest, PairSuggestionResult, TranslateJob, TranslateResult } from "../core/types";

interface GoogleProviderOptions {
  apiKey: string;
  model: string;
}

export class GoogleProvider implements AiProvider {
  name = "google";
  private apiKey: string;
  private model: string;

  constructor(options: GoogleProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gemini-2.5-flash";
  }

  async translate(job: TranslateJob): Promise<TranslateResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const prompt = buildPrompt(job);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google provider error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseResult(text);
  }

  async suggestPairs(request: PairSuggestionRequest): Promise<PairSuggestionResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const prompt = buildPairingPrompt(request);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google provider error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parsePairingResult(text);
  }
}

function buildPrompt(job: TranslateJob): string {
  return [
    "You are a translation engine. Return only valid JSON.",
    "Preserve names, brands, acronyms, URLs, and text inside {{ }} or [ ].",
    "Preserve line breaks and HTML; translate only text nodes.",
    "Do not add explanations.",
    "JSON schema:",
    "{\"results\":[{\"pairId\":\"p1\",\"translated\":\"...\"}]}",
    "Payload:",
    JSON.stringify(job)
  ].join("\n");
}

function parseResult(raw: string): TranslateResult {
  try {
    const trimmed = raw.trim().replace(/^```json/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(trimmed);
    if (!parsed || !Array.isArray(parsed.results)) throw new Error("Invalid response");
    return parsed as TranslateResult;
  } catch (error) {
    throw new Error(`Failed to parse provider response: ${String(error)}`);
  }
}

function buildPairingPrompt(request: PairSuggestionRequest): string {
  return [
    "You are a pairing engine. Return only valid JSON.",
    "Use only the provided field metadata. Do not invent fields.",
    "JSON schema:",
    "{\"pairs\":[{\"sourceId\":\"f1\",\"targetId\":\"f2\",\"confidence\":0.9}]}",
    "Payload:",
    JSON.stringify(request)
  ].join("\n");
}

function parsePairingResult(raw: string): PairSuggestionResult {
  try {
    const trimmed = raw.trim().replace(/^```json/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(trimmed);
    if (!parsed || !Array.isArray(parsed.pairs)) throw new Error("Invalid response");
    return parsed as PairSuggestionResult;
  } catch (error) {
    throw new Error(`Failed to parse provider response: ${String(error)}`);
  }
}
