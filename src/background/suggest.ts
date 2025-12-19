import { PairSuggestionRequest, PairSuggestionResult, StoredSettings } from "../core/types";
import { GoogleProvider } from "../providers/google.provider";
import { CustomProvider } from "../providers/custom.provider";

export async function suggestPairs(request: PairSuggestionRequest, settings: StoredSettings): Promise<PairSuggestionResult> {
  const provider = resolveProvider(settings);
  if (!provider.suggestPairs) {
    throw new Error("Provider does not support pairing suggestions");
  }
  return provider.suggestPairs(request);
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
