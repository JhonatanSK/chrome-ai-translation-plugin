import { PairSuggestionRequest, PairSuggestionResult, TranslateJob, TranslateResult } from "../core/types";

export interface AiProvider {
  name: string;
  translate(job: TranslateJob): Promise<TranslateResult>;
  suggestPairs?(request: PairSuggestionRequest): Promise<PairSuggestionResult>;
}
