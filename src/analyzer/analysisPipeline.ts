import * as path from "path";
import * as vscode from "vscode";
import { CommitGenConfig } from "../config/configuration";
import { Change, Status } from "../git/git";
import { parseFiles } from "./diffAnalyzer";
import { classifyByPath } from "./fileClassifier";
import { analyzeMetadata } from "./metadataAnalyzer";
import { AnalyzedFile, FileStatus, MetadataResult } from "../types";

function normalizeRepoRelative(rootPath: string, filePath: vscode.Uri): string {
  return path.relative(rootPath, filePath.fsPath).replace(/\\/g, "/");
}

function statusToLetter(status: number): FileStatus {
  switch (status) {
    case Status.INDEX_ADDED:
    case Status.INTENT_TO_ADD:
    case Status.UNTRACKED:
    case Status.ADDED_BY_US:
    case Status.ADDED_BY_THEM:
    case Status.BOTH_ADDED:
      return "A";
    case Status.INDEX_DELETED:
    case Status.DELETED:
    case Status.DELETED_BY_US:
    case Status.DELETED_BY_THEM:
    case Status.BOTH_DELETED:
      return "D";
    case Status.INDEX_RENAMED:
    case Status.INTENT_TO_RENAME:
      return "R";
    case Status.INDEX_COPIED:
      return "C";
    default:
      return "M";
  }
}

export interface AnalysisPipelineInput {
  rootPath: string;
  changes: Change[];
  rawDiff: string;
  config: CommitGenConfig;
}

export interface AnalysisPipelineResult {
  files: AnalyzedFile[];
  metadata: MetadataResult;
  parseMs: number;
  trackedDiffLines: number;
  totalDiffLines: number;
  truncatedFiles: number;
  usedDiffFallback: boolean;
}

export function analyzeChanges(input: AnalysisPipelineInput): AnalysisPipelineResult {
  const { rootPath, changes, rawDiff, config } = input;

  // For very large diffs we use path+metadata only to keep generation responsive.
  const shouldSkipDiff = rawDiff.length > config.maxRawDiffChars;
  const diffToParse = shouldSkipDiff ? "" : rawDiff;

  const parseStart = Date.now();
  const parsedFiles = parseFiles(diffToParse, {
    maxLinesPerFile: config.maxAnalyzedLinesPerFile,
    maxContextsPerFile: config.maxContextsPerFile
  });
  const parseMs = Date.now() - parseStart;
  const fileMap = new Map(parsedFiles.map((file) => [file.path, file] as const));

  const files: AnalyzedFile[] = changes.map((change) => {
    const relativePath = normalizeRepoRelative(rootPath, change.uri);
    const status = statusToLetter(change.status);
    const renameReference = change.renameUri ?? change.originalUri;
    const previousPath = status === "R" && renameReference ? normalizeRepoRelative(rootPath, renameReference) : undefined;
    const existing =
      fileMap.get(relativePath) ??
      (previousPath ? fileMap.get(previousPath) : undefined) ?? {
        path: relativePath,
        previousPath,
        status,
        signals: [],
        additions: 0,
        deletions: 0,
        isBinary: false,
        functionContexts: [],
        addedLines: [],
        removedLines: []
      };

    // Merge parser-driven signals with path classification for each Git-reported change.
    const pathSignal = classifyByPath(relativePath);
    const signals = [...existing.signals];
    if (pathSignal) {
      signals.push(pathSignal);
    }

    return {
      ...existing,
      path: relativePath,
      previousPath: existing.previousPath ?? previousPath,
      status,
      signals
    };
  });

  const metadata = analyzeMetadata(changes, files);
  const trackedDiffLines = files.reduce((sum, file) => sum + file.addedLines.length + file.removedLines.length, 0);
  const totalDiffLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  const truncatedFiles = files.filter(
    (file) => file.additions + file.deletions > file.addedLines.length + file.removedLines.length
  ).length;

  return {
    files,
    metadata,
    parseMs,
    trackedDiffLines,
    totalDiffLines,
    truncatedFiles,
    usedDiffFallback: shouldSkipDiff
  };
}
