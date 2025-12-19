import { FieldMeta, FieldPair } from "./types";
import { enrichLanguageHint, scorePair } from "./heuristics";

let pairCounter = 0;

export function pairFields(fields: FieldMeta[], scoreThreshold = 0.55): {
  pairs: FieldPair[];
  unpaired: FieldMeta[];
} {
  const enriched = fields.map(enrichLanguageHint);
  const used = new Set<string>();
  const pairs: FieldPair[] = [];

  for (const source of enriched) {
    if (used.has(source.fieldId)) continue;
    let best: { target: FieldMeta; score: number } | null = null;
    for (const target of enriched) {
      if (source.fieldId === target.fieldId) continue;
      if (used.has(target.fieldId)) continue;
      if (source.langHint && target.langHint && source.langHint === target.langHint) continue;
      const score = scorePair(source, target);
      if (!best || score > best.score) best = { target, score };
    }
    if (best && best.score >= scoreThreshold) {
      used.add(source.fieldId);
      used.add(best.target.fieldId);
      pairs.push({
        pairId: `p${pairCounter++}`,
        source,
        target: best.target,
        score: best.score
      });
    }
  }

  const unpaired = enriched.filter((field) => !used.has(field.fieldId));
  return { pairs, unpaired };
}
