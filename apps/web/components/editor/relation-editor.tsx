"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@loura/ui";

import {
  createRelationAction,
  removeRelationAction,
  updateRelationAction,
  type AtlasActionState,
} from "@/app/(workspace)/concepts/actions";
import type { ConceptSummary } from "@/lib/atlas/queries";
import type { Tables } from "@/lib/supabase/database.types";

import { useUnsavedChanges } from "./use-unsaved-changes";

const initialActionState: AtlasActionState = { status: "idle", message: "" };

export type RelationEditorValue = {
  id: string | null;
  updatedAt: string | null;
  sourceConceptId: string;
  relationTypeId: string;
  targetConceptId: string;
  description: string;
  reviewStatus: "draft" | "reviewed" | "deprecated";
};

export function RelationEditor({
  mode,
  initialValue,
  originSlug,
  concepts,
  relationTypes,
  canReview,
}: {
  mode: "create" | "update";
  initialValue: RelationEditorValue;
  originSlug: string;
  concepts: ConceptSummary[];
  relationTypes: Tables<"relation_types">[];
  canReview: boolean;
}) {
  const action =
    mode === "create" ? createRelationAction : updateRelationAction;
  const [actionState, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  useUnsavedChanges(dirty);
  useEffect(() => {
    if (actionState.status !== "success" || !actionState.route) return;
    router.push(actionState.route);
    router.refresh();
  }, [actionState, router]);

  return (
    <form
      action={formAction}
      className="editor-form"
      onChange={() => setDirty(true)}
    >
      <input type="hidden" name="originSlug" value={originSlug} />
      {mode === "update" ? (
        <>
          <input
            type="hidden"
            name="relationId"
            value={initialValue.id ?? ""}
          />
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={initialValue.updatedAt ?? ""}
          />
        </>
      ) : null}
      <section className="editor-section">
        <div className="form-grid form-grid--two">
          <Field label="Source concept">
            <select
              name="sourceConceptId"
              defaultValue={initialValue.sourceConceptId}
              required
            >
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.canonical_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Relationship type">
            <select
              name="relationTypeId"
              defaultValue={initialValue.relationTypeId}
              required
            >
              {relationTypes.map((relationType) => (
                <option key={relationType.id} value={relationType.id}>
                  {relationType.forward_label} · {relationType.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target concept">
            <select
              name="targetConceptId"
              defaultValue={initialValue.targetConceptId}
              required
            >
              <option value="" disabled>
                Select a concept
              </option>
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.canonical_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Review status">
            <select
              name="reviewStatus"
              defaultValue={initialValue.reviewStatus}
            >
              <option value="draft">draft</option>
              <option value="reviewed" disabled={!canReview}>
                reviewed
              </option>
              <option value="deprecated">deprecated</option>
            </select>
          </Field>
        </div>
        <Field
          label="Qualification"
          hint="Optional context explaining how or when the relation holds."
        >
          <textarea
            name="description"
            defaultValue={initialValue.description}
            rows={4}
            maxLength={1000}
          />
        </Field>
      </section>
      {actionState.message ? (
        <p
          className={
            actionState.status === "error" ? "message error" : "message"
          }
          role={actionState.status === "error" ? "alert" : "status"}
        >
          {actionState.message}
        </p>
      ) : null}
      <div className="editor-actions">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add relationship"
              : "Save relationship"}
        </Button>
        <a
          className="ui-button ui-button--secondary"
          href={`/concepts/${originSlug}?tab=relationships`}
        >
          Cancel
        </a>
        {dirty ? (
          <span className="unsaved-indicator">
            Unsaved relationship changes
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function RemoveRelationForm({
  relationId,
  expectedUpdatedAt,
  originSlug,
}: {
  relationId: string;
  expectedUpdatedAt: string;
  originSlug: string;
}) {
  const [state, action, pending] = useActionState(
    removeRelationAction,
    initialActionState,
  );
  const router = useRouter();
  useEffect(() => {
    if (state.status !== "success" || !state.route) return;
    router.push(state.route);
    router.refresh();
  }, [router, state]);
  return (
    <form action={action} className="danger-zone">
      <input type="hidden" name="relationId" value={relationId} />
      <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
      <input type="hidden" name="originSlug" value={originSlug} />
      <div>
        <h2>Remove relationship</h2>
        <p>Removal is soft-deleted and retained in the audit history.</p>
      </div>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Removing…" : "Remove relationship"}
      </Button>
      {state.status === "error" ? (
        <p className="message error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
