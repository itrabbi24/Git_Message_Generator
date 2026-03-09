import * as path from "path";
import { AnalyzedFile, CommitType } from "../types";
import { pickVerb } from "./verbSelector";

function basename(filePath: string): string {
  return path.posix.basename(filePath.replace(/\\/g, "/"));
}

function categoryNoun(type: CommitType): string {
  switch (type) {
    case "docs":
      return "documentation";
    case "test":
      return "tests";
    case "ci":
      return "workflow";
    case "build":
      return "build config";
    case "perf":
      return "performance";
    case "refactor":
      return "code";
    default:
      return "files";
  }
}

function significance(file: AnalyzedFile): number {
  if (file.status === "A") {
    return 30;
  }
  if (file.path.startsWith("src/")) {
    return 20;
  }
  if (file.path.endsWith(".md")) {
    return 5;
  }
  return 10;
}

export function composeDescription(files: AnalyzedFile[], commitType: CommitType, scope: string | null): string {
  const verb = pickVerb(commitType, files.length);
  const ranked = [...files].sort((a, b) => significance(b) - significance(a));

  if (files.length === 1) {
    return `${verb} ${basename(ranked[0].path)}`;
  }

  if (files.length <= 3) {
    return `${verb} ${ranked.map((file) => basename(file.path)).join(", ")}`;
  }

  if (scope) {
    return `${verb} ${scope} ${categoryNoun(commitType)}`;
  }

  return `${verb} ${files.length} files`;
}

export function buildMessage(type: CommitType, scope: string | null, description: string, maxLength: number): string {
  const header = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
  return header.length <= maxLength ? header : header.slice(0, maxLength).trimEnd();
}
