import { type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "betterdiff / ribeirolabs" },
    { name: "description", content: "Better way to visualize git diffs" },
  ];
};

export default function Index() {
  return (
    <div>
      <h1>rlabs / betterdiff</h1>
    </div>
  );
}
