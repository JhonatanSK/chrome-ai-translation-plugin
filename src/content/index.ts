import { detectFields } from "./detect-fields";
import { renderOverlay, applyOutline, clearOutline, clearOverlay } from "./overlay-ui";
import { autoPair, applyManualPairs } from "./pairing";
import { applyTranslation } from "./apply-values";
import { showCopyFallback } from "./fallback";
import { showManualPanel, updateManualPanel, hideManualPanel } from "./manual-ui";
import {
  ContentToBackgroundMessage,
  UiToContentMessage,
  FieldMeta,
  FieldPair,
  StoredSettings,
  TranslateJob,
  PairSuggestionRequest
} from "../core/types";
import { enrichLanguageHint } from "../core/heuristics";

let registry = new Map<string, HTMLElement>();
let currentFields: FieldMeta[] = [];
let autoPairs: FieldPair[] = [];
let manualPairs: FieldPair[] = [];
let aiPairs: FieldPair[] = [];
let manualSelection: string[] = [];
let manualMode = false;
let manualListener: ((event: MouseEvent) => void) | null = null;
let overlayListener: (() => void) | null = null;

function getDomain(): string {
  return window.location.hostname;
}

function enableManualMode() {
  manualMode = true;
  manualSelection = [];
  showManualPanel("Select source field");

  manualListener = (event: MouseEvent) => {
    if (!manualMode) return;
    const target = event.target as HTMLElement | null;
    const element = target?.closest?.("[data-ai-translate-id]") as HTMLElement | null;
    if (!element) return;
    event.stopPropagation();
    event.preventDefault();
    const fieldId = element.getAttribute("data-ai-translate-id");
    if (!fieldId) return;
    manualSelection.push(fieldId);
    if (manualSelection.length === 1) {
      updateManualPanel("Select target field");
    }
    if (manualSelection.length === 2) {
      const [sourceId, targetId] = manualSelection;
      manualSelection = [];
      manualMode = false;
      disableManualMode();
      persistManualPair(sourceId, targetId);
    }
  };

  document.addEventListener("click", manualListener, true);
}

function disableManualMode() {
  if (manualListener) document.removeEventListener("click", manualListener, true);
  manualListener = null;
  hideManualPanel();
}

function persistManualPair(sourceId: string, targetId: string) {
  const pairs = manualPairs.map((pair) => ({
    sourceId: pair.source.fieldId,
    targetId: pair.target.fieldId
  }));
  pairs.push({ sourceId, targetId });

  const message: ContentToBackgroundMessage = {
    type: "SAVE_MANUAL_PAIRS",
    domain: getDomain(),
    pairs
  };

  chrome.runtime.sendMessage(message, () => {
    reloadPairs();
  });
}

function reloadPairs() {
  autoPairs = autoPair(currentFields);
  chrome.runtime.sendMessage(
    { type: "GET_MANUAL_PAIRS", domain: getDomain() } as ContentToBackgroundMessage,
    (response) => {
      if (response?.type === "MANUAL_PAIRS") {
        manualPairs = applyManualPairs(currentFields, response.pairs);
      }
    }
  );
}

async function loadAiSuggestions(settings: StoredSettings) {
  if (!settings.aiPairingEnabled) return;
  const request: PairSuggestionRequest = {
    sourceLang: settings.sourceLang,
    targetLang: settings.targetLang,
    fields: currentFields.map((field) => ({
      fieldId: field.fieldId,
      label: field.label,
      placeholder: field.placeholder,
      name: field.name,
      id: field.id,
      kind: field.kind,
      langHint: field.langHint
    }))
  };

  chrome.runtime.sendMessage({ type: "SUGGEST_PAIRS", request } as ContentToBackgroundMessage, (response) => {
    if (response?.type === "PAIR_SUGGESTIONS") {
      const map = new Map(currentFields.map((field) => [field.fieldId, field]));
      aiPairs = response.result.pairs
        .map((pair, index) => {
          const source = map.get(pair.sourceId);
          const target = map.get(pair.targetId);
          if (!source || !target) return null;
          return {
            pairId: `ai${index}`,
            source,
            target,
            score: pair.confidence ?? 0.7,
            manual: false
          } as FieldPair;
        })
        .filter(Boolean) as FieldPair[];
      chrome.runtime.sendMessage({ type: "STATUS", message: `AI suggested ${aiPairs.length} pairs` });
    }
  });
}

