import { AnalyzedFile, CommitType, FileStatus } from "../types";

const TYPE_VERBS: Record<CommitType, string[]> = {
  feat: ["add", "implement", "introduce"],
  fix: ["resolve", "handle", "correct"],
  docs: ["update", "document", "clarify"],
  style: ["format", "style", "clean"],
  refactor: ["restructure", "simplify", "reorganize"],
  perf: ["optimize", "cache", "improve"],
  test: ["add", "update", "cover"],
  build: ["update", "configure", "adjust"],
  ci: ["add", "update", "configure"],
  chore: ["update", "maintain", "adjust"],
  revert: ["undo", "restore", "roll back"]
};

// Maps git file status to a natural-language verb
export const STATUS_VERBS: Record<FileStatus, string> = {
  A: "add",
  M: "update",
  D: "remove",
  R: "rename",
  C: "copy"
};

/**
 * Content-aware verb selection: inspect diff patterns to pick
 * a more precise verb than the generic type default.
 */
function contentVerb(type: CommitType, files: AnalyzedFile[]): string | null {
  const allAdded = files.every((f) => f.addedLines.length > 0 && f.status === "A");
  const allDeleted = files.every((f) => f.status === "D");
  const hasCatch = files.some((f) => f.addedLines.some((l) => /catch\s*\(/.test(l)));
  const hasOptional = files.some((f) => f.addedLines.some((l) => /\?\./.test(l)));
  const hasMemoize = files.some((f) =>
    f.addedLines.some((l) => /(useMemo|useCallback|memoize|\.memo)/.test(l))
  );
  const hasDynImport = files.some((f) => f.addedLines.some((l) => /import\s*\(/.test(l)));
  const hasDebounce = files.some((f) => f.addedLines.some((l) => /(debounce|throttle)/.test(l)));

  if (type === "fix" && hasCatch) return "handle";
  if (type === "fix" && hasOptional) return "guard";
  if (type === "perf" && hasMemoize) return "memoize";
  if (type === "perf" && hasDynImport) return "lazy-load";
  if (type === "perf" && hasDebounce) return "debounce";
  if (type === "feat" && allAdded) return "add";
  if (type === "chore" && allDeleted) return "remove";
  return null;
}

export function pickVerb(type: CommitType, fileCount: number, files: AnalyzedFile[] = []): string {
  const content = contentVerb(type, files);
  if (content) {
    return content;
  }
  const verbs = TYPE_VERBS[type] ?? ["update"];
  if (fileCount > 3 && type === "feat") {
    return "implement";
  }
  return verbs[0];
}
