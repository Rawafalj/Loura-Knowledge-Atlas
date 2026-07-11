import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { classifyEvidence } from "../lib/ask/grounding";

type Case = {
  caseId: string;
  segmentIds: string[];
  citationIds: string[];
  assessment: "sufficient" | "partial" | "insufficient";
};

const cases = JSON.parse(
  await readFile(
    resolve(process.cwd(), "../../evals/grounded-qa.json"),
    "utf8",
  ),
) as Case[];
const failures = cases.filter(
  (testCase) =>
    classifyEvidence({
      suppliedSegmentIds: testCase.segmentIds,
      citationIds: testCase.citationIds,
      requestedAssessment: testCase.assessment,
    }) !== testCase.assessment,
);
if (failures.length)
  throw new Error(
    `Golden eval failures: ${failures.map(({ caseId }) => caseId).join(", ")}`,
  );
console.log(
  `Grounded QA golden eval: ${cases.length} cases passed (100% deterministic threshold).`,
);
