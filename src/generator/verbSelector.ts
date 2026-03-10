import { AnalyzedFile, CommitType } from "../types";

const TYPE_VERBS: Record<CommitType, string[]> = {
  feat: ["add", "implement", "introduce", "expose"],
  fix: ["resolve", "handle", "correct", "guard"],
  docs: ["update", "document", "clarify"],
  style: ["format", "style", "clean"],
  refactor: ["restructure", "simplify", "reorganize", "modernize"],
  perf: ["optimize", "cache", "improve", "memoize"],
  test: ["add", "update", "cover"],
  build: ["update", "configure", "adjust"],
  ci: ["add", "update", "configure"],
  chore: ["update", "maintain", "adjust", "remove"],
  revert: ["undo", "restore", "roll back"]
};

/**
 * Content-aware verb selection: inspect diff patterns to pick
 * a more precise verb than the generic type default.
 */
function contentVerb(type: CommitType, files: AnalyzedFile[]): string | null {
  const allAdded = files.every((f) => f.addedLines.length > 0 && f.status === "A");
  const allDeleted = files.every((f) => f.status === "D");

  const hasCatch = files.some((f) => f.addedLines.some((l) => /catch\s*\(/.test(l)));
  const hasGuard = files.some((f) => f.addedLines.some((l) => /\?\.|!==?\s*null|!==?\s*undefined/.test(l)));
  const hasValidation = files.some((f) => f.addedLines.some((l) => /(validate|verify|sanitize|enforce)\b/i.test(l)));
  const hasMemoize = files.some((f) => f.addedLines.some((l) => /(useMemo|useCallback|memoize|\.memo)/.test(l)));
  const hasDynImport = files.some((f) => f.addedLines.some((l) => /import\s*\(/.test(l)));
  const hasDebounce = files.some((f) => f.addedLines.some((l) => /(debounce|throttle)/.test(l)));
  const hasExpose = files.some((f) => f.addedLines.some((l) => /^\s*export\s+/.test(l)));
  const hasModernize = files.some((f) =>
    f.addedLines.some((l) => /const\s+/.test(l)) && f.removedLines.some((l) => /var\s+/.test(l))
  );

  if (type === "fix" && (hasCatch || hasGuard || hasValidation)) {
    if (hasGuard) return "guard";
    if (hasValidation) return "validate";
    return "handle";
  }
  if (type === "perf" && hasMemoize) return "memoize";
  if (type === "perf" && hasDynImport) return "lazy-load";
  if (type === "perf" && hasDebounce) return "debounce";
  if (type === "feat" && hasExpose) return "expose";
  if (type === "feat" && allAdded) return "add";
  if (type === "refactor" && hasModernize) return "modernize";
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
