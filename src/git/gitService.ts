import * as vscode from "vscode";
import { Change, GitAPI, GitExtension, Repository, Status } from "./git";

export interface StagedContext {
  repository: Repository;
  stagedChanges: Change[];
  rawDiff: string;
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

export async function getStagedContext(): Promise<StagedContext | undefined> {
  const repository = await getRepositoryForContext();
  if (!repository) {
    return undefined;
  }

  const stagedChanges = repository.state.indexChanges.filter((change) =>
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

  const rawDiff = await repository.diff(true);
  return { repository, stagedChanges, rawDiff };
}
