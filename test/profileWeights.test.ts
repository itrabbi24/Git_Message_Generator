import assert from "node:assert/strict";
import test from "node:test";
import { detectProfileFromFiles } from "../src/scorer/profileWeights";
import { AnalyzedFile } from "../src/types";

function file(path: string): AnalyzedFile {
  return {
    path,
    status: "M",
    signals: [],
    additions: 0,
    deletions: 0,
    isBinary: false,
    functionContexts: [],
    addedLines: [],
    removedLines: []
  };
}

test("detectProfileFromFiles returns frontend for ui-heavy changes", () => {
  const profile = detectProfileFromFiles([file("src/components/Button.tsx"), file("src/styles/app.scss")]);
  assert.equal(profile, "frontend");
});

test("detectProfileFromFiles returns infra for workflow changes", () => {
  const profile = detectProfileFromFiles([file(".github/workflows/ci.yml"), file("Dockerfile")]);
  assert.equal(profile, "infra");
});
