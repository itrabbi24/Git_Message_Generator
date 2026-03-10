import parseDiff from "parse-diff";
import { AnalyzedFile, Signal } from "../types";
import {
  FEAT_PATTERNS,
  FIX_PATTERNS,
  PERF_PATTERNS,
  REFACTOR_PATTERNS,
  SECURITY_PATTERNS,
  TEST_PATTERNS,
  isBinaryFile,
  isDependencyFile,
  isLockFile,
  isMigrationFile,
  isSourceCodeFile
} from "../utils/patterns";

// Full analysis: no hard line or size limits as requested by user.

const IDENTIFIER_PATTERNS = [
  /^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/, // JS/TS function
  /^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/,           // JS/TS class
  /^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/, // Arrow function
  /^def\s+([a-zA-Z0-9_$]+)\(/,                        // Python function
  /^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_$]+)\(/        // Go function
];

type DiffFile = ReturnType<typeof parseDiff>[number];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function toSignals(lines: string[], patterns: RegExp[], type: Signal["type"], weight: number, reason: string): Signal[] {
  const matched = patterns.filter((pattern) => lines.some((line) => pattern.test(line)));
  return matched.map(() => ({ type, source: "diff_content", weight, reason }));
}

function extractContexts(file: DiffFile, addedLines: string[]): string[] {
  const contexts = new Set<string>();

  // Layer 1: Extract from @@ headers (Git's built-in heuristic)
  for (const chunk of (file.chunks ?? [])) {
    const match = chunk.content.match(/@@ .+ @@\s*(.+)/);
    if (match?.[1]) {
      contexts.add(match[1].trim());
    }
  }

  // Layer 2: Extract specific identifiers from added lines
  for (const line of addedLines) {
    const trimmed = line.trim();
    for (const pattern of IDENTIFIER_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        contexts.add(match[1]);
        break;
      }
    }
  }

  return [...contexts];
}

