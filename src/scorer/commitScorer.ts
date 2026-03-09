import { CommitType, Signal } from "../types";
import { TYPE_PRIORITY } from "../utils/patterns";

export function combineScores(signals: Signal[]): Map<CommitType, number> {
  const scores = new Map<CommitType, number>();
  for (const signal of signals) {
    const current = scores.get(signal.type) ?? 0;
    const combined = 1 - (1 - current) * (1 - signal.weight);
    scores.set(signal.type, combined);
  }
  return scores;
}

export function resolveType(scores: Map<CommitType, number>): { type: CommitType; confidence: number } {
  if (scores.size === 0) {
    return { type: "chore", confidence: 0.2 };
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  if (topScore - secondScore < 0.1) {
    const candidates = sorted.filter(([, score]) => topScore - score < 0.1).map(([type]) => type);
    const winner = TYPE_PRIORITY.find((type) => candidates.includes(type)) ?? topType;
    return { type: winner, confidence: topScore };
  }

  return { type: topType, confidence: topScore };
}
