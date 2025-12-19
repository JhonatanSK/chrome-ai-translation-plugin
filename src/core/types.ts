export type LanguageCode = "pt" | "pt-BR" | "en" | "en-US" | string;

export type FieldKind = "input" | "textarea" | "contenteditable";

export interface FieldMeta {
  fieldId: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  kind: FieldKind;
  maxLength?: number;
  rect?: { x: number; y: number; w: number; h: number };
  langHint?: LanguageCode;
}

export interface FieldPair {
  pairId: string;
  source: FieldMeta;
  target: FieldMeta;
  score: number;
  manual?: boolean;
}

export interface TranslateJob {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  tone?: string;
  glossary?: string[];
  pairs: Array<{
    pairId: string;
    source: { fieldId: string; value: string };
    target: { fieldId: string };
    hints?: {
      label?: string;
      maxLength?: number;
    };
  }>;
}

export interface TranslateResult {
  results: Array<{ pairId: string; translated: string }>;
}

export interface StoredSettings {
  provider: "google" | "custom";
  googleApiKey?: string;
  googleModel?: string;
  customEndpoint?: string;
  customHeaders?: Record<string, string>;
  customTimeoutMs?: number;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  tone?: string;
  glossary?: string[];
  aiPairingEnabled?: boolean;
}

export interface ManualPairingMap {
  [domain: string]: Array<{ sourceId: string; targetId: string }>;
}

export interface PairSuggestionRequest {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  fields: Array<{
    fieldId: string;
    label?: string;
    placeholder?: string;
    name?: string;
    id?: string;
    kind: FieldKind;
    langHint?: LanguageCode;
  }>;
}

export interface PairSuggestionResult {
  pairs: Array<{ sourceId: string; targetId: string; confidence?: number }>;
}

export type ContentToBackgroundMessage =
  | { type: "TRANSLATE_JOB"; job: TranslateJob }
  | { type: "LOAD_SETTINGS" }
  | { type: "SAVE_MANUAL_PAIRS"; domain: string; pairs: Array<{ sourceId: string; targetId: string }> }
  | { type: "GET_MANUAL_PAIRS"; domain: string }
  | { type: "SUGGEST_PAIRS"; request: PairSuggestionRequest };

export type BackgroundToContentMessage =
  | { type: "TRANSLATE_RESULT"; result: TranslateResult }
  | { type: "SETTINGS"; settings: StoredSettings }
  | { type: "MANUAL_PAIRS"; pairs: Array<{ sourceId: string; targetId: string }> }
  | { type: "PAIR_SUGGESTIONS"; result: PairSuggestionResult }
  | { type: "ERROR"; message: string };

export type BackgroundToUiMessage =
  | { type: "SETTINGS"; settings: StoredSettings }
  | { type: "ERROR"; message: string };

export type UiToBackgroundMessage =
  | { type: "LOAD_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: StoredSettings };

export type UiToContentMessage =
  | { type: "START_DETECT" }
  | { type: "START_MANUAL_PAIR" }
  | { type: "TRANSLATE_SELECTED"; options?: Partial<StoredSettings> };

export type ContentToUiMessage =
  | { type: "DETECT_RESULT"; fields: number; pairs: number }
  | { type: "TRANSLATION_DONE"; applied: number; failed: number }
  | { type: "STATUS"; message: string };
