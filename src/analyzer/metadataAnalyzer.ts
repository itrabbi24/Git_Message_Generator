import { Change, Status } from "../git/git";
import { Signal } from "../types";

export function analyzeMetadata(changes: Change[]): Signal[] {
  if (changes.length === 0) {
    return [];
  }

  const statuses = changes.map((change) => change.status);
  const allAdded = statuses.every((status) => status === Status.INDEX_ADDED || status === Status.INTENT_TO_ADD);
  const allDeleted = statuses.every((status) => status === Status.INDEX_DELETED);
  const hasRename = statuses.some((status) => status === Status.INDEX_RENAMED || status === Status.INTENT_TO_RENAME);

  const signals: Signal[] = [];
  if (allAdded) {
    signals.push({ type: "feat", source: "metadata", weight: 0.6, reason: "all staged files are added" });
  }
  if (allDeleted) {
    signals.push({ type: "chore", source: "metadata", weight: 0.5, reason: "all staged files are deleted" });
  }
  if (hasRename) {
    signals.push({ type: "refactor", source: "metadata", weight: 0.7, reason: "rename detected" });
  }

  return signals;
}