async function translateSelected(options?: Partial<StoredSettings>) {
  const settings = await new Promise<StoredSettings>((resolve) => {
    chrome.runtime.sendMessage({ type: "LOAD_SETTINGS" }, (response) => {
      if (response?.type === "SETTINGS") resolve(response.settings);
      else resolve({
        provider: "google",
        sourceLang: "pt-BR",
        targetLang: "en-US"
      });
    });
  });

  const merged = { ...settings, ...options };
  const pairs = dedupePairs([...manualPairs, ...autoPairs, ...aiPairs]).filter((pair) => pair.source && pair.target);
  const job: TranslateJob = {
    sourceLang: merged.sourceLang,
    targetLang: merged.targetLang,
    tone: merged.tone,
    glossary: merged.glossary,
    pairs: pairs.map((pair) => ({
      pairId: pair.pairId,
      source: { fieldId: pair.source.fieldId, value: readValue(pair.source.fieldId) },
      target: { fieldId: pair.target.fieldId },
      hints: { label: pair.source.label, maxLength: pair.target.maxLength }
    }))
  };

  chrome.runtime.sendMessage({ type: "TRANSLATE_JOB", job } as ContentToBackgroundMessage, (response) => {
    if (response?.type === "TRANSLATE_RESULT") {
      let applied = 0;
      let failed = 0;
      response.result.results.forEach((res) => {
        const pair = pairs.find((p) => p.pairId === res.pairId);
        if (!pair) return;
        const ok = applyTranslation(pair, res.translated, registry);
        if (ok) applied += 1;
        else {
          failed += 1;
          showCopyFallback(res.translated);
        }
      });
      chrome.runtime.sendMessage({ type: "STATUS", message: `Applied ${applied}, failed ${failed}` });
    } else if (response?.type === "ERROR") {
      chrome.runtime.sendMessage({ type: "STATUS", message: response.message });
    }
  });
}

function dedupePairs(pairs: FieldPair[]): FieldPair[] {
  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const key = `${pair.source.fieldId}:${pair.target.fieldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readValue(fieldId: string): string {
  const element = registry.get(fieldId);
  if (!element) return "";
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value || "";
  }
  return element.textContent || "";
}

function highlightFields() {
  registry.forEach((element) => applyOutline(element));
  refreshOverlay();
}

function clearHighlights() {
  registry.forEach((element) => clearOutline(element));
  clearOverlay();
}

function refreshOverlay() {
  const updated = currentFields.map((field) => {
    const element = registry.get(field.fieldId);
    if (!element) return field;
    const rect = element.getBoundingClientRect();
    return {
      ...field,
      rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
    };
  });
  currentFields = updated;
  renderOverlay(currentFields);
}

function bindOverlayTracking() {
  if (overlayListener) return;
  let raf = 0;
  overlayListener = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      refreshOverlay();
    });
  };
  window.addEventListener("scroll", overlayListener, true);
  window.addEventListener("resize", overlayListener);
}

function unbindOverlayTracking() {
  if (!overlayListener) return;
  window.removeEventListener("scroll", overlayListener, true);
  window.removeEventListener("resize", overlayListener);
  overlayListener = null;
}

chrome.runtime.onMessage.addListener((message: UiToContentMessage, _sender, sendResponse) => {
  console.debug("[content] Received message", message);
  if (message.type === "START_DETECT") {
    const { fields, map } = detectFields();
    registry = map;
    currentFields = fields.map(enrichLanguageHint);
    aiPairs = [];
    reloadPairs();
    highlightFields();
    bindOverlayTracking();
    console.debug("[content] Detected fields", currentFields.length);
    chrome.runtime.sendMessage({ type: "LOAD_SETTINGS" }, (response) => {
      console.debug("[content] LOAD_SETTINGS response", response);
      if (response?.type === "SETTINGS") loadAiSuggestions(response.settings);
    });
    sendResponse({ type: "DETECT_RESULT", fields: fields.length, pairs: autoPairs.length });
    return true;
  }

  if (message.type === "START_MANUAL_PAIR") {
    console.debug("[content] Manual pairing enabled");
    enableManualMode();
    sendResponse({ type: "STATUS", message: "Manual pairing enabled" });
    return true;
  }

  if (message.type === "TRANSLATE_SELECTED") {
    console.debug("[content] Translate requested");
    translateSelected(message.options).catch(() => undefined);
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

window.addEventListener("beforeunload", () => {
  clearHighlights();
  unbindOverlayTracking();
});

window.addEventListener("ai-translate-manual-cancel", () => {
  manualMode = false;
  disableManualMode();
});
