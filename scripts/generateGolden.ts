import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommitType = "feat" | "fix" | "docs" | "style" | "refactor" | "perf" | "test" | "build" | "ci" | "chore" | "revert";

interface GoldenCase {
  name: string;
  type: CommitType;
  scope: string | null;
  confidence: number;
  maxHeaderLength: number;
  files: Array<{ path: string; status: "M" }>;
  expectedHeader: string;
}

function run(command: string): string {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
}

function inferType(subject: string): CommitType {
  const match = subject.match(/^(\w+)(?:\(.+\))?:/);
  const candidate = (match?.[1] ?? "chore").toLowerCase();
  const valid: CommitType[] = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"];
  return valid.includes(candidate as CommitType) ? (candidate as CommitType) : "chore";
}

function safePath(value: string): string {
  return value.replace(/\\/g, "/").trim();
}

function loadHashes(limit: number): string[] {
  const output = run(`git log --no-merges --pretty=format:%H -n ${limit}`);
  return output ? output.split("\n").map((line) => line.trim()).filter(Boolean) : [];
}

function main(): void {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = Math.max(5, Number(limitArg?.split("=")[1] ?? "30"));

  const hashes = loadHashes(limit);
  const generated: GoldenCase[] = [];

  for (const hash of hashes) {
    const subject = run(`git log -1 --pretty=format:%s ${hash}`);
    const filesRaw = run(`git show --name-only --pretty=format: ${hash}`);
    const files = filesRaw
      .split("\n")
      .map(safePath)
      .filter(Boolean)
      .slice(0, 6);
    if (files.length === 0) {
      continue;
    }

    const type = inferType(subject);
    const first = path.posix.basename(files[0]);
    generated.push({
      name: `auto_${hash.slice(0, 7)}`,
      type,
      scope: null,
      confidence: 0.65,
      maxHeaderLength: 72,
      files: files.map((file) => ({ path: file, status: "M" })),
      expectedHeader: `${type}: update ${first}`
    });
  }

  const outputPath = path.join(process.cwd(), "test", "fixtures", "golden-generated.json");
  const existingPath = path.join(process.cwd(), "test", "fixtures", "golden-messages.json");
  const base = JSON.parse(readFileSync(existingPath, "utf8")) as unknown[];

  writeFileSync(outputPath, JSON.stringify(generated, null, 2) + "\n", "utf8");
  console.log(`generated=${generated.length}`);
  console.log(`baseFixtures=${base.length}`);
  console.log(`output=${outputPath}`);
}

main();
