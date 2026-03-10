import * as vscode from "vscode";
import { analyzeChanges } from "./analyzer/analysisPipeline";
import { getCommitGenConfig } from "./config/configuration";
import { generateFromAnalysis } from "./core/generationEngine";
import { getChangeContext } from "./git/gitService";
import { Signal } from "./types";

let telemetryChannel: vscode.OutputChannel | undefined;
let lastGenerationReport:
  | {
    message: string;
    type: string;
    scope: string | null;
    confidence: number;
    profileUsed: string;
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

  const generated = generateFromAnalysis(pipeline.files, pipeline.metadata, config);
  const result = generated.result;
  changeContext.repository.inputBox.value = result.message;
  lastGenerationReport = {
    message: result.message,
    type: result.type,
    scope: result.scope,
    confidence: result.confidence,
    profileUsed: generated.diagnostics.profileUsed,
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
      `[CommitGen] trackedLines=${pipeline.trackedDiffLines} totalLines=${pipeline.totalDiffLines} truncatedFiles=${pipeline.truncatedFiles} usedDiffFallback=${pipeline.usedDiffFallback} profile=${generated.diagnostics.profileUsed} confidence=${Math.round(
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
    `[CommitGen] type=${lastGenerationReport.type} scope=${lastGenerationReport.scope ?? "none"} profile=${lastGenerationReport.profileUsed} confidence=${Math.round(
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
