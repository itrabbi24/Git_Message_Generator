import * as path from "path";
import * as vscode from "vscode";
import { analyzeChanges } from "./analyzer/analysisPipeline";
import { defaultSourceType } from "./analyzer/fileClassifier";
import { detectScope } from "./analyzer/scopeResolver";
import { getCommitGenConfig } from "./config/configuration";
import { buildMessage, composeBody, composeDescription } from "./generator/messageComposer";
import { getChangeContext } from "./git/gitService";
import { combineScores, resolveType } from "./scorer/commitScorer";
import { AnalyzedFile, GenerationResult, MetadataResult, Signal } from "./types";

let telemetryChannel: vscode.OutputChannel | undefined;
let lastGenerationReport:
  | {
    message: string;
    type: string;
    scope: string | null;
    confidence: number;
    signals: Signal[];
    usedDiffFallback: boolean;
  }
  | undefined;

function getTelemetryChannel(): vscode.OutputChannel {
  if (!telemetryChannel) {
    telemetryChannel = vscode.window.createOutputChannel("CommitGen");
  }
  return telemetryChannel;
}

function summarizeTopSignals(signals: Signal[], limit = 7): string[] {
  return [...signals]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((signal) => `${signal.type.padEnd(8)} w=${signal.weight.toFixed(3)} source=${signal.source} :: ${signal.reason}`);
}

function mergeSignals(files: AnalyzedFile[], metadata: MetadataResult, config: ReturnType<typeof getCommitGenConfig>): GenerationResult {
  const allSignals = files.flatMap((file) => file.signals).concat(metadata.signals);
  if (allSignals.length === 0) {
    allSignals.push({
      type: defaultSourceType(),
      source: "metadata",
      weight: 0.4,
      reason: "default source classification"
    });
  }

  const scores = combineScores(allSignals, config.profile);
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

  const description = composeDescription(files, resolved.type, scope, {
    confidence: resolved.confidence,
    style: config.messageStyle
  });

  let body: string | undefined;
  if (config.includeBody && files.length > 0) {
    body = composeBody(files, resolved.type, {
      maxLines: config.bodyMaxLines,
      maxContextsPerFile: config.bodyMaxContextsPerFile,
      confidence: resolved.confidence,
      style: config.messageStyle
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

  const pipeline = analyzeChanges({
    rootPath: changeContext.repository.rootUri.fsPath,
    changes: changeContext.changes,
    rawDiff: changeContext.rawDiff,
    config
  });

  const result = mergeSignals(pipeline.files, pipeline.metadata, config);
  changeContext.repository.inputBox.value = result.message;
  lastGenerationReport = {
    message: result.message,
    type: result.type,
    scope: result.scope,
    confidence: result.confidence,
    signals: result.signals,
    usedDiffFallback: pipeline.usedDiffFallback
  };

  if (config.debugTelemetry) {
    // Output channel telemetry stays local and helps tune caps for large repositories.
    const channel = getTelemetryChannel();
    channel.appendLine(
      `[CommitGen] source=${changeContext.source} files=${pipeline.files.length} parseMs=${pipeline.parseMs} totalMs=${Date.now() - telemetryStart}`
    );
    channel.appendLine(
      `[CommitGen] trackedLines=${pipeline.trackedDiffLines} totalLines=${pipeline.totalDiffLines} truncatedFiles=${pipeline.truncatedFiles} usedDiffFallback=${pipeline.usedDiffFallback} confidence=${Math.round(
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

function explainLastGeneration(): void {
  if (!lastGenerationReport) {
    vscode.window.showInformationMessage("No generated commit message found in this session yet.");
    return;
  }

  const channel = getTelemetryChannel();
  channel.appendLine("[CommitGen] ---- Explain Last Generation ----");
  channel.appendLine(`[CommitGen] message=${lastGenerationReport.message}`);
  channel.appendLine(
    `[CommitGen] type=${lastGenerationReport.type} scope=${lastGenerationReport.scope ?? "none"} confidence=${Math.round(
      lastGenerationReport.confidence * 100
    )}% usedDiffFallback=${lastGenerationReport.usedDiffFallback}`
  );
  for (const line of summarizeTopSignals(lastGenerationReport.signals)) {
    channel.appendLine(`[CommitGen] ${line}`);
  }
  channel.show(true);
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
  context.subscriptions.push(
    vscode.commands.registerCommand("commitGen.explainLast", () => {
      explainLastGeneration();
    })
  );
}

export function deactivate(): void {
  telemetryChannel?.dispose();
  telemetryChannel = undefined;
  lastGenerationReport = undefined;
}