function normalizeDiffPath(value?: string): string {
  if (!value) {
    return "";
  }
  return normalizePath(value).replace(/^a\//, "").replace(/^b\//, "").replace(/^\/dev\/null$/, "");
}

function resolveFileIdentity(file: DiffFile): { path: string; previousPath?: string; status: AnalyzedFile["status"] } {
  const fromPath = normalizeDiffPath(file.from);
  const toPath = normalizeDiffPath(file.to);

  if (!fromPath && toPath) {
    return { path: toPath, status: "A" };
  }
  if (!toPath && fromPath) {
    return { path: fromPath, status: "D" };
  }
  if (fromPath && toPath && fromPath !== toPath) {
    return { path: toPath, previousPath: fromPath, status: "R" };
  }
  return { path: toPath || fromPath || "unknown", status: "M" };
}

function extractAddedRemovedLines(file: DiffFile): { addedLines: string[]; removedLines: string[] } {
  const addedLines: string[] = [];
  const removedLines: string[] = [];

  for (const chunk of file.chunks ?? []) {
    for (const change of chunk.changes ?? []) {
      const content = change.content ?? "";
      if (content.startsWith("+")) {
        addedLines.push(content.slice(1));
      } else if (content.startsWith("-")) {
        removedLines.push(content.slice(1));
      }
    }
  }

  return { addedLines, removedLines };
}

function normalizeForStyle(value: string): string {
  return value.replace(/[\s;,'"`]+/g, "").trim();
}

function isFormatOnly(addedLines: string[], removedLines: string[]): boolean {
  if (addedLines.length + removedLines.length === 0) {
    return false;
  }

  const normalizedAdded = addedLines.map(normalizeForStyle).filter(Boolean).sort();
  const normalizedRemoved = removedLines.map(normalizeForStyle).filter(Boolean).sort();

  if (normalizedAdded.length === 0 && normalizedRemoved.length === 0) {
    return true;
  }
  if (normalizedAdded.length !== normalizedRemoved.length) {
    return false;
  }
  return normalizedAdded.every((value, index) => value === normalizedRemoved[index]);
}

function isCommentLine(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("--")
  );
}

function isCommentOnlyChange(addedLines: string[], removedLines: string[]): boolean {
  const lines = [...addedLines, ...removedLines].map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((line) => isCommentLine(line));
}

const DEPENDENCY_SECTION_PATTERN = /"(dependencies|devDependencies|peerDependencies|optionalDependencies|resolutions)"/;
const DEPENDENCY_ENTRY_PATTERN = /^\s*"(@?[\w./-]+)"\s*:\s*"/;
const VERSION_FIELD_PATTERN = /"version"\s*:\s*"/;
const SCRIPT_FIELD_PATTERN = /"scripts"\s*:/;

function dependencySignals(path: string, addedLines: string[], removedLines: string[]): Signal[] {
  if (!isDependencyFile(path)) {
    return [];
  }

  const lines = [...addedLines, ...removedLines];
  const hasDependencySection = lines.some((line) => DEPENDENCY_SECTION_PATTERN.test(line));
  const hasDependencyEntries = lines.some((line) => DEPENDENCY_ENTRY_PATTERN.test(line));
  const hasVersionOnly = lines.some((line) => VERSION_FIELD_PATTERN.test(line));
  const hasScripts = lines.some((line) => SCRIPT_FIELD_PATTERN.test(line));

  if (isLockFile(path) || hasDependencySection || hasDependencyEntries) {
    return [{ type: "build", source: "diff_content", weight: 0.88, reason: "dependencies changed" }];
  }
  if (hasScripts) {
    return [{ type: "build", source: "diff_content", weight: 0.74, reason: "build scripts changed" }];
  }
  if (hasVersionOnly) {
    return [{ type: "chore", source: "diff_content", weight: 0.82, reason: "version bump detected" }];
  }
  return [{ type: "build", source: "diff_content", weight: 0.64, reason: "dependency manifest updated" }];
}

/**
 * Extract rename similarity percentages from raw unified diff.
 * Returns a map of normalizedToPath → similarityPercent (0-100).
 */
function parseSimilarities(rawDiff: string): Map<string, number> {
  const map = new Map<string, number>();
  const regex = /similarity index (\d+)%[\r\n]+rename from (.+)[\r\n]+rename to (.+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawDiff)) !== null) {
    const similarity = parseInt(match[1], 10);
    const toPath = match[3].trim().replace(/^b\//, "").replace(/^a\//, "");
    map.set(normalizePath(toPath), similarity);
  }
  return map;
}

export function parseFiles(rawDiff: string): AnalyzedFile[] {
  if (!rawDiff || rawDiff.trim().length === 0) {
    return [];
  }
  const parsed = parseDiff(rawDiff);
  const similarities = parseSimilarities(rawDiff);
  return parsed.map((file) => {
    const identity = resolveFileIdentity(file);
    const { addedLines, removedLines } = extractAddedRemovedLines(file);
    const additions = addedLines.length;
    const deletions = removedLines.length;
    const addedPrefixed = addedLines.map((line) => `+${line}`);
    const removedPrefixed = removedLines.map((line) => `-${line}`);
    const allPrefixedLines = addedPrefixed.concat(removedPrefixed);
    const signals: Signal[] = [];

    const linesToScan = addedPrefixed;
    const allLinesToScan = allPrefixedLines;

    signals.push(...toSignals(linesToScan, FIX_PATTERNS, "fix", 0.3, "fix pattern matched"));
    signals.push(...toSignals(linesToScan, FEAT_PATTERNS, "feat", 0.25, "feature pattern matched"));
    signals.push(...toSignals(linesToScan, PERF_PATTERNS, "perf", 0.35, "performance pattern matched"));
    signals.push(...toSignals(allLinesToScan, REFACTOR_PATTERNS, "refactor", 0.35, "refactor pattern matched"));
    signals.push(...toSignals(linesToScan, TEST_PATTERNS, "test", 0.45, "test pattern matched"));
    signals.push(...toSignals(linesToScan, SECURITY_PATTERNS, "fix", 0.45, "security hardening pattern matched"));
    signals.push(...dependencySignals(identity.path, addedLines.slice(0, 100), removedLines.slice(0, 100)));

    const delta = Math.abs(additions - deletions);
    const total = Math.max(additions, deletions, 1);
    const hasNewExport = addedLines.some((line) => /^\s*(export\s+)?(async\s+)?(function|class|const)\s+/.test(line));
    if (delta / total <= 0.2 && !hasNewExport && additions > 0 && deletions > 0) {
      signals.push({
        type: "refactor",
        source: "diff_content",
        weight: 0.55,
        reason: "balanced additions and deletions"
      });
    }

    // Additions >> deletions (3:1 ratio) on source files → feat 0.40
    if (additions >= deletions * 3 + 3 && !hasNewExport) {
      signals.push({
        type: "feat",
        source: "diff_content",
        weight: 0.4,
        reason: "additions far exceed deletions (3:1 ratio)"
      });
    }

    // Mostly deletions (3:1 reverse) → chore 0.35 (cleanup/removal)
    if (deletions >= additions * 3 + 3 && !hasNewExport && deletions > 0) {
      signals.push({
        type: "chore",
        source: "diff_content",
        weight: 0.35,
        reason: "mostly removing code"
      });
    }

    if (isMigrationFile(identity.path)) {
      signals.push({
        type: "feat",
        source: "diff_content",
        weight: 0.6,
        reason: "migration content changed"
      });
    }

    if (isCommentOnlyChange(addedLines, removedLines)) {
      signals.push({
        type: "docs",
        source: "diff_content",
        weight: 0.58,
        reason: "comment-only diff detected"
      });
    }

    if (isFormatOnly(addedLines, removedLines)) {
      signals.push({
        type: "style",
        source: "diff_content",
        weight: 0.9,
        reason: "whitespace-only change"
      });
    }

    if (identity.status === "R") {
      signals.push({
        type: "refactor",
        source: "diff_content",
        weight: 0.7,
        reason: "rename detected in diff"
      });
    }

    if (identity.status === "A" && isSourceCodeFile(identity.path)) {
      signals.push({
        type: "feat",
        source: "diff_content",
        weight: 0.45,
        reason: "new source file added"
      });
    }

    const renameSimilarity = similarities.get(identity.path);

    return {
      path: identity.path,
      previousPath: identity.previousPath,
      status: identity.status,
      signals,
      additions,
      deletions,
      isBinary: isBinaryFile(identity.path) || ((file.chunks ?? []).length === 0 && addedLines.length + removedLines.length === 0),
      functionContexts: extractContexts(file, addedLines),
      addedLines,
      removedLines,
      renameSimilarity
    };
  });
}
