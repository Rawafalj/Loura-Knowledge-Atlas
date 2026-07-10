"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Field } from "@loura/ui";
import type { MDXEditorMethods } from "@mdxeditor/editor";

import {
  aliasTypes,
  conceptKinds,
  contentPriorities,
  contentStatuses,
} from "@/lib/atlas/contracts";
import type { ConceptSummary } from "@/lib/atlas/queries";
import type { Tables } from "@/lib/supabase/database.types";
import {
  createConceptAction,
  updateConceptAction,
  type AtlasActionState,
} from "@/app/(workspace)/concepts/actions";

import { ForwardRefEditor } from "./forward-ref-editor";
import { useUnsavedChanges } from "./use-unsaved-changes";

type AliasValue = {
  value: string;
  type: (typeof aliasTypes)[number];
  languageCode: string;
  disambiguationKey: string | null;
};

export type ConceptEditorValue = {
  id: string | null;
  updatedAt: string | null;
  slug: string;
  canonicalName: string;
  conciseDefinition: string;
  synthesisMarkdown: string;
  whyItExistsMarkdown: string;
  mechanismMarkdown: string;
  examplesMarkdown: string;
  counterexamplesMarkdown: string;
  failureModesMarkdown: string;
  commonConfusionsMarkdown: string;
  canonicalDomainId: string;
  canonicalParentId: string;
  conceptKind: (typeof conceptKinds)[number];
  contentStatus: (typeof contentStatuses)[number];
  priority: (typeof contentPriorities)[number];
  targetMastery: string;
  reviewNote: string;
  replacementConceptId: string;
  aliases: AliasValue[];
  changeSummary: string;
};

const initialActionState: AtlasActionState = { status: "idle", message: "" };

