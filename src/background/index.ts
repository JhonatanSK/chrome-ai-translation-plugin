import { ContentToBackgroundMessage, UiToBackgroundMessage } from "../core/types";
import { loadSettings, saveSettings, loadManualPairs, saveManualPairs } from "./storage";
import { translateWithProvider } from "./translate";
import { suggestPairs } from "./suggest";

chrome.runtime.onMessage.addListener((message: ContentToBackgroundMessage | UiToBackgroundMessage, _sender, sendResponse) => {
  console.debug("[background] Message received", message);
  if (message.type === "LOAD_SETTINGS") {
    loadSettings()
      .then((settings) => sendResponse({ type: "SETTINGS", settings }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    saveSettings(message.settings)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  if (message.type === "TRANSLATE_JOB") {
    loadSettings()
      .then((settings) => translateWithProvider(message.job, settings))
      .then((result) => sendResponse({ type: "TRANSLATE_RESULT", result }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  if (message.type === "SUGGEST_PAIRS") {
    loadSettings()
      .then((settings) => suggestPairs(message.request, settings))
      .then((result) => sendResponse({ type: "PAIR_SUGGESTIONS", result }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  if (message.type === "SAVE_MANUAL_PAIRS") {
    loadManualPairs()
      .then((map) => {
        map[message.domain] = message.pairs;
        return saveManualPairs(map);
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  if (message.type === "GET_MANUAL_PAIRS") {
    loadManualPairs()
      .then((map) => sendResponse({ type: "MANUAL_PAIRS", pairs: map[message.domain] || [] }))
      .catch((error) => sendResponse({ type: "ERROR", message: String(error) }));
    return true;
  }

  return false;
});
