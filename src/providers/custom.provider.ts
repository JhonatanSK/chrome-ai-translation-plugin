import { AiProvider } from "./provider.interface";
import { PairSuggestionRequest, PairSuggestionResult, TranslateJob, TranslateResult } from "../core/types";

interface CustomProviderOptions {
  endpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class CustomProvider implements AiProvider {
  name = "custom";
  private endpoint: string;
  private headers: Record<string, string>;
  private timeoutMs: number;

  constructor(options: CustomProviderOptions) {
    this.endpoint = options.endpoint;
    this.headers = options.headers || {};
    this.timeoutMs = options.timeoutMs || 20000;
  }

  async translate(job: TranslateJob): Promise<TranslateResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify(job),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Custom provider error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as TranslateResult;
    if (!data || !Array.isArray(data.results)) {
      throw new Error("Custom provider returned invalid JSON");
    }
    return data;
  }

  async suggestPairs(request: PairSuggestionRequest): Promise<PairSuggestionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify({ type: "pairing", request }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Custom provider error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as PairSuggestionResult;
    if (!data || !Array.isArray(data.pairs)) {
      throw new Error("Custom provider returned invalid pairing JSON");
    }
    return data;
  }
}
