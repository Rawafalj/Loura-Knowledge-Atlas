import { MockAnswerModelClient } from "@/lib/ai/mock-clients";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { searchAtlas } from "@/lib/search/service";

import {
  askAnswerSchema,
  askRequestSchema,
  type AskRequest,
  type EvidenceBundle,
  type EvidenceConcept,
  type EvidenceSegment,
} from "./contracts";
import {
  buildEvidenceBundle,
  buildAnswerPrompt,
  validateAnswerCitations,
} from "./grounding";

export class AskServiceError extends Error {
  public constructor(
    readonly code:
      "VALIDATION_FAILED" | "INSUFFICIENT_EVIDENCE" | "INTERNAL_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "AskServiceError";
  }
}

export type AskEvidence = {
  bundle: EvidenceBundle;
  conceptIds: string[];
};

function segmentIdFromRoute(route: string): string | null {
  const marker = "#segment-";
  const index = route.indexOf(marker);
  return index === -1 ? null : route.slice(index + marker.length);
}

export async function retrieveAskEvidence(
  workspaceId: string,
  rawInput: Pick<AskRequest, "question" | "scope">,
): Promise<AskEvidence> {
  const input = askRequestSchema
    .pick({ question: true, scope: true })
    .parse(rawInput);
  const search = await searchAtlas(workspaceId, {
    query: input.question,
    scope: {
      domainIds: input.scope.domainIds,
      contentStatuses: input.scope.reviewedOnly
        ? ["reviewed"]
        : ["reviewed", "draft"],
      sourceTypes: [],
      sourceQualities: [],
    },
    limit: 12,
  });
  const supabase = await createSupabaseServerClient();
  let scopedConceptIds = [...input.scope.conceptIds];
  if (input.scope.pathId) {
    const pathSteps = await supabase
      .from("learning_path_steps")
      .select("concept_id")
      .eq("workspace_id", workspaceId)
      .eq("learning_path_id", input.scope.pathId)
      .order("step_order")
      .limit(50);
    if (pathSteps.error)
      throw new AskServiceError(
        "INTERNAL_ERROR",
        "Unable to load the learning path scope.",
      );
    scopedConceptIds = [
      ...new Set([
        ...scopedConceptIds,
        ...pathSteps.data.map((step) => step.concept_id),
      ]),
    ];
  }
  const conceptIds = (
    scopedConceptIds.length
      ? scopedConceptIds
      : search.concepts.map((concept) => concept.id)
  ).slice(0, 12);
  const conceptRows = conceptIds.length
    ? await supabase
        .from("concepts")
        .select("id, canonical_name, synthesis_markdown, content_status")
        .eq("workspace_id", workspaceId)
        .in("id", conceptIds)
    : { data: [], error: null };
  if (conceptRows.error)
    throw new AskServiceError(
      "INTERNAL_ERROR",
      "Unable to load answer concepts.",
    );
  const concepts: EvidenceConcept[] = conceptRows.data.map((concept) => ({
    id: concept.id,
    title: concept.canonical_name,
    synthesisMarkdown: concept.synthesis_markdown,
    contentStatus: concept.content_status,
  }));

  const segmentIds = search.sources
    .map((source) => segmentIdFromRoute(source.route))
    .filter((id): id is string => Boolean(id))
    .slice(0, 20);
  const segmentRows = segmentIds.length
    ? await supabase
        .from("source_segments")
        .select(
          "id, source_version_id, ordinal, text, page_start, page_end, heading_path, workspace_id",
        )
        .eq("workspace_id", workspaceId)
        .in("id", segmentIds)
    : { data: [], error: null };
  if (segmentRows.error)
    throw new AskServiceError(
      "INTERNAL_ERROR",
      "Unable to load answer evidence.",
    );
  const versionIds = [
    ...new Set(segmentRows.data.map((segment) => segment.source_version_id)),
  ];
  const versions = versionIds.length
    ? await supabase
        .from("source_versions")
        .select("id, source_id, processing_status")
        .eq("workspace_id", workspaceId)
        .in("id", versionIds)
    : { data: [], error: null };
  if (versions.error)
    throw new AskServiceError(
      "INTERNAL_ERROR",
      "Unable to load source versions.",
    );
  const sourceIds = [
    ...new Set(versions.data.map((version) => version.source_id)),
  ];
  const sources = sourceIds.length
    ? await supabase
        .from("sources")
        .select("id, title, quality, deleted_at")
        .eq("workspace_id", workspaceId)
        .in("id", sourceIds)
        .is("deleted_at", null)
    : { data: [], error: null };
  if (sources.error)
    throw new AskServiceError(
      "INTERNAL_ERROR",
      "Unable to load source metadata.",
    );
  const versionById = new Map(
    versions.data
      .filter((version) => version.processing_status === "completed")
      .map((version) => [version.id, version]),
  );
  const sourceById = new Map(sources.data.map((source) => [source.id, source]));
  const segments: EvidenceSegment[] = segmentRows.data.flatMap((segment) => {
    const version = versionById.get(segment.source_version_id);
    const source = version ? sourceById.get(version.source_id) : undefined;
    if (!version || !source) return [];
    return [
      {
        id: segment.id,
        sourceId: source.id,
        sourceVersionId: version.id,
        sourceTitle: source.title,
        text: segment.text,
        ordinal: segment.ordinal,
        location: segment.heading_path.length
          ? segment.heading_path.join(" / ")
          : segment.page_start
            ? `Page ${segment.page_start}`
            : undefined,
        sourceQuality: source.quality,
      },
    ];
  });
  return { bundle: buildEvidenceBundle({ segments, concepts }), conceptIds };
}

