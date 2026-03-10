import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Bump = "patch" | "minor" | "major";

function run(command: string): string {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
}

function getLatestTag(): string | null {
  try {
    return run("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function collectCommitSubjects(sinceTag: string | null): string[] {
  const range = sinceTag ? `${sinceTag}..HEAD` : "HEAD";
  const output = run(`git log --pretty=format:%s ${range}`);
  return output ? output.split("\n").map((line) => line.trim()).filter(Boolean) : [];
}

function determineBump(subjects: string[]): Bump {
  if (subjects.some((s) => s.includes("!:") || /breaking change/i.test(s))) {
    return "major";
  }
  if (subjects.some((s) => s.startsWith("feat"))) {
    return "minor";
  }
  return "patch";
}

function incrementVersion(version: string, bump: Bump): string {
  const [major, minor, patch] = version.split(".").map((n) => parseInt(n, 10));
  if (bump === "major") {
    return `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

function prependChangelogSection(changelogPath: string, version: string): void {
  const content = readFileSync(changelogPath, "utf8");
  const marker = "## [Unreleased]";
  const index = content.indexOf(marker);
  if (index < 0) {
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const section = `\n## [${version}] - ${today}\n\n### Added\n- TODO\n\n### Changed\n- TODO\n`;
  const updated = `${content.slice(0, index + marker.length)}${section}${content.slice(index + marker.length)}`;
  writeFileSync(changelogPath, updated, "utf8");
}

function main(): void {
  const apply = process.argv.includes("--apply");
  const packagePath = path.join(process.cwd(), "package.json");
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string };
  const latestTag = getLatestTag();
  const subjects = collectCommitSubjects(latestTag);
  const bump = determineBump(subjects);
  const nextVersion = incrementVersion(packageJson.version, bump);

  console.log(`latestTag=${latestTag ?? "none"}`);
  console.log(`commits=${subjects.length}`);
  console.log(`recommendedBump=${bump}`);
  console.log(`nextVersion=${nextVersion}`);

  if (!apply) {
    return;
  }

  packageJson.version = nextVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
  prependChangelogSection(changelogPath, nextVersion);
  console.log("Applied version and changelog scaffold.");
}

main();
