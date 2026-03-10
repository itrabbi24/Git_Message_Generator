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

function runCase(name: string, fileCount: number, linesPerFile: number): void {
  const diff = buildSyntheticDiff(fileCount, linesPerFile);
  const started = performance.now();
  const files = parseFiles(diff, { maxLinesPerFile: 1200, maxContextsPerFile: 12 });
  const elapsed = performance.now() - started;
  const totalLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  console.log(`${name.padEnd(10)} files=${files.length} lines=${totalLines} parseMs=${elapsed.toFixed(2)}`);
}

console.log("CommitGen benchmark");
runCase("small", 5, 40);
runCase("medium", 20, 80);
runCase("large", 40, 160);
