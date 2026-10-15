/**
 * Temporary source of the weekly question. Will be replaced by the Notion «Банк питань»
 * (status «Затверджено», not used yet).
 */
export const FALLBACK_QUESTION = 'З ким із колишніх колег ти без вагань працював би ще раз?';

export function getQuestionForWeek(): string {
  return FALLBACK_QUESTION;
}
