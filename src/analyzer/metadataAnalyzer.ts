import { Change, Status } from "../git/git";
import { AnalyzedFile, MetadataResult, Signal } from "../types";
import { isBinaryFile, isCiFile, isDependencyFile, isDocsFile, isLockFile, isStyleFile, isTestFile } from "../utils/patterns";

function isAddedStatus(status: Status): boolean {
  return [
    Status.INDEX_ADDED,
    Status.INTENT_TO_ADD,
    Status.UNTRACKED,
    Status.ADDED_BY_US,
    Status.ADDED_BY_THEM,
    Status.BOTH_ADDED
  ].includes(status);
}

function isDeletedStatus(status: Status): boolean {
  return [Status.INDEX_DELETED, Status.DELETED, Status.DELETED_BY_US, Status.DELETED_BY_THEM, Status.BOTH_DELETED].includes(
    status
  );
}

function isRenamedStatus(status: Status): boolean {
  return [Status.INDEX_RENAMED, Status.INTENT_TO_RENAME].includes(status);
}

export function analyzeMetadata(changes: Change[], files: AnalyzedFile[]): MetadataResult {
  if (changes.length === 0) {
    return { signals: [], isDepsOnly: false };
  }

  const statuses = changes.map((change) => change.status);
  const allAdded = statuses.every((status) => isAddedStatus(status));
  const allDeleted = statuses.every((status) => isDeletedStatus(status));
  const hasRename = statuses.some((status) => isRenamedStatus(status));

  // Deps-only: every file is a dependency manifest or lock file
  const isDepsOnly =
    files.length > 0 &&
    files.every((file) => isDependencyFile(file.path) || isLockFile(file.path));

  const signals: Signal[] = [];
  if (allAdded) {
    signals.push({ type: "feat", source: "metadata", weight: 0.6, reason: "all changed files are additions" });
  }
  if (allDeleted) {
    signals.push({ type: "chore", source: "metadata", weight: 0.5, reason: "all changed files are deletions" });
  }
  if (hasRename) {
    signals.push({ type: "refactor", source: "metadata", weight: 0.7, reason: "rename detected" });
  }

  // Deps-only → build 0.80 (PDF spec: "Only package.json dependencies changed → build(deps) 0.80")
  if (isDepsOnly) {
    signals.push({ type: "build", source: "metadata", weight: 0.8, reason: "only dependency files changed" });
  }

  if (files.length > 0) {
    const allDocs = files.every((file) => isDocsFile(file.path));
    const allTests = files.every((file) => isTestFile(file.path));
    const allCi = files.every((file) => isCiFile(file.path));
    const allStyle = files.every((file) => isStyleFile(file.path));
    const allBinary = files.every((file) => file.isBinary || isBinaryFile(file.path));

    if (allDocs) {
      signals.push({ type: "docs", source: "metadata", weight: 0.9, reason: "docs-only change set" });
    }
    if (allTests) {
      signals.push({ type: "test", source: "metadata", weight: 0.9, reason: "test-only change set" });
    }
    if (allCi) {
      signals.push({ type: "ci", source: "metadata", weight: 0.9, reason: "ci-only change set" });
    }
    if (allStyle) {
      signals.push({ type: "style", source: "metadata", weight: 0.85, reason: "style-only change set" });
    }
    if (allBinary) {
      signals.push({ type: "chore", source: "metadata", weight: 0.72, reason: "binary asset-only change set" });
    }

    // Additions >> deletions across all source files (PDF: ratio > 3:1 → feat 0.40)
    const additions = files.reduce((sum, file) => sum + file.additions, 0);
    const deletions = files.reduce((sum, file) => sum + file.deletions, 0);
    if (additions > deletions * 3 && additions > 20) {
      signals.push({ type: "feat", source: "metadata", weight: 0.4, reason: "additions dominate change set (3:1)" });
    }
    if (deletions > additions * 3 && deletions > 20) {
      signals.push({ type: "refactor", source: "metadata", weight: 0.45, reason: "deletions dominate change set" });
    }
  }

  return { signals, isDepsOnly };
}
