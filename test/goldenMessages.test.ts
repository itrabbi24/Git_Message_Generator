import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildMessage, composeDescription } from "../src/generator/messageComposer";
import { AnalyzedFile, CommitType, FileStatus } from "../src/types";

interface GoldenFile {
  path: string;
  status: FileStatus;
  previousPath?: string;
  renameSimilarity?: number;
  functionContexts?: string[];
  addedLines?: string[];
  removedLines?: string[];
}

interface GoldenCase {
  name: string;
  type: CommitType;
  scope: string | null;
  confidence: number;
  maxHeaderLength: number;
  files: GoldenFile[];
  expectedHeader: string;
}

function toAnalyzedFile(file: GoldenFile): AnalyzedFile {
  return {
    path: file.path,
    status: file.status,
    previousPath: file.previousPath,
    renameSimilarity: file.renameSimilarity,
    signals: [],
    additions: file.addedLines?.length ?? 0,
    deletions: file.removedLines?.length ?? 0,
    isBinary: false,
    functionContexts: file.functionContexts ?? [],
    addedLines: file.addedLines ?? [],
    removedLines: file.removedLines ?? []
  };
}

test("golden messages stay stable", () => {
  const fixturePath = path.join(process.cwd(), "test", "fixtures", "golden-messages.json");
  const cases = JSON.parse(readFileSync(fixturePath, "utf8")) as GoldenCase[];

  for (const scenario of cases) {
    const files = scenario.files.map(toAnalyzedFile);
    const description = composeDescription(files, scenario.type, scenario.scope, { confidence: scenario.confidence });
    const message = buildMessage(scenario.type, scenario.scope, description, scenario.maxHeaderLength);
    const header = message.split("\n")[0];
    assert.equal(header, scenario.expectedHeader, `golden mismatch: ${scenario.name}`);
  }
});
