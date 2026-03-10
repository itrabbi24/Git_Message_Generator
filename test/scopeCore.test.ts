import assert from "node:assert/strict";
import test from "node:test";
import { detectScopeFromPaths } from "../src/analyzer/scopeCore";

test("detectScopeFromPaths returns deps for dependency-only files", () => {
  const scope = detectScopeFromPaths(["package.json", "package-lock.json"]);
  assert.equal(scope, "deps");
});

test("detectScopeFromPaths applies custom mapping first", () => {
  const scope = detectScopeFromPaths(["src/payments/charge.ts"], {
    scopeMapping: {
      "src/payments/": "billing"
    }
  });
  assert.equal(scope, "billing");
});

test("detectScopeFromPaths picks dominant monorepo scope", () => {
  const scope = detectScopeFromPaths([
    "packages/auth/index.ts",
    "packages/auth/service.ts",
    "packages/ui/button.ts"
  ]);
  assert.equal(scope, "auth");
});
