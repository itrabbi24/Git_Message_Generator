import assert from "node:assert/strict";
import test from "node:test";
import { generateFromAnalysis } from "../src/core/generationEngine";
import { AnalyzedFile, MetadataResult } from "../src/types";

const baseConfig = {
  maxHeaderLength: 72,
  maxAnalyzedLinesPerFile: 1200,
  maxContextsPerFile: 12,
  maxRawDiffChars: 400000,
  bodyMaxLines: 12,
  bodyMaxContextsPerFile: 2,
  debugTelemetry: false,
  profile: "balanced" as const,
  autoDetectProfile: true,
  messageStyle: "balanced" as const,
  scopeMapping: {},
  typeOverrides: {},
  showConfidence: true,
  includeWorkingTreeWhenNoStaged: true,
  includeBody: true
};

function makeFile(overrides: Partial<AnalyzedFile>): AnalyzedFile {
  return {
    path: "src/auth/login.ts",
    status: "M",
    signals: [],
    additions: 1,
    deletions: 0,
    isBinary: false,
    functionContexts: [],
    addedLines: [],
    removedLines: [],
    ...overrides
  };
}

test("generation engine integrates scoring + scope + composer", () => {
  const files = [
    makeFile({
      path: "src/auth/login.ts",
      signals: [{ type: "fix", source: "diff_content", weight: 0.8, reason: "guard clause" }],
      functionContexts: ["handleLogin"]
    })
  ];
  const metadata: MetadataResult = { signals: [], isDepsOnly: false };

  const payload = generateFromAnalysis(files, metadata, baseConfig);
  assert.equal(payload.result.type, "fix");
  assert.equal(payload.result.scope, "auth");
  assert.ok(payload.result.message.startsWith("fix(auth):"));
  assert.ok(payload.result.message.includes("handleLogin"));
});
