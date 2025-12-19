import { FieldMeta } from "./types";
import { detectLanguageHint, normalizeLabel } from "./language";

function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aParts = new Set(a.split(" "));
  const bParts = new Set(b.split(" "));
  let shared = 0;
  for (const part of aParts) {
    if (bParts.has(part)) shared += 1;
  }
  const max = Math.max(aParts.size, bParts.size);
  return max === 0 ? 0 : shared / max;
}

function proximityScore(a?: FieldMeta["rect"], b?: FieldMeta["rect"]): number {
  if (!a || !b) return 0;
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  const dist = Math.hypot(ax - bx, ay - by);
  if (dist <= 40) return 1;
  if (dist <= 120) return 0.7;
  if (dist <= 300) return 0.4;
  return 0.1;
}

export function enrichLanguageHint(field: FieldMeta): FieldMeta {
  const candidates = [field.label, field.placeholder, field.name, field.id];
  for (const text of candidates) {
    const hint = detectLanguageHint(text);
    if (hint) return { ...field, langHint: hint };
  }
  return field;
}

export function scorePair(source: FieldMeta, target: FieldMeta): number {
  const labelScore = textSimilarity(
    normalizeLabel(source.label || source.name || ""),
    normalizeLabel(target.label || target.name || "")
  );
  const nameScore = textSimilarity(
    normalizeLabel(source.name || source.id || ""),
    normalizeLabel(target.name || target.id || "")
  );
  const placeholderScore = textSimilarity(
    normalizeLabel(source.placeholder || ""),
    normalizeLabel(target.placeholder || "")
  );
  const proximity = proximityScore(source.rect, target.rect);

  return labelScore * 0.4 + nameScore * 0.25 + placeholderScore * 0.2 + proximity * 0.15;
}
