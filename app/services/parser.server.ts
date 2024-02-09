export type DiffLine = {
  number: number;
  type: "unchanged" | "added" | "removed" | "empty";
  content: string;
  diff?: number[][];
};

const firstLines: DiffLine[][] = [
  [
    { number: 1, type: "unchanged", content: "# This is a title" },
    { number: 2, type: "unchanged", content: "" },
    { number: 3, type: "unchanged", content: "This is list" },
    { number: 4, type: "removed", content: "* First" },
    { number: 5, type: "removed", content: "* Second" },
    { number: 6, type: "removed", content: "* Third" },
  ],
  [
    { number: 1, type: "unchanged", content: "# This is a title" },
    { number: 2, type: "unchanged", content: "" },
    { number: 3, type: "unchanged", content: "This is list" },
    { number: 4, type: "added", content: "    * First", diff: [[0, 3]] },
    { number: 5, type: "added", content: "    * Second", diff: [[0, 3]] },
    { number: 6, type: "added", content: "    * Third", diff: [[0, 3]] },
  ],
];

// prettier-ignore
const secondLines: DiffLine[][] = [
  [
    { number: 1, type: "unchanged", content: "function Component() {" },
    { number: 2, type: "unchanged", content: "  return (" },
    { number: 3, type: "unchanged", content: "    <div>" },
    { number: 0, type: "empty",     content: "" },
    { number: 4, type: "unchanged", content: "      <h1>Title</h1>" },
    { number: 0, type: "empty",     content: "" },
    { number: 5, type: "removed",   content: "      <p>This is the content</p>" },
    { number: 6, type: "unchanged", content: "    </div>" },
    { number: 7, type: "unchanged", content: "  );" },
    { number: 8, type: "unchanged", content: "}" },
  ],
  [
    { number: 1, type : "unchanged", content: "function Component() {" },
    { number: 2, type : "unchanged", content: "  return (" },
    { number: 3, type : "unchanged", content: "    <div>" },
    { number: 4, type : "added",     content: "      <header>" },
    { number: 5, type : "unchanged", content: "        <h1>Title</h1>" },
    { number: 6, type : "added",     content: "      </header>" },
    { number: 7, type : "added",     content: '      <p id="content">This is the content</p>', diff: [[9, 21,]] },
    { number: 8, type : "unchanged", content: "    </div>" },
    { number: 9, type : "unchanged", content: "  );" },
    { number: 10, type: "unchanged", content: "}" },
  ],
];
/* prettier-ignore-end */

const patch = [
  {
    commit: "bbe85c87111d76a72d53910ef1a52469cb9cac1b",
    author: {
      name: "Igor Ribeiro",
      email: "igor.ribeiro.plus@gmail.com",
    },
    date: "Thu, 8 Feb 2024 11:17:49 -0300",
    files: [
      {
        name: "examples/indentation.md",
        insertions: 3,
        deletions: 3,
        chunks: [
          {
            header: "@@ -1,6 +1,6 @@",
            range: {
              original: [1, 6],
              modified: [1, 6],
            },
            lines: {
              original: firstLines[0],
              modified: firstLines[1],
            },
          },
        ],
      },
    ],
  },
  {
    commit: "6b92469200d4ad5d75949bd90ec7bd674894894c",
    author: {
      name: "Igor Ribeiro",
      email: "igor.ribeiro.plus@gmail.com",
    },
    date: "Thu, 8 Feb 2024 12:23:11 -0300",
    files: [
      {
        name: "examples/indentation.tsx",
        insertions: 4,
        deletions: 2,
        chunks: [
          {
            header: "@@ -1,8 +1,10 @@",
            range: {
              original: [1, 8],
              modified: [1, 10],
            },
            lines: {
              original: secondLines[0],
              modified: secondLines[1],
            },
          },
        ],
      },
    ],
  },
];

export function parse() {
  return patch;
}
