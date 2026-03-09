import parseDiff from "parse-diff";
import { AnalyzedFile, Signal } from "../types";
import { BINARY_EXTENSIONS, FEAT_PATTERNS, FIX_PATTERNS, PERF_PATTERNS } from "../utils/patterns";

type DiffFile = ReturnType<typeof parseDiff>[number];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function toSignals(lines: string[], patterns: RegExp[], type: Signal["type"], weight: number, reason: string): Signal[] {
  const matched = patterns.filter((pattern) => lines.some((line) => pattern.test(line)));
  return matched.map(() => ({ type, source: "diff_content", weight, reason }));
}

function isWhitespaceOnly(lines: string[]): boolean {
  return lines.every((line) => {
    if (!/^[+-]/.test(line)) {
      return true;
    }
    const normalized = line
      .slice(1)
      .replace(/[\s;,'"`]+/g, "")
      .trim();
    return normalized.length === 0;
  });
}

function extractContexts(file: DiffFile): string[] {
  return (file.chunks ?? [])
    .map((chunk) => chunk.content.match(/@@ .+ @@\s*(.+)/)?.[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function countLineKinds(lines: string[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.startsWith("+")) {
      additions += 1;
    } else if (line.startsWith("-")) {
      deletions += 1;
    }
  }
  return { additions, deletions };
}

function isBinaryPath(path: string): boolean {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 && BINARY_EXTENSIONS.has(lower.slice(dot));
}

export function parseFiles(rawDiff: string): AnalyzedFile[] {
  const parsed = parseDiff(rawDiff);
  return parsed.map((file) => {
    const normalizedPath = normalizePath(file.to ?? file.from ?? "unknown");
    const lines = (file.chunks ?? []).flatMap((chunk) => (chunk.changes ?? []).map((change) => change.content));
    const { additions, deletions } = countLineKinds(lines);
    const signals: Signal[] = [];

    signals.push(...toSignals(lines, FIX_PATTERNS, "fix", 0.3, "fix pattern matched"));
    signals.push(...toSignals(lines, FEAT_PATTERNS, "feat", 0.25, "feature pattern matched"));
    signals.push(...toSignals(lines, PERF_PATTERNS, "perf", 0.35, "performance pattern matched"));

    const delta = Math.abs(additions - deletions);
    const total = Math.max(additions, deletions, 1);
    const hasNewExport = lines.some((line) => /^\+\s*(export\s+)?(async\s+)?(function|class|const)\s+/.test(line));
    if (delta / total <= 0.2 && !hasNewExport && additions > 0 && deletions > 0) {
      signals.push({
        type: "refactor",
        source: "diff_content",
        weight: 0.55,
        reason: "balanced additions and deletions"
      });
    }

    if (lines.length > 0 && isWhitespaceOnly(lines)) {
      signals.push({
        type: "style",
        source: "diff_content",
        weight: 0.9,
        reason: "whitespace-only change"
      });
    }

    return {
      path: normalizedPath.replace(/^b\//, "").replace(/^a\//, ""),
      status: "M",
      signals,
      additions,
      deletions,
      isBinary: isBinaryPath(normalizedPath) || rawDiff.includes("Binary files"),
      functionContexts: extractContexts(file)
    };
  });
}
