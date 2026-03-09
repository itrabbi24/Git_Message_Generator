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
  | "chore";

export interface Signal {
  type: CommitType;
  source: "filepath" | "diff_content" | "metadata";
  weight: number;
  reason: string;
}

export interface AnalyzedFile {
  path: string;
  status: string;
  signals: Signal[];
  additions: number;
  deletions: number;
  isBinary: boolean;
  functionContexts: string[];
}

export interface GenerationResult {
  message: string;
  type: CommitType;
  scope: string | null;
  confidence: number;
  signals: Signal[];
}
