import { ManualPairingMap, StoredSettings } from "../core/types";

const SETTINGS_KEY = "aiTranslationSettings";
const PAIRS_KEY = "aiTranslationManualPairs";

export async function loadSettings(): Promise<StoredSettings> {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return (
    data[SETTINGS_KEY] || {
      provider: "google",
      googleModel: "gemini-2.5-flash",
      sourceLang: "pt-BR",
      targetLang: "en-US",
      tone: "",
      glossary: [],
      aiPairingEnabled: false
    }
  );
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function loadManualPairs(): Promise<ManualPairingMap> {
  const data = await chrome.storage.local.get(PAIRS_KEY);
  return data[PAIRS_KEY] || {};
}

export async function saveManualPairs(map: ManualPairingMap): Promise<void> {
  await chrome.storage.local.set({ [PAIRS_KEY]: map });
}
