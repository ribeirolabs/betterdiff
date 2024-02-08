import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { twMerge } from "tailwind-merge";
import invariant from "tiny-invariant";
import { DiffLine, getDiff, parseDiff } from "~/services/diff.server";

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
      <details>
        <summary className="font-bold text-xl cursor-pointer">Raw</summary>
        <pre
          style={{
            padding: "0.5rem",
            border: "1px solid black",
          }}
        >
          {raw}
        </pre>
      </details>
      {parsed.map((diff) => {
        return (
          <details key={diff.filename} open>
            <summary className="font-bold text-xl">{diff.filename}</summary>
            <div className="grid grid-cols-2 gap-4">
              <DiffContent lines={diff.contents.from} />
              <DiffContent lines={diff.contents.to} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

function DiffContent({ lines }: { lines: DiffLine[] }) {
  const lineNumbers: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === "empty") {
      lineNumbers.push(lineNumbers[lineNumbers.length - 1]);
    } else {
      lineNumbers.push((lineNumbers[lineNumbers.length - 1] || 0) + 1);
    }
  }

  return (
    <div className="border">
      {lines.map((line, idx) => {
        let lineNumber = lineNumbers[idx];
        return (
          <div
            key={line.id}
            className={twMerge(
              "grid grid-cols-[2rem_1fr] gap-2",
              line.type === "removed" && "bg-red-200",
              line.type === "added" && "bg-green-200",
              line.type === "empty" && "bg-neutral-200"
            )}
          >
            <div className="text-end px-1 border-r">
              {line.type === "empty" ? <>&nbsp;</> : lineNumber}
            </div>
            <pre>{line.content}</pre>
          </div>
        );
      })}
    </div>
  );
}
