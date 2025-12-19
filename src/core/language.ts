import { LanguageCode } from "./types";

const LANG_TOKENS: Array<{ token: string; lang: LanguageCode }> = [
  { token: "pt", lang: "pt" },
  { token: "pt-br", lang: "pt-BR" },
  { token: "portugues", lang: "pt" },
  { token: "portuguese", lang: "pt" },
  { token: "en", lang: "en" },
  { token: "en-us", lang: "en-US" },
  { token: "english", lang: "en" }
];

export function detectLanguageHint(text?: string): LanguageCode | undefined {
  if (!text) return undefined;
  const normalized = text.toLowerCase();
  for (const item of LANG_TOKENS) {
    if (normalized.includes(item.token)) return item.lang;
  }
  return undefined;
}

export function normalizeLabel(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\b(pt|pt-br|en|en-us)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
