import * as vscode from "vscode";
import * as path from "path";
import { classifyByPath, defaultSourceType } from "./analyzer/fileClassifier";
import { parseFiles } from "./analyzer/diffAnalyzer";
import { analyzeMetadata } from "./analyzer/metadataAnalyzer";
import { detectScope } from "./analyzer/scopeResolver";
import { getCommitGenConfig } from "./config/configuration";
import { buildMessage, composeBody, composeDescription } from "./generator/messageComposer";
import { Status } from "./git/git";
import { getChangeContext } from "./git/gitService";
import { combineScores, resolveType } from "./scorer/commitScorer";
import { AnalyzedFile, FileStatus, GenerationResult, MetadataResult } from "./types";

let telemetryChannel: vscode.OutputChannel | undefined;

function getTelemetryChannel(): vscode.OutputChannel {
  if (!telemetryChannel) {
    telemetryChannel = vscode.window.createOutputChannel("CommitGen");
  }
  return telemetryChannel;
}

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

function mergeSignals(files: AnalyzedFile[], metadata: MetadataResult): GenerationResult {
  const allSignals = files.flatMap((file) => file.signals).concat(metadata.signals);
  if (allSignals.length === 0) {
    allSignals.push({
      type: defaultSourceType(),
      source: "metadata",
      weight: 0.4,
      reason: "default source classification"
    });
  }

  const scores = combineScores(allSignals);
  const resolved = resolveType(scores);
  let scope = detectScope(
    files.map((file) => file.path),
    metadata.isDepsOnly
  );

  if (!scope && files.length === 1 && !files[0].isBinary) {
    // Single-file fallback keeps headers specific even when directory scope is absent.
    const filename = path.posix.basename(files[0].path);
    const dot = filename.lastIndexOf(".");
    scope = dot > 0 ? filename.slice(0, dot) : filename;
  }

  const config = getCommitGenConfig();
  const description = composeDescription(files, resolved.type, scope);

  let body: string | undefined;
  if (config.includeBody && files.length > 0) {
    body = composeBody(files, resolved.type, {
      maxLines: config.bodyMaxLines,
      maxContextsPerFile: config.bodyMaxContextsPerFile
    });
  }

  const message = buildMessage(resolved.type, scope, description, config.maxHeaderLength, body);

  return {
    message,
    type: resolved.type,
    scope,
    confidence: resolved.confidence,
    signals: allSignals
  };
}

async function generateCommitMessage(): Promise<void> {
  const config = getCommitGenConfig();
  const telemetryStart = Date.now();
  const changeContext = await getChangeContext(config.includeWorkingTreeWhenNoStaged);
  if (!changeContext) {
    vscode.window.showErrorMessage("Git repository not available.");
    return;
  }

  const existingMessage = changeContext.repository.inputBox.value ?? "";
  if (existingMessage.startsWith("Merge ") || existingMessage.startsWith('Revert "')) {
    vscode.window.showInformationMessage("Merge/revert commit detected - keeping existing message.");
    return;
  }

  if (changeContext.changes.length === 0) {
    vscode.window.showInformationMessage("No staged or unstaged changes found. Stage some files and try again.");
    return;
  }

  const parseStart = Date.now();
  const parsedFiles = parseFiles(changeContext.rawDiff, {
    maxLinesPerFile: config.maxAnalyzedLinesPerFile,
    maxContextsPerFile: config.maxContextsPerFile
  });
  const parseMs = Date.now() - parseStart;
  const fileMap = new Map(parsedFiles.map((file) => [file.path, file] as const));

  const analyzedFiles: AnalyzedFile[] = changeContext.changes.map((change) => {
    const rootPath = changeContext.repository.rootUri.fsPath;
    const relativePath = normalizeRepoRelative(rootPath, change.uri);
    const status = statusToLetter(change.status);
    const renameReference = change.renameUri ?? change.originalUri;
    const previousPath =
      status === "R" && renameReference ? normalizeRepoRelative(rootPath, renameReference) : undefined;
    const existing =
      fileMap.get(relativePath) ??
      (previousPath
        ? fileMap.get(previousPath)
        : undefined) ?? {
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

    // Reconcile Git API change list with parsed diff, with safe defaults if parser lacks entry.
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

  const metadata = analyzeMetadata(changeContext.changes, analyzedFiles);
  const result = mergeSignals(analyzedFiles, metadata);
  changeContext.repository.inputBox.value = result.message;

  if (config.debugTelemetry) {
    const trackedDiffLines = analyzedFiles.reduce(
      (sum, file) => sum + file.addedLines.length + file.removedLines.length,
      0
    );
    const totalDiffLines = analyzedFiles.reduce((sum, file) => sum + file.additions + file.deletions, 0);
    const truncatedFiles = analyzedFiles.filter(
      (file) => file.additions + file.deletions > file.addedLines.length + file.removedLines.length
    ).length;

    // Output channel telemetry stays local and helps tune caps for large repositories.
    const channel = getTelemetryChannel();
    channel.appendLine(
      `[CommitGen] source=${changeContext.source} files=${analyzedFiles.length} parseMs=${parseMs} totalMs=${Date.now() - telemetryStart}`
    );
    channel.appendLine(
      `[CommitGen] trackedLines=${trackedDiffLines} totalLines=${totalDiffLines} truncatedFiles=${truncatedFiles} confidence=${Math.round(
        result.confidence * 100
      )}% type=${result.type} scope=${result.scope ?? "none"}`
    );
  }

  if (config.showConfidence) {
    const percent = Math.round(result.confidence * 100);
    const sourceLabel = changeContext.source === "workingTree" ? " (unstaged)" : "";

    if (result.confidence >= 0.8) {
      return;
    }
    if (result.confidence >= 0.5) {
      vscode.window.showInformationMessage(`Generated${sourceLabel}: ${result.message} (${percent}% confidence)`);
    } else {
      vscode.window.showWarningMessage(
        `Low confidence (${percent}%) - generated: ${result.message}. Please review before committing.`
      );
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("commitGen.generate", async () => {
      try {
        await generateCommitMessage();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Commit message generation failed: ${message}`);
      }
    })
  );
}

export function deactivate(): void {
  telemetryChannel?.dispose();
  telemetryChannel = undefined;
}
