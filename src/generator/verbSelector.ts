import { CommitType } from "../types";

const TYPE_VERBS: Record<CommitType, string[]> = {
  feat: ["add", "implement", "introduce"],
  fix: ["fix", "resolve", "handle"],
  docs: ["update", "document", "clarify"],
  style: ["format", "style", "clean"],
  refactor: ["refactor", "restructure", "simplify"],
  perf: ["optimize", "cache", "improve"],
  test: ["add", "update", "cover"],
  build: ["update", "configure", "adjust"],
  ci: ["add", "update", "configure"],
  chore: ["update", "maintain", "adjust"]
};

export function pickVerb(type: CommitType, fileCount: number): string {
  const verbs = TYPE_VERBS[type];
  if (fileCount > 3 && type === "feat") {
    return "implement";
  }
  return verbs[0];
}