export function ConceptEditor({
  mode,
  initialValue,
  domains,
  concepts,
  canReview,
}: {
  mode: "create" | "update";
  initialValue: ConceptEditorValue;
  domains: Tables<"domains">[];
  concepts: ConceptSummary[];
  canReview: boolean;
}) {
  const action = mode === "create" ? createConceptAction : updateConceptAction;
  const [actionState, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  const [values, setValues] = useState(initialValue);
  const [dirty, setDirty] = useState(false);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const editorRef = useRef<MDXEditorMethods>(null);
  const router = useRouter();
  const draftKey = `loura:concept-draft:${mode}:${initialValue.id ?? "new"}`;

  useUnsavedChanges(dirty);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(draftKey);
      if (stored) {
        try {
          const draft = JSON.parse(stored) as ConceptEditorValue;
          if (
            draft &&
            typeof draft.canonicalName === "string" &&
            Array.isArray(draft.aliases)
          ) {
            setValues(draft);
            setRestored(true);
          }
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [draftKey]);

  useEffect(() => {
    if (ready && dirty)
      window.localStorage.setItem(draftKey, JSON.stringify(values));
  }, [dirty, draftKey, ready, values]);

  useEffect(() => {
    if (actionState.status !== "success" || !actionState.route) return;
    window.localStorage.removeItem(draftKey);
    router.push(actionState.route);
    router.refresh();
  }, [actionState, draftKey, router]);

  const update = <Key extends keyof ConceptEditorValue>(
    key: Key,
    value: ConceptEditorValue[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const availableConcepts = concepts.filter(
    (concept) => concept.id !== initialValue.id,
  );

  return (
    <form action={formAction} className="editor-form">
      {mode === "update" ? (
        <>
          <input type="hidden" name="conceptId" value={initialValue.id ?? ""} />
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={initialValue.updatedAt ?? ""}
          />
        </>
      ) : null}
      <textarea
        hidden
        readOnly
        name="aliases"
        value={JSON.stringify(values.aliases)}
      />
      <textarea
        hidden
        readOnly
        name="synthesisMarkdown"
        value={values.synthesisMarkdown}
      />

      {restored ? (
        <div className="draft-notice" role="status">
          <span>A locally saved draft was restored.</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.localStorage.removeItem(draftKey);
              setValues(initialValue);
              editorRef.current?.setMarkdown(initialValue.synthesisMarkdown);
              setRestored(false);
              setDirty(false);
            }}
          >
            Discard local draft
          </Button>
        </div>
      ) : null}

      <section className="editor-section" aria-labelledby="identity-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Canonical identity</p>
            <h2 id="identity-heading">Name and placement</h2>
          </div>
          <Badge tone={values.contentStatus}>{values.contentStatus}</Badge>
        </div>
        <div className="form-grid form-grid--two">
          <Field label="Canonical name">
            <input
              name="canonicalName"
              value={values.canonicalName}
              onChange={(event) => update("canonicalName", event.target.value)}
              minLength={2}
              maxLength={180}
              required
            />
          </Field>
          <Field
            label="Stable slug"
            hint={
              mode === "update"
                ? "Stable URLs keep the slug fixed after creation."
                : undefined
            }
          >
            <input
              name="slug"
              value={values.slug}
              onChange={(event) => update("slug", event.target.value)}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              readOnly={mode === "update"}
              required
            />
          </Field>
          <Field label="Canonical domain">
            <select
              name="canonicalDomainId"
              value={values.canonicalDomainId}
              onChange={(event) =>
                update("canonicalDomainId", event.target.value)
              }
              required
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.title}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Canonical parent"
            hint="Optional. Cross-domain semantics belong in relations."
          >
            <select
              name="canonicalParentId"
              value={values.canonicalParentId}
              onChange={(event) =>
                update("canonicalParentId", event.target.value)
              }
            >
              <option value="">No parent</option>
              {availableConcepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.canonical_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Concept kind">
            <select
              name="conceptKind"
              value={values.conceptKind}
              onChange={(event) =>
                update(
                  "conceptKind",
                  event.target.value as ConceptEditorValue["conceptKind"],
                )
              }
            >
              {conceptKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              name="priority"
              value={values.priority}
              onChange={(event) =>
                update(
                  "priority",
                  event.target.value as ConceptEditorValue["priority"],
                )
              }
            >
              {contentPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Content status">
            <select
              name="contentStatus"
              value={values.contentStatus}
              onChange={(event) =>
                update(
                  "contentStatus",
                  event.target.value as ConceptEditorValue["contentStatus"],
                )
              }
            >
              {contentStatuses.map((status) => (
                <option
                  key={status}
                  value={status}
                  disabled={status === "reviewed" && !canReview}
                >
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target mastery">
            <select
              name="targetMastery"
              value={values.targetMastery}
              onChange={(event) => update("targetMastery", event.target.value)}
            >
              <option value="">Not set</option>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="editor-section" aria-labelledby="aliases-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Disambiguation</p>
            <h2 id="aliases-heading">Aliases</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              update("aliases", [
                ...values.aliases,
                {
                  value: "",
                  type: "synonym",
                  languageCode: "en",
                  disambiguationKey: null,
                },
              ])
            }
          >
            Add alias
          </Button>
        </div>
        {values.aliases.length === 0 ? (
          <p className="quiet">
            No aliases. Add only meaningful synonyms, abbreviations, or
            qualified terms.
          </p>
        ) : (
          <div className="alias-list">
            {values.aliases.map((alias, index) => (
              <div className="alias-row" key={`${index}-${alias.type}`}>
                <input
                  aria-label={`Alias ${index + 1}`}
                  value={alias.value}
                  onChange={(event) => {
                    const aliases = values.aliases.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, value: event.target.value }
                        : item,
                    );
                    update("aliases", aliases);
                  }}
                  required
                />
                <select
                  aria-label={`Alias ${index + 1} type`}
                  value={alias.type}
                  onChange={(event) => {
                    const aliases = values.aliases.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            type: event.target.value as AliasValue["type"],
                          }
                        : item,
                    );
                    update("aliases", aliases);
                  }}
                >
                  {aliasTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Alias ${index + 1} language`}
                  value={alias.languageCode}
                  onChange={(event) => {
                    const aliases = values.aliases.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, languageCode: event.target.value }
                        : item,
                    );
                    update("aliases", aliases);
                  }}
                  maxLength={16}
                  required
                />
                <input
                  aria-label={`Alias ${index + 1} disambiguation key`}
                  placeholder="Optional qualifier"
                  value={alias.disambiguationKey ?? ""}
                  onChange={(event) => {
                    const aliases = values.aliases.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            disambiguationKey: event.target.value || null,
                          }
                        : item,
                    );
                    update("aliases", aliases);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    update(
                      "aliases",
                      values.aliases.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="editor-section" aria-labelledby="overview-heading">
        <p className="eyebrow">Reading layer</p>
        <h2 id="overview-heading">Definition and synthesis</h2>
        <Field label="Concise definition">
          <textarea
            name="conciseDefinition"
            value={values.conciseDefinition}
            onChange={(event) =>
              update("conciseDefinition", event.target.value)
            }
            maxLength={1200}
            rows={3}
          />
        </Field>
        <div className="ui-field">
          <span className="ui-field__label">Long-form synthesis</span>
          <div className="markdown-editor">
            {ready ? (
              <ForwardRefEditor
                ref={editorRef}
                markdown={values.synthesisMarkdown}
                onChange={(markdown) => update("synthesisMarkdown", markdown)}
                contentEditableClassName="markdown-editor__content"
              />
            ) : (
              <p className="quiet">Loading editor…</p>
            )}
          </div>
        </div>
      </section>

      <details className="editor-section editor-details">
        <summary>Structured explanation fields</summary>
        <p className="quiet">
          Use these fields when the distinction improves reading and retrieval.
        </p>
        {(
          [
            ["whyItExistsMarkdown", "Why it exists / problem explained"],
            ["mechanismMarkdown", "Mechanism or formal treatment"],
            ["examplesMarkdown", "Examples"],
            ["counterexamplesMarkdown", "Counterexamples"],
            ["failureModesMarkdown", "Failure modes and limitations"],
            ["commonConfusionsMarkdown", "Common confusions"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea
              name={key}
              value={values[key]}
              onChange={(event) => update(key, event.target.value)}
              rows={5}
            />
          </Field>
        ))}
      </details>

      <section className="editor-section" aria-labelledby="review-heading">
        <p className="eyebrow">Governance</p>
        <h2 id="review-heading">Review and revision</h2>
        <div className="form-grid form-grid--two">
          <Field label="Review note">
            <textarea
              name="reviewNote"
              value={values.reviewNote}
              onChange={(event) => update("reviewNote", event.target.value)}
              rows={3}
            />
          </Field>
          <Field
            label="Replacement concept"
            hint="Use when deprecating a concept, if a replacement exists."
          >
            <select
              name="replacementConceptId"
              value={values.replacementConceptId}
              onChange={(event) =>
                update("replacementConceptId", event.target.value)
              }
            >
              <option value="">No replacement</option>
              {availableConcepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.canonical_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Revision summary"
          hint="Required. Describe the material reason for this snapshot."
        >
          <input
            name="changeSummary"
            value={values.changeSummary}
            onChange={(event) => update("changeSummary", event.target.value)}
            minLength={3}
            maxLength={500}
            required
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
              ? "Create concept"
              : "Save concept revision"}
        </Button>
        <a
          className="ui-button ui-button--secondary"
          href={mode === "create" ? "/atlas" : `/concepts/${values.slug}`}
        >
          Cancel
        </a>
        {dirty ? (
          <span className="unsaved-indicator">
            Unsaved changes · locally backed up
          </span>
        ) : null}
      </div>
    </form>
  );
}
