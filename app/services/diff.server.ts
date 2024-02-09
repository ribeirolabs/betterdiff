import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { request } from "@octokit/request";
import invariant from "tiny-invariant";
import { DiffParser } from "./diffParser.server";
import { parse } from "./parser.server";

const { GH_TOKEN } = process.env;

export type DiffLine = {
  id: string;
  lineNumber: number;
  type: "added" | "removed" | "unchanged" | "empty";
  content: string;
};

export type DiffResponse = {
  filename: string;
  contents: {
    from: DiffLine[];
    to: DiffLine[];
  };
  range: {
    from: [number, 2];
    to: [number, 2];
  };
};

const CACHE_PATH = path.resolve(".cache", "diff.cache.txt");

export async function getDiff(
  owner: string,
  repo: string,
  pull: string
): Promise<string> {
  try {
    const cache = fs.readFileSync(CACHE_PATH, "utf8");
    console.log("getting from cache");
    return cache;
  } catch (e) {}

  invariant(GH_TOKEN, "Missing env variable: GH_TOKEN");

  const { data } = await request("GET /repos/{owner}/{repo}/pulls/{pull}", {
    owner,
    repo,
    pull,
    headers: {
      accept: "application/vnd.github.diff",
      authorization: `token ${GH_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!data) {
    throw new Error("Unable to get a response");
  }

  try {
    fs.writeFileSync(CACHE_PATH, data, "utf8");
  } catch (e) {}

  return data;
}
export function parseDiff(diff: string) {
  return parse();
}

export function _parseDiff(diff: string) {
  const parser = new DiffParser(diff);
  parser.parse();

  return parser.files;
}

function old(diff: string) {
  const diffs: DiffResponse[] = [];
  let filename: string = "";
  let range: { from: number[]; to: number[] } = {
    from: [],
    to: [],
  };
  let fromDiffLine: DiffLine[] = [];
  let toDiffLine: DiffLine[] = [];

  const lines = diff.split("\n");
  let currentLine = 0;
  let lineNumber = 0;

  function push() {
    if (filename) {
      validateRange(range);

      // TODO: Validate before pushing
      diffs.push({
        filename,
        range,
        contents: {
          from: fromDiffLine,
          to: toDiffLine,
        },
      });
    }
  }

  while (currentLine < lines.length) {
    if (currentLine === lines.length - 1) {
      push();
    }

    let line = lines[currentLine];

    if (!line) {
      currentLine++;
      continue;
    }

    // extract filename
    // TODO: handle renames
    if (line.startsWith("diff --git")) {
      if (filename) {
        // TODO: Validate before pushing
        push();

        fromDiffLine = [];
        toDiffLine = [];
        range = {
          from: [],
          to: [],
        };
      }

      filename = line
        .replace("diff --git ", "")
        .split(" ")[0]
        ?.replace(/^a\//, "");

      // skip next 4 lines
      currentLine += 4;
      continue;
    }

    if (line.startsWith("@@ ")) {
      const ranges = line
        .replace(/(^@@ | @@$)/g, "")
        .replace(/(\+|-)/g, "")
        .split(" ");

      const [from, to] = ranges.map((range) =>
        range.split(",").map((value) => Number(value))
      );

      range = {
        from,
        to,
      };

      lineNumber = from[0];
      currentLine++;
      continue;
    }

    const trimmed = line.replace(/(\s|\+|-)/, "");

    const _line: Omit<DiffLine, "type"> = {
      id: crypto.randomUUID(),
      lineNumber: 0,
      content: trimmed,
    };

    if (line.startsWith("-")) {
      fromDiffLine.push({
        ..._line,
        type: "removed",
      });

      for (let left = range.from[1]; left < range.to[1]; left++) {
        fromDiffLine.push({
          id: crypto.randomUUID(),
          lineNumber: 0,
          content: " ",
          type: "empty",
        });
      }
    } else if (line.startsWith("+")) {
      toDiffLine.push({
        ..._line,
        type: "added",
      });
    } else {
      fromDiffLine.push({
        ..._line,
        type: "unchanged",
      });

      toDiffLine.push({
        ..._line,
        type: "unchanged",
      });
    }

    currentLine++;
  }

  return diffs;
}

function validateRange(range: {
  from: number[];
  to: number[];
}): asserts range is DiffResponse["range"] {
  invariant(range.from.length === 2, "Invalid range");
  invariant(range.to.length === 2, "Invalid range");
}
