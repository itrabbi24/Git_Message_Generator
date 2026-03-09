import * as vscode from "vscode";
import { Change, GitAPI, GitExtension, Repository, Status } from "./git";

export interface ChangeContext {
  repository: Repository;
  changes: Change[];
  rawDiff: string;
  source: "staged" | "workingTree";
}

export function getGitApi(): GitAPI | undefined {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    return undefined;
  }

  const gitExtension = extension.isActive ? extension.exports : extension.activate();
  return (gitExtension as GitExtension).getAPI(1);
}

export async function getRepositoryForContext(): Promise<Repository | undefined> {
  const api = getGitApi();
  if (!api) {
    return undefined;
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const repo = api.getRepository(activeUri);
    if (repo) {
      return repo;
    }
  }

  return api.repositories[0];
}

function filterIndexChanges(changes: Change[]): Change[] {
  return changes.filter((change) =>
    [
      Status.INDEX_MODIFIED,
      Status.INDEX_ADDED,
      Status.INDEX_DELETED,
      Status.INDEX_RENAMED,
      Status.INDEX_COPIED,
      Status.TYPE_CHANGED,
      Status.INTENT_TO_ADD,
      Status.INTENT_TO_RENAME
    ].includes(change.status)
  );
}

function filterWorkingTreeChanges(changes: Change[]): Change[] {
  return changes.filter((change) =>
    [Status.MODIFIED, Status.DELETED, Status.UNTRACKED, Status.TYPE_CHANGED, Status.BOTH_MODIFIED].includes(
      change.status
    )
  );
}

export async function getChangeContext(includeWorkingTreeWhenNoStaged: boolean): Promise<ChangeContext | undefined> {
  const repository = await getRepositoryForContext();
  if (!repository) {
    return undefined;
  }

  // Refresh repository state so indexChanges/workingTreeChanges are up to date
  try {
    await repository.status();
  } catch {
    // Non-fatal: proceed with whatever state is available
  }

  const stagedChanges = filterIndexChanges(repository.state.indexChanges);
  if (stagedChanges.length > 0) {
    const rawDiff = await repository.diff(true);
    return { repository, changes: stagedChanges, rawDiff, source: "staged" };
  }

  if (!includeWorkingTreeWhenNoStaged) {
    return { repository, changes: [], rawDiff: "", source: "staged" };
  }

  const workingTreeChanges = filterWorkingTreeChanges(repository.state.workingTreeChanges ?? []);
  const rawDiff = workingTreeChanges.length > 0 ? await repository.diff(false) : "";
  return { repository, changes: workingTreeChanges, rawDiff, source: "workingTree" };
}
