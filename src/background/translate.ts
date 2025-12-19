import { TranslateJob, TranslateResult, StoredSettings } from "../core/types";
import { GoogleProvider } from "../providers/google.provider";
import { CustomProvider } from "../providers/custom.provider";

const MAX_CHARS = 4000;
const MAX_PAIRS = 8;

export async function translateWithProvider(job: TranslateJob, settings: StoredSettings): Promise<TranslateResult> {
  const provider = resolveProvider(settings);
  const batches = batchJob(job);
  const results: TranslateResult = { results: [] };

  for (const batch of batches) {
    const res = await provider.translate(batch);
    results.results.push(...res.results);
  }

  return results;
}

function resolveProvider(settings: StoredSettings) {
  if (settings.provider === "custom" && settings.customEndpoint) {
    return new CustomProvider({
      endpoint: settings.customEndpoint,
      headers: settings.customHeaders,
      timeoutMs: settings.customTimeoutMs
    });
  }

  if (!settings.googleApiKey) {
    throw new Error("Missing Google API key");
  }

  return new GoogleProvider({
    apiKey: settings.googleApiKey,
    model: settings.googleModel || "gemini-2.5-flash"
  });
}

function batchJob(job: TranslateJob): TranslateJob[] {
  const batches: TranslateJob[] = [];
  let current: TranslateJob = { ...job, pairs: [] };
  let currentChars = 0;

  for (const pair of job.pairs) {
    const textLen = pair.source.value.length;
    const wouldOverflow =
      current.pairs.length >= MAX_PAIRS || currentChars + textLen > MAX_CHARS;

    if (wouldOverflow && current.pairs.length > 0) {
      batches.push(current);
      current = { ...job, pairs: [] };
      currentChars = 0;
    }

    current.pairs.push(pair);
    currentChars += textLen;
  }

  if (current.pairs.length > 0) batches.push(current);
  return batches;
}
