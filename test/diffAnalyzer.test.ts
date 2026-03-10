import assert from "node:assert/strict";
import test from "node:test";
import { parseFiles } from "../src/analyzer/diffAnalyzer";

const SIMPLE_DIFF = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,2 +1,4 @@
-const value = 1;
+export function runTask() {
+  return 42;
+}
 console.log(value);
`;

test("parseFiles extracts status and context", () => {
  const files = parseFiles(SIMPLE_DIFF);
  assert.equal(files.length, 1);
  assert.equal(files[0].status, "M");
  assert.equal(files[0].path, "src/app.ts");
  assert.ok(files[0].functionContexts.includes("runTask"));
});

test("parseFiles respects maxLinesPerFile while keeping true counts", () => {
  const diff = `diff --git a/src/big.ts b/src/big.ts
index 1111111..2222222 100644
--- a/src/big.ts
+++ b/src/big.ts
@@ -1,0 +1,5 @@
+line1
+line2
+line3
+line4
+line5
`;
  const files = parseFiles(diff, { maxLinesPerFile: 2 });
  assert.equal(files[0].additions, 5);
  assert.equal(files[0].addedLines.length, 2);
});
