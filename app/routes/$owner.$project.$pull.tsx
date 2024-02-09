import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { twMerge } from "tailwind-merge";
import invariant from "tiny-invariant";
import { getDiff, parseDiff } from "~/services/diff.server";
import { DiffLine } from "~/services/parser.server";

export const meta: MetaFunction = () => {
  return [
    { title: "betterdiff / ribeirolabs" },
    { name: "description", content: "Better way to visualize git diffs" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { owner, project, pull } = params;
  invariant(owner, "Missing owner");
  invariant(project, "Missing project");
  invariant(pull, "Missing pull");

  const raw = await getDiff(owner, project, pull);
  const parsed = parseDiff(raw);

  return json({ raw, parsed });
}

export default function Index() {
  const { raw, parsed } = useLoaderData<typeof loader>();

  return (
    <div className="p-3">
      <header className="border-b mb-3">
        <h1 className="font-bold">rlabs / betterdiff</h1>
      </header>
      <details className="mb-6 border">
        <summary className="font-bold p-1">Raw</summary>
        <pre className="p-1">{raw}</pre>
      </details>

      <div className="grid gap-6">
        {parsed.map((patch) => {
          return (
            <details key={patch.commit} open>
              <summary className="border p-1">
                <div className="inline-flex">
                  <h3>{patch.commit}</h3>
                </div>
              </summary>

              <div className="border">
                {patch.files.map((file) => {
                  return (
                    <div key={file.name}>
                      <div className="flex gap-2 p-1 border-b">
                        <h4>{file.name}</h4>
                        <div>
                          (+{file.insertions},-{file.deletions})
                        </div>
                      </div>

                      {file.chunks.map((chunk) => {
                        return (
                          <div key={chunk.header}>
                            <p className="font-bold p-1 border-b">
                              {chunk.header}
                            </p>
                            <div className="grid grid-cols-2">
                              <Code lines={chunk.lines.original} />
                              <Code lines={chunk.lines.modified} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY_CHAR = "\u00a0";

function Code({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="border-r grid grid-cols-[minmax(32px,auto)_1fr]">
      <div className="dark">
        {lines.map((line) => {
          return (
            <pre
              className={twMerge(
                "text-end px-1 border-r font-bold",
                line.type === "removed" && "text-white bg-red-600",
                line.type === "added" && "text-white bg-green-600"
              )}
            >
              {line.number || EMPTY_CHAR}
            </pre>
          );
        })}
      </div>

      <div>
        {lines.map((line, idx) => {
          if (line.type === "empty") {
            return <pre key={idx}>&nbsp;</pre>;
          }

          return (
            <div key={idx} className="relative">
              <pre
                className={twMerge(
                  "px-1",
                  line.type === "removed" && "text-red-900 bg-red-100",
                  line.type === "added" &&
                    !line.diff?.length &&
                    "text-green-900 bg-green-100"
                )}
              >
                {line.content || EMPTY_CHAR}
              </pre>

              {line.diff?.map(([start, end], idx) => {
                return (
                  <div
                    key={idx}
                    className={twMerge(
                      "mx-1 px-0 absolute top-0 left-0 select-none pointer-events-none inline-flex"
                    )}
                  >
                    {line.content.split("").map((_c, i) => {
                      const isDiff = i >= start && i <= end;

                      return (
                        <pre
                          className={twMerge(
                            line.type === "removed" &&
                              isDiff &&
                              "bg-red-600/20",
                            line.type === "added" && isDiff && "bg-green-600/20"
                          )}
                        >
                          {EMPTY_CHAR}
                        </pre>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
