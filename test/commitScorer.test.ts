import assert from "node:assert/strict";
import test from "node:test";
import { combineScores, resolveType } from "../src/scorer/commitScorer";
import { CommitType, Signal } from "../src/types";

test("combineScores uses probabilistic accumulation", () => {
  const signals: Signal[] = [
    { type: "feat", source: "filepath", weight: 0.5, reason: "a" },
    { type: "feat", source: "metadata", weight: 0.5, reason: "b" }
  ];

  const scores = combineScores(signals);
  assert.equal(scores.get("feat"), 0.75);
});

test("resolveType uses priority when scores are close", () => {
  const scores = new Map<CommitType, number>([
    ["fix", 0.71],
    ["perf", 0.75]
  ]);

  const resolved = resolveType(scores);
  assert.equal(resolved.type, "perf");
  assert.equal(resolved.confidence, 0.75);
});

test("combineScores clamps invalid weights", () => {
  const signals: Signal[] = [
    { type: "feat", source: "filepath", weight: 5, reason: "too high" },
    { type: "feat", source: "metadata", weight: -3, reason: "too low" }
  ];

  const scores = combineScores(signals);
  assert.equal(scores.get("feat"), 1);
});