export async function generateMockAskAnswer(
  question: string,
  evidence: AskEvidence,
) {
  const bundle = evidence.bundle;
  if (!bundle.segments.length) {
    return validateAnswerCitations(
      {
        answerMarkdown:
          "The reviewed atlas does not contain enough evidence to answer this confidently.",
        citationIds: [],
        conceptIds: evidence.conceptIds,
        evidenceAssessment: "insufficient",
        inferenceNotes: ["No completed source segments matched the question."],
      },
      bundle,
    );
  }
  const first = bundle.segments[0];
  if (!first)
    throw new AskServiceError(
      "INSUFFICIENT_EVIDENCE",
      "No evidence segments were retrieved.",
    );
  const client = new MockAnswerModelClient({
    answerMarkdown: `Based on the retrieved source segment, ${first.text.slice(0, 500)} [[citation:${first.id}]]`,
    citationIds: [first.id],
    conceptIds: evidence.conceptIds,
    evidenceAssessment: "sufficient",
    inferenceNotes: [],
  });
  const raw = await client.generate({
    schema: askAnswerSchema,
    input: buildAnswerPrompt({ question, bundle }),
  });
  return validateAnswerCitations(raw.data, bundle);
}

export async function persistAskExchange(input: {
  workspaceId: string;
  userId: string;
  threadId?: string | null;
  question: string;
  answerMarkdown: string;
  answerStatus: "complete" | "insufficient_evidence" | "failed";
  conceptIds: string[];
  citationIds: string[];
  scope: unknown;
}) {
  const supabase = await createSupabaseServerClient();
  let threadId = input.threadId ?? null;
  if (threadId) {
    const thread = await supabase
      .from("ask_threads")
      .select("id")
      .eq("id", threadId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();
    if (thread.error || !thread.data)
      throw new AskServiceError(
        "VALIDATION_FAILED",
        "Ask thread is not available.",
      );
  } else {
    const thread = await supabase
      .from("ask_threads")
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        title: input.question.slice(0, 120),
        scope: input.scope as Json,
      })
      .select("id")
      .single();
    if (thread.error || !thread.data)
      throw new AskServiceError(
        "INTERNAL_ERROR",
        "Unable to create Ask thread.",
      );
    threadId = thread.data.id;
  }
  const userMessage = await supabase
    .from("ask_messages")
    .insert({
      workspace_id: input.workspaceId,
      thread_id: threadId,
      role: "user",
      content_markdown: input.question,
      answer_status: "complete",
    })
    .select("id")
    .single();
  if (userMessage.error)
    throw new AskServiceError("INTERNAL_ERROR", "Unable to save Ask question.");
  const assistantMessage = await supabase
    .from("ask_messages")
    .insert({
      workspace_id: input.workspaceId,
      thread_id: threadId,
      role: "assistant",
      content_markdown: input.answerMarkdown,
      answer_status: input.answerStatus,
      retrieved_concept_ids: input.conceptIds,
      cited_segment_ids: input.citationIds,
    })
    .select("id")
    .single();
  if (assistantMessage.error)
    throw new AskServiceError("INTERNAL_ERROR", "Unable to save Ask answer.");
  return threadId;
}
