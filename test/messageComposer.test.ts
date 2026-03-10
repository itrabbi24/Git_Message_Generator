import assert from "node:assert/strict";
import test from "node:test";
import { composeDescription } from "../src/generator/messageComposer";
import { AnalyzedFile } from "../src/types";

function createFile(overrides: Partial<AnalyzedFile>): AnalyzedFile {
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

test("composeDescription returns dependency specific summary", () => {
  const files = [
    createFile({
      path: "package.json",
      addedLines: ['  "lodash": "^4.17.21"']
    })
  ];
  const description = composeDescription(files, "build", "deps");
  assert.equal(description, "update dependencies");
});

test("composeDescription prefers context for single code file", () => {
  const files = [createFile({ functionContexts: ["handleLogin"] })];
  const description = composeDescription(files, "fix", "auth");
  assert.equal(description, "resolve handleLogin");
});

test("composeDescription uses rename wording for high similarity", () => {
  const files = [
    createFile({
      status: "R",
      previousPath: "src/auth/oldName.ts",
      path: "src/auth/newName.ts",
      renameSimilarity: 98
    })
  ];
  const description = composeDescription(files, "refactor", "auth");
  assert.equal(description, "rename oldName.ts to newName.ts");
});

test("composeDescription summarizes many files", () => {
  const files: AnalyzedFile[] = [];
  for (let i = 0; i < 21; i += 1) {
    files.push(createFile({ path: `src/feature/f${i}.ts` }));
  }
  const description = composeDescription(files, "feat", null);
  assert.equal(description, "implement multiple modules");
});
