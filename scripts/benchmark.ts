import { performance } from "node:perf_hooks";
import { parseFiles } from "../src/analyzer/diffAnalyzer";

function buildSyntheticDiff(fileCount: number, linesPerFile: number): string {
  const chunks: string[] = [];
  for (let i = 0; i < fileCount; i += 1) {
    const file = `src/bench/file${i}.ts`;
    chunks.push(`diff --git a/${file} b/${file}`);
    chunks.push("index 1111111..2222222 100644");
    chunks.push(`--- a/${file}`);
    chunks.push(`+++ b/${file}`);
    chunks.push(`@@ -1,0 +1,${linesPerFile} @@`);
    for (let line = 0; line < linesPerFile; line += 1) {
      chunks.push(`+export const value_${i}_${line} = ${line};`);
    }
  }
  return chunks.join("\n");
}

interface CaseResult {
  name: string;
  files: number;
  lines: number;
  parseMs: number;
}

function runCase(name: string, fileCount: number, linesPerFile: number): CaseResult {
  const diff = buildSyntheticDiff(fileCount, linesPerFile);
  const started = performance.now();
  const files = parseFiles(diff, { maxLinesPerFile: 1200, maxContextsPerFile: 12 });
  const elapsed = performance.now() - started;
  const totalLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  return {
    name,
    files: files.length,
    lines: totalLines,
    parseMs: Number(elapsed.toFixed(2))
  };
}

function logHuman(results: CaseResult[]): void {
  console.log("CommitGen benchmark");
  for (const result of results) {
    console.log(`${result.name.padEnd(10)} files=${result.files} lines=${result.lines} parseMs=${result.parseMs.toFixed(2)}`);
  }
}

function enforceGate(results: CaseResult[]): void {
  const thresholds = {
    small: Number(process.env.BENCH_SMALL_MAX_MS ?? "120"),
    medium: Number(process.env.BENCH_MEDIUM_MAX_MS ?? "250"),
    large: Number(process.env.BENCH_LARGE_MAX_MS ?? "600")
  };

  const failed = results.filter((result) => result.parseMs > (thresholds as Record<string, number>)[result.name]);
  if (failed.length > 0) {
    for (const result of failed) {
      const limit = (thresholds as Record<string, number>)[result.name];
      console.error(`benchmark gate failed: ${result.name} parseMs=${result.parseMs} > ${limit}`);
    }
    process.exit(1);
  }
}

const results = [runCase("small", 5, 40), runCase("medium", 20, 80), runCase("large", 40, 160)];
const asJson = process.argv.includes("--json");
const gate = process.argv.includes("--gate");

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  logHuman(results);
}

if (gate) {
  enforceGate(results);
}
