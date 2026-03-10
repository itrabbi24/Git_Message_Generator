import * as path from "path";
import type { AnalysisProfile, CommitGenConfig } from "../config/configuration";
import { detectScopeFromPaths } from "../analyzer/scopeCore";
import { buildMessage, composeBody, composeDescription } from "../generator/messageComposer";
import { combineScores, resolveType } from "../scorer/commitScorer";
import { AnalyzedFile, GenerationResult, MetadataResult, Signal } from "../types";
import { detectProfileFromFiles } from "../scorer/profileWeights";

export interface GenerationDiagnostics {
  profileUsed: AnalysisProfile;
  scores: Map<string, number>;
  topSignals: Signal[];
}

export interface GeneratedPayload {
  result: GenerationResult;
  diagnostics: GenerationDiagnostics;
}

function chooseProfile(config: CommitGenConfig, files: AnalyzedFile[]): AnalysisProfile {
  if (!config.autoDetectProfile || config.profile !== "balanced") {
    return config.profile;
  }
  return detectProfileFromFiles(files);
}

export function generateFromAnalysis(
  files: AnalyzedFile[],
  metadata: MetadataResult,
  config: CommitGenConfig
): GeneratedPayload {
  const allSignals = files.flatMap((file) => file.signals).concat(metadata.signals);
  if (allSignals.length === 0) {
    allSignals.push({
      type: "feat",
      source: "metadata",
      weight: 0.4,
      reason: "default source classification"
    });
  }

  const profileUsed = chooseProfile(config, files);
  const scores = combineScores(allSignals, profileUsed);
  const resolved = resolveType(scores);

  let scope = detectScopeFromPaths(
    files.map((file) => file.path),
    {
      isDepsOnly: metadata.isDepsOnly,
      scopeMapping: config.scopeMapping
    }
  );

  if (!scope && files.length === 1 && !files[0].isBinary) {
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
      style: config.messageStyle,
      groupByModule: config.groupBodyByModule
    });
  }

  const message = buildMessage(resolved.type, scope, description, config.maxHeaderLength, body);
  const result: GenerationResult = {
    message,
    type: resolved.type,
    scope,
    confidence: resolved.confidence,
    signals: allSignals
  };

  return {
    result,
    diagnostics: {
      profileUsed,
      scores: new Map<string, number>(scores as unknown as Map<string, number>),
      topSignals: [...allSignals].sort((a, b) => b.weight - a.weight).slice(0, 7)
    }
  };
}
