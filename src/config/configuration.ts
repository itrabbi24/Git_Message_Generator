import * as vscode from "vscode";
import { CommitType } from "../types";

export interface CommitGenConfig {
  maxHeaderLength: number;
  scopeMapping: Record<string, string>;
  typeOverrides: Record<string, CommitType>;
  showConfidence: boolean;
}

export function getCommitGenConfig(): CommitGenConfig {
  const config = vscode.workspace.getConfiguration("commitGen");
  return {
    maxHeaderLength: config.get<number>("maxHeaderLength", 72),
    scopeMapping: config.get<Record<string, string>>("scopeMapping", {}),
    typeOverrides: config.get<Record<string, CommitType>>("typeOverrides", {}),
    showConfidence: config.get<boolean>("showConfidence", true)
  };
}
