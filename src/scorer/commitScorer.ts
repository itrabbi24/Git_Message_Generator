import { CommitType, Signal } from "../types";
import { TYPE_PRIORITY } from "../utils/patterns";

function normalizeWeight(weight: number): number {
  if (!Number.isFinite(weight)) {
    return 0;
  }
  return Math.min(1, Math.max(0, weight));
}

export function combineScores(signals: Signal[]): Map<CommitType, number> {
  const scores = new Map<CommitType, number>();
  for (const signal of signals) {
    const current = scores.get(signal.type) ?? 0;
    // Probabilistic accumulation keeps score in [0,1] and rewards repeated evidence.
    const combined = 1 - (1 - current) * (1 - normalizeWeight(signal.weight));
    // Fixed precision avoids tiny floating differences across runtimes.
    scores.set(signal.type, Number(combined.toFixed(6)));
  }
  return scores;
}

export function resolveType(scores: Map<CommitType, number>): { type: CommitType; confidence: number } {
  if (scores.size === 0) {
    return { type: "chore", confidence: 0.2 };
  }

  const sorted = [...scores.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0]);
  });
  const [topType, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  if (topScore - secondScore < 0.1) {
    // Near ties are resolved by fixed priority for deterministic output.
    const candidates = sorted.filter(([, score]) => topScore - score < 0.1).map(([type]) => type);
    const winner = TYPE_PRIORITY.find((type) => candidates.includes(type)) ?? topType;
    return { type: winner, confidence: topScore };
  }

  return { type: topType, confidence: topScore };
}
