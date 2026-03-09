export type CommitType =
  | "feat"
  | "fix"
  | "docs"
  | "style"
  | "refactor"
  | "perf"
  | "test"
  | "build"
  | "ci"
  | "chore"
  | "revert";

export interface Signal {
  type: CommitType;
  source: "filepath" | "diff_content" | "metadata";
  weight: number;
  reason: string;
}

export type FileStatus = "A" | "M" | "D" | "R" | "C";

export interface AnalyzedFile {
  path: string;
  previousPath?: string;
  status: FileStatus;
  signals: Signal[];
  additions: number;
  deletions: number;
  isBinary: boolean;
  functionContexts: string[];
  addedLines: string[];
  removedLines: string[];
  renameSimilarity?: number;
}

export interface MetadataResult {
  signals: Signal[];
  isDepsOnly: boolean;
}

export interface GenerationResult {
  message: string;
  type: CommitType;
  scope: string | null;
  confidence: number;
  signals: Signal[];
}
