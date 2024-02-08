import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
    <div>
      <h1>rlabs / betterdiff</h1>
      <h3>Raw</h3>
      <pre
        style={{
          padding: "0.5rem",
          border: "1px solid black",
        }}
      >
        {raw}
      </pre>
      {parsed.map((diff) => {
        return (
          <div key={diff.filename}>
            <h3>{diff.filename}</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <DiffContent lines={diff.contents.from} />
              <DiffContent lines={diff.contents.to} />
            </div>
          </div>
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
    <div
      style={{
        border: "1px solid black",
      }}
    >
      {lines.map((line, idx) => {
        let lineNumber = lineNumbers[idx];
        return (
          <div
            key={line.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2rem 1fr",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                textAlign: "end",
                padding: "0 .25rem",
                borderRight: "1px solid black",
              }}
            >
              {line.type === "empty" ? <>&nbsp;</> : lineNumber}
            </div>
            <pre style={{ margin: 0 }}>{line.content}</pre>
          </div>
        );
      })}
    </div>
  );
}
