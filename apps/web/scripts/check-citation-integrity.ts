import {
  buildEvidenceBundle,
  validateAnswerCitations,
} from "../lib/ask/grounding";

const segment = {
  id: "11111111-1111-4111-8111-111111111111",
  sourceId: "22222222-2222-4222-8222-222222222222",
  sourceVersionId: "33333333-3333-4333-8333-333333333333",
  sourceTitle: "Release fixture",
  text: "A retry budget limits repeated work.",
};
const bundle = buildEvidenceBundle({ segments: [segment] });
const valid = validateAnswerCitations(
  {
    answerMarkdown:
      "Retry budgets limit repeated work [[citation:11111111-1111-4111-8111-111111111111]].",
    citationIds: [segment.id],
    conceptIds: [],
    evidenceAssessment: "sufficient",
    inferenceNotes: [],
  },
  bundle,
);
if (valid.evidenceAssessment !== "sufficient")
  throw new Error("Valid citation was not accepted.");

let rejected = false;
try {
  validateAnswerCitations(
    {
      answerMarkdown:
        "Unsupported [[citation:44444444-4444-4444-8444-444444444444]].",
      citationIds: ["44444444-4444-4444-8444-444444444444"],
      conceptIds: [],
      evidenceAssessment: "sufficient",
      inferenceNotes: [],
    },
    bundle,
  );
} catch {
  rejected = true;
}
if (!rejected) throw new Error("Fabricated citation was accepted.");
console.log(
  "Citation integrity: valid citations accepted; fabricated citations rejected.",
);
