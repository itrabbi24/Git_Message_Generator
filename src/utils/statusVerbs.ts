import { FileStatus } from "../types";

export const STATUS_VERBS: Record<FileStatus, string> = {
  A: "add",
  M: "update",
  D: "remove",
  R: "rename",
  C: "copy"
};
