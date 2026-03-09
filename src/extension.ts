import * as vscode from "vscode";
import { classifyByPath, defaultSourceType } from "./analyzer/fileClassifier";
import { parseFiles } from "./analyzer/diffAnalyzer";
import { analyzeMetadata } from "./analyzer/metadataAnalyzer";
import { detectScope } from "./analyzer/scopeResolver";
import { getCommitGenConfig } from "./config/configuration";
import { buildMessage, composeDescription } from "./generator/messageComposer";
import { getStagedContext } from "./git/gitService";
import { combineScores, resolveType } from "./scorer/commitScorer";
import { AnalyzedFile, GenerationResult, Signal } from "./types";

function normalizeRepoRelative(rootPath: string, filePath: vscode.Uri): string {
  return vscode.workspace.asRelativePath(filePath, false).replace(/\\/g, "/").replace(`${rootPath}/`, "");
}

function statusToLetter(status: number): string {
  switch (status) {
    case 1:
    case 9:
      return "A";
    case 2:
      return "D";
    case 3:
    case 10:
      return "R";
    default:
      return "M";
  }
}

function mergeSignals(files: AnalyzedFile[], metadataSignals: Signal[]): GenerationResult {
  const allSignals = files.flatMap((file) => file.signals).concat(metadataSignals);
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
  const scope = detectScope(files.map((file) => file.path));
  const config = getCommitGenConfig();
  const description = composeDescription(files, resolved.type, scope);
  const message = buildMessage(resolved.type, scope, description, config.maxHeaderLength);

  return {
    message,
    type: resolved.type,
    scope,
    confidence: resolved.confidence,
    signals: allSignals
  };
}

async function generateCommitMessage(): Promise<void> {
  const staged = await getStagedContext();
  if (!staged) {
    vscode.window.showErrorMessage("Git repository not available.");
    return;
  }

  if (staged.stagedChanges.length === 0) {
    vscode.window.showInformationMessage("No staged changes found.");
    return;
  }

  const parsedFiles = parseFiles(staged.rawDiff);
  const fileMap = new Map(parsedFiles.map((file) => [file.path, file]));

  const analyzedFiles: AnalyzedFile[] = staged.stagedChanges.map((change) => {
    const relativePath = normalizeRepoRelative(staged.repository.rootUri.fsPath, change.uri);
    const existing = fileMap.get(relativePath) ?? {
      path: relativePath,
      status: statusToLetter(change.status),
      signals: [],
      additions: 0,
      deletions: 0,
      isBinary: false,
      functionContexts: []
    };

    const pathSignal = classifyByPath(relativePath);
    const signals = [...existing.signals];
    if (pathSignal) {
      signals.push(pathSignal);
    }

    return {
      ...existing,
      status: statusToLetter(change.status),
      signals
    };
  });

  const result = mergeSignals(analyzedFiles, analyzeMetadata(staged.stagedChanges));
  staged.repository.inputBox.value = result.message;

  const config = getCommitGenConfig();
  if (config.showConfidence) {
    const percent = Math.round(result.confidence * 100);
    vscode.window.showInformationMessage(`Generated ${result.message} (${percent}% confidence)`);
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

export function deactivate(): void {}
