import * as vscode from "vscode";
import { CommitType } from "../types";

const COMMIT_TYPES: ReadonlySet<CommitType> = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert"
]);

const ANALYSIS_PROFILES = new Set(["balanced", "frontend", "backend", "infra"] as const);
const MESSAGE_STYLES = new Set(["concise", "balanced", "verbose"] as const);

export type AnalysisProfile = "balanced" | "frontend" | "backend" | "infra";
export type MessageStyle = "concise" | "balanced" | "verbose";

export interface CommitGenConfig {
  maxHeaderLength: number;
  maxAnalyzedLinesPerFile: number;
  maxContextsPerFile: number;
  maxRawDiffChars: number;
  bodyMaxLines: number;
  bodyMaxContextsPerFile: number;
  debugTelemetry: boolean;
  profile: AnalysisProfile;
  messageStyle: MessageStyle;
  scopeMapping: Record<string, string>;
  typeOverrides: Record<string, CommitType>;
  showConfidence: boolean;
  includeWorkingTreeWhenNoStaged: boolean;
  includeBody: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeScopeMapping(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) {
    return {};
  }

  const normalized: Record<string, string> = {};
  for (const [prefix, scope] of Object.entries(raw)) {
    if (typeof prefix !== "string" || typeof scope !== "string") {
      continue;
    }
    const cleanPrefix = prefix.trim();
    const cleanScope = scope.trim().toLowerCase();
    // Ignore blank or malformed entries instead of throwing; settings stay resilient.
    if (!cleanPrefix || !cleanScope) {
      continue;
    }
    normalized[cleanPrefix] = cleanScope;
  }
  return normalized;
}

function normalizeTypeOverrides(raw: unknown): Record<string, CommitType> {
  if (!isRecord(raw)) {
    return {};
  }

  const normalized: Record<string, CommitType> = {};
  for (const [prefix, type] of Object.entries(raw)) {
    if (typeof prefix !== "string" || typeof type !== "string") {
      continue;
    }
    const cleanPrefix = prefix.trim();
    const cleanType = type.trim() as CommitType;
    // Only keep valid Conventional Commit types to avoid runtime misclassification.
    if (!cleanPrefix || !COMMIT_TYPES.has(cleanType)) {
      continue;
    }
    normalized[cleanPrefix] = cleanType;
  }
  return normalized;
}

function normalizeProfile(value: unknown): AnalysisProfile {
  if (typeof value !== "string") {
    return "balanced";
  }
  const normalized = value.trim().toLowerCase() as AnalysisProfile;
  return ANALYSIS_PROFILES.has(normalized) ? normalized : "balanced";
}

function normalizeMessageStyle(value: unknown): MessageStyle {
  if (typeof value !== "string") {
    return "balanced";
  }
  const normalized = value.trim().toLowerCase() as MessageStyle;
  return MESSAGE_STYLES.has(normalized) ? normalized : "balanced";
}

export function getCommitGenConfig(): CommitGenConfig {
  const config = vscode.workspace.getConfiguration("commitGen");
  const maxAnalyzedLinesPerFile = Math.max(100, config.get<number>("maxAnalyzedLinesPerFile", 1200));
  const maxContextsPerFile = Math.max(1, config.get<number>("maxContextsPerFile", 12));
  const maxRawDiffChars = Math.max(50_000, config.get<number>("maxRawDiffChars", 400_000));
  const bodyMaxLines = Math.max(3, config.get<number>("bodyMaxLines", 12));
  const bodyMaxContextsPerFile = Math.max(1, config.get<number>("bodyMaxContextsPerFile", 2));

  return {
    maxHeaderLength: config.get<number>("maxHeaderLength", 72),
    maxAnalyzedLinesPerFile,
    maxContextsPerFile,
    maxRawDiffChars,
    bodyMaxLines,
    bodyMaxContextsPerFile,
    debugTelemetry: config.get<boolean>("debugTelemetry", false),
    profile: normalizeProfile(config.get("profile", "balanced")),
    messageStyle: normalizeMessageStyle(config.get("messageStyle", "balanced")),
    scopeMapping: normalizeScopeMapping(config.get("scopeMapping", {})),
    typeOverrides: normalizeTypeOverrides(config.get("typeOverrides", {})),
    showConfidence: config.get<boolean>("showConfidence", true),
    includeWorkingTreeWhenNoStaged: config.get<boolean>("includeWorkingTreeWhenNoStaged", true),
    includeBody: config.get<boolean>("includeBody", true)
  };
}
