import { FieldMeta, FieldPair } from "../core/types";
import { pairFields } from "../core/engine";

export function autoPair(fields: FieldMeta[]): FieldPair[] {
  return pairFields(fields).pairs;
}

export function applyManualPairs(fields: FieldMeta[], manual: Array<{ sourceId: string; targetId: string }>): FieldPair[] {
  const map = new Map(fields.map((f) => [f.fieldId, f]));
  const pairs: FieldPair[] = [];
  manual.forEach((pair, index) => {
    const source = map.get(pair.sourceId);
    const target = map.get(pair.targetId);
    if (source && target) {
      pairs.push({
        pairId: `m${index}`,
        source,
        target,
        score: 1,
        manual: true
      });
    }
  });
  return pairs;
}
