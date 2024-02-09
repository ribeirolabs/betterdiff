import crypto from "node:crypto";
import os from "node:os";
import invariant from "tiny-invariant";

enum FileMode {
  Regular,
  Executable,
  SymLink,
  Submodule,
  Directory,
}

const FILE_MODES = {
  "100644": FileMode.Regular,
  "100755": FileMode.Executable,
  "120000": FileMode.SymLink,
  "160000": FileMode.Submodule,
  "040000": FileMode.Directory,
};

export type DiffLine = {
  id: string;
  type: "added" | "removed" | "unchanged" | "empty" | "range";
  lineNumber: number;
  content: string;
};

export type DiffRange = {
  start: number;
  end: number;
};

export type DiffFile = {
  header: {
    filename: string;
  };
  chunks: {
    range: {
      content: string;
      original: DiffRange;
      modified: DiffRange;
    };
    original: DiffLine[];
    modified: DiffLine[];
  }[];
};

type PendingDiffFile = {
  filename?: string;
  chunks: DeepPartial<DiffFile["chunks"]>;
  chunk?: DeepPartial<DiffFile["chunks"][number]>;
};

const INITIAL_FILE: PendingDiffFile = {
  filename: "",
  chunks: [],
  chunk: undefined,
};

export class DiffParser {
  public data: string;
  public lines: string[];
  public currentLine = 0;
  public files: DiffFile[] = [];
  public pending: PendingDiffFile = structuredClone(INITIAL_FILE);

  constructor(data: string) {
    this.data = data;
    this.lines = data.split(os.EOL);
  }

  parse() {
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine];

      // Example:
      // diff --git a/path/to/original b/path/to/modified
      if (line.startsWith("diff --git")) {
        if (this.pending.filename) {
          this.commitPending();
        }

        const filename = FILENAME_REGEX.exec(line)?.[1];

        invariant(filename, `Unable to extract filename from line: ${line}`);

        this.pending.filename = filename;

        this.nextLine();
        this.nextLine();
        this.nextLine();
      } else if (line.startsWith("@@ ")) {
        const result = RANGE_REGEX.exec(line);
        invariant(result, `Unable to extract diff range from line: ${line}`);
        const [_input, originalStart, originalEnd, modifiedStart, modifiedEnd] =
          result;

        if (this.pending.chunk) {
          this.pending.chunks.push(this.pending.chunk);
        }

        this.pending.chunk = {
          range: {
            content: line,
            original: {
              start: parseInt(originalStart),
              end: parseInt(originalEnd),
            },
            modified: {
              start: parseInt(modifiedStart),
              end: parseInt(modifiedEnd),
            },
          },
        };
      } else {
        invariant(this.pending.chunk, `Invalid chunk: ${this.pending}`);
        if (!this.pending.chunk.original) {
          this.pending.chunk.original = [];
        }

        this.pending.chunk.original.push({
          id: crypto.randomUUID(),
          type: "unchanged",
          lineNumber: 0,
          content: line,
        });
      }

      this.nextLine();
    }

    this.commitPending();
  }

  buildLine(line: DiffLine) {
    return line;
  }

  commitPending() {
    invariant(this.pending.filename, "Filename is required");

    if (this.pending.chunk) {
      this.pending.chunks.push(this.pending.chunk);
    }

    this.files.push({
      header: {
        filename: this.pending.filename,
      },
      // TODO: validate
      // @ts-ignore
      chunks: this.pending.chunks,
    });

    this.pending = structuredClone(INITIAL_FILE);
  }

  nextLine() {
    this.currentLine = Math.min(this.lines.length, this.currentLine + 1);
  }
}

const FILENAME_REGEX = /^diff --git a\/(.+) /;
const RANGE_REGEX = /^\@\@ -(\d+),(\d+) \+(\d+),(\d+)\s/;
