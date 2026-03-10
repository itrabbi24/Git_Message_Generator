import assert from "node:assert/strict";
import test from "node:test";
import { composeBody, composeDescription } from "../src/generator/messageComposer";
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

test("composeDescription uses delete-add wording for low similarity rename", () => {
  const files = [
    createFile({
      status: "R",
      previousPath: "src/auth/legacy.ts",
      path: "src/auth/new-auth.ts",
      renameSimilarity: 30
    })
  ];
  const description = composeDescription(files, "refactor", "auth");
  assert.equal(description, "remove legacy.ts and add new-auth.ts");
});

test("composeDescription summarizes many files", () => {
  const files: AnalyzedFile[] = [];
  for (let i = 0; i < 21; i += 1) {
    files.push(createFile({ path: `src/feature/f${i}.ts` }));
  }
  const description = composeDescription(files, "feat", null);
  assert.equal(description, "implement multiple modules");
});

test("composeDescription is conservative on low confidence", () => {
  const files = [
    createFile({ path: "src/auth/login.ts" }),
    createFile({ path: "src/payments/charge.ts" }),
    createFile({ path: "src/orders/create.ts" }),
    createFile({ path: "src/profile/view.ts" })
  ];
  const description = composeDescription(files, "feat", null, { confidence: 0.3 });
  assert.equal(description, "update core modules");
});

test("composeDescription falls back to core modules for multi-scope commits", () => {
  const files = [
    createFile({ path: "src/auth/login.ts" }),
    createFile({ path: "src/payments/charge.ts" }),
    createFile({ path: "docs/setup.md" }),
    createFile({ path: "scripts/release.ts" })
  ];
  const description = composeDescription(files, "feat", null);
  assert.equal(description, "implement core modules");
});

test("composeBody compacts contexts and caps line count", () => {
  const files = [
    createFile({
      path: "src/a.ts",
      functionContexts: ["saveUser", "saveUser", "validateUser", "formatUser"]
    }),
    createFile({ path: "src/b.ts", functionContexts: ["doOne"] }),
    createFile({ path: "src/c.ts" }),
    createFile({ path: "src/d.ts" })
  ];

  const body = composeBody(files, "feat", { maxLines: 3, maxContextsPerFile: 2 });
  const lines = body.split("\n");
  assert.equal(lines.length, 4);
  assert.equal(lines[0], "- add a.ts: saveUser, validateUser");
  assert.equal(lines[3], "- and 1 more file");
});

test("composeBody drops contexts for low confidence", () => {
  const files = [createFile({ path: "src/a.ts", functionContexts: ["saveUser"] })];
  const body = composeBody(files, "feat", { confidence: 0.2 });
  assert.equal(body, "- update a.ts");
});
