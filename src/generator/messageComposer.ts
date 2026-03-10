import * as path from "path";
import { AnalyzedFile, CommitType, FileStatus } from "../types";
import { isDependencyFile, isLockFile } from "../utils/patterns";
import { STATUS_VERBS } from "../utils/statusVerbs";
import { pickVerb } from "./verbSelector";

function basename(filePath: string): string {
  return path.posix.basename(filePath.replace(/\\/g, "/"));
}

function categoryNoun(type: CommitType): string {
  switch (type) {
    case "docs":
      return "documentation";
    case "test":
      return "tests";
    case "ci":
      return "workflow";
    case "build":
      return "build config";
    case "perf":
      return "performance";
    case "refactor":
      return "code";
    case "feat":
      return "features";
    case "fix":
      return "fixes";
    default:
      return "files";
  }
}

function significance(file: AnalyzedFile): number {
  if (file.status === "A") {
    return 30;
  }
  if (file.path.startsWith("src/")) {
    return 20;
  }
  if (file.path.endsWith(".md")) {
    return 5;
  }
  return 10;
}

function compactContext(raw: string): string {
  const base = raw
    .replace(/^\s*(async\s+)?function\s+/, "")
    .replace(/^\s*(const|let|var)\s+/, "")
    .replace(/\s*=>.*$/, "")
    .replace(/\(.*$/, "")
    .trim();
  return base.split(/\s+/).slice(0, 5).join(" ").trim();
}

function statusVerb(status: FileStatus, type: CommitType, fileCount: number): string {
  if (status === "A") {
    return "add";
  }
  if (status === "D") {
    return "remove";
  }
  if (status === "R") {
    return "rename";
  }
  if (status === "C") {
    return "copy";
  }
  return pickVerb(type, fileCount);
}

function hasDependencyEntryChanges(file: AnalyzedFile): boolean {
  const lines = file.addedLines.concat(file.removedLines);
  const dependencyHeader = /"(dependencies|devDependencies|peerDependencies|optionalDependencies|resolutions)"/;
  const dependencyEntry = /^\s*"(@?[\w./-]+)"\s*:\s*"(?:\^|~|>=|<=|>|<)?[\w.*-]+/;
  return lines.some((line) => dependencyHeader.test(line) || dependencyEntry.test(line));
}

function isVersionOnlyBump(file: AnalyzedFile): boolean {
  if (!/package\.json$/i.test(file.path)) {
    return false;
  }
  const lines = file.addedLines.concat(file.removedLines).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return false;
  }
  return lines.every((line) => /"version"\s*:\s*"/.test(line) || /^[{},]+$/.test(line));
}

function composeDependencyDescription(files: AnalyzedFile[]): string {
  if (files.every((file) => isVersionOnlyBump(file))) {
    return "bump package version";
  }
  if (files.some((file) => hasDependencyEntryChanges(file))) {
    return "update dependencies";
  }
  if (files.every((file) => isLockFile(file.path))) {
    return "update lock files";
  }
  return "update dependency manifests";
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function topLevelArea(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.length > 1 ? parts[0] : "root";
}

export interface ComposeDescriptionOptions {
  confidence?: number;
}

function neutralVerbForStatus(status: FileStatus): string {
  if (status === "D") {
    return "remove";
  }
  if (status === "R") {
    return "rename";
  }
  return "update";
}

export function composeDescription(
  files: AnalyzedFile[],
  commitType: CommitType,
  scope: string | null,
  options: ComposeDescriptionOptions = {}
): string {
  const confidence = options.confidence ?? 1;
  const isLowConfidence = confidence < 0.5;
  const isMediumConfidence = !isLowConfidence && confidence < 0.75;
  const ranked = [...files].sort((a, b) => significance(b) - significance(a));

  if (files.every((file) => isDependencyFile(file.path))) {
    return composeDependencyDescription(files);
  }

  if (isLowConfidence) {
    if (scope) {
      return `update ${scope} files`;
    }
    if (files.length > 3) {
      return "update core modules";
    }
    return "update changed files";
  }

  if (files.length === 1) {
    const file = ranked[0];

    // Rename: similarity-aware description (PDF spec)
    if (file.status === "R" && file.previousPath) {
      const sim = file.renameSimilarity ?? 100;
      const fromName = basename(file.previousPath);
      const toName = basename(file.path);
      if (sim >= 95) {
        return `rename ${fromName} to ${toName}`;
      }
      if (sim >= 50) {
        return `rename and update ${fromName} to ${toName}`;
      }
      return `remove ${fromName} and add ${toName}`;
    }

    const context = compactContext(file.functionContexts[0] ?? "");
    const verb = isMediumConfidence ? neutralVerbForStatus(file.status) : statusVerb(file.status, commitType, files.length);

    // Dynamic scoping: Use filename if no explicit scope but context exists
    if (!scope && context) {
      // In buildMessage, this will become type(basename): verb context
      // But for now, we just return the description part.
    }

    if (context && (commitType === "fix" || commitType === "perf" || commitType === "refactor" || commitType === "feat")) {
      return `${verb} ${context}`;
    }

    return `${verb} ${basename(file.path)}`;
  }

  if (files.length <= 3) {
    const sameStatus = ranked.every((file) => file.status === ranked[0].status);
    const verb = isMediumConfidence
      ? "update"
      : sameStatus
      ? (STATUS_VERBS[ranked[0].status] ?? pickVerb(commitType, files.length, files))
      : pickVerb(commitType, files.length, files);
    const names = unique(ranked.map((file) => basename(file.path)));
    return `${verb} ${names.join(", ")}`;
  }

  const verb = pickVerb(commitType, files.length, files);
  if (scope) {
    return `${verb} ${scope} ${categoryNoun(commitType)}`;
  }

  if (files.every((file) => file.status === "D")) {
    return `remove ${files.length} files`;
  }

  if (files.length > 20) {
    return `${verb} multiple modules`;
  }

  if (!scope && files.length >= 4) {
    const areas = unique(files.map((file) => topLevelArea(file.path)));
    if (areas.length > 1) {
      return `${verb} core modules`;
    }
  }

  return `${verb} ${files.length} changed files`;
}

export interface ComposeBodyOptions {
  maxLines?: number;
  maxContextsPerFile?: number;
  confidence?: number;
}

export function composeBody(files: AnalyzedFile[], commitType: CommitType, options: ComposeBodyOptions = {}): string {
  const maxLines = Math.max(3, options.maxLines ?? 12);
  const confidence = options.confidence ?? 1;
  const maxContextsPerFile = confidence < 0.5 ? 0 : Math.max(1, options.maxContextsPerFile ?? 2);
  const lines: string[] = [];

  for (const file of files) {
    if (lines.length >= maxLines) {
      break;
    }
    const verb = confidence < 0.5 ? neutralVerbForStatus(file.status) : statusVerb(file.status, commitType, files.length);
    const name = basename(file.path);
    // Keep body concise: dedupe noisy contexts and keep only top N tokens per file.
    const contexts =
      maxContextsPerFile > 0
        ? unique(file.functionContexts.map(compactContext).filter(Boolean)).slice(0, maxContextsPerFile)
        : [];

    if (contexts.length > 0) {
      lines.push(`- ${verb} ${name}: ${contexts.join(", ")}`);
    } else {
      lines.push(`- ${verb} ${name}`);
    }
  }

  const omitted = files.length - lines.length;
  if (omitted > 0) {
    // Preserve awareness of additional files without flooding commit body.
    lines.push(`- and ${omitted} more file${omitted === 1 ? "" : "s"}`);
  }

  return lines.join("\n");
}

export function buildMessage(type: CommitType, scope: string | null, description: string, maxLength: number, body?: string): string {
  const header = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
  const truncatedHeader = header.length <= maxLength ? header : header.slice(0, maxLength).trimEnd();

  if (body) {
    return `${truncatedHeader}\n\n${body}`;
  }
  return truncatedHeader;
}
