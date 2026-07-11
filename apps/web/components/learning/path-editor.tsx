"use client";

import { useMemo, useState } from "react";

import { saveLearningPathAction } from "@/app/(workspace)/learning-actions";
import type { LearningPathInput } from "@/lib/learning/contracts";
import { MASTERY_LEVEL_LABELS } from "@/lib/learning/contracts";

type ConceptOption = { slug: string; name: string; domainTitle: string };

export function PathEditor({
  initial,
  concepts,
}: {
  initial: LearningPathInput;
  concepts: ConceptOption[];
}) {
  const [path, setPath] = useState(initial);
  const payload = useMemo(() => JSON.stringify(path), [path]);
  const updateStep = (
    index: number,
    change: Partial<LearningPathInput["steps"][number]>,
  ) => {
    setPath((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...change } : step,
      ),
    }));
  };
  const move = (index: number, offset: number) => {
    const destination = index + offset;
    if (destination < 0 || destination >= path.steps.length) return;
    setPath((current) => {
      const steps = [...current.steps];
      [steps[index], steps[destination]] = [steps[destination]!, steps[index]!];
      return {
        ...current,
        steps: steps.map((step, stepIndex) => ({
          ...step,
          stepOrder: stepIndex + 1,
        })),
      };
    });
  };

  return (
    <form action={saveLearningPathAction} className="path-editor">
      <input type="hidden" name="payload" value={payload} />
      <div className="editor-grid">
        <label>
          <span>Path title</span>
          <input
            value={path.title}
            onChange={(event) =>
              setPath({ ...path, title: event.target.value })
            }
            required
          />
        </label>
        <label>
          <span>Stable slug</span>
          <input
            value={path.slug}
            onChange={(event) => setPath({ ...path, slug: event.target.value })}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
        </label>
        <label>
          <span>Content status</span>
          <select
            value={path.contentStatus}
            onChange={(event) =>
              setPath({
                ...path,
                contentStatus: event.target
                  .value as LearningPathInput["contentStatus"],
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="reviewed">Reviewed</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </label>
      </div>
      <label>
        <span>Purpose</span>
        <textarea
          rows={4}
          value={path.purposeMarkdown}
          onChange={(event) =>
            setPath({ ...path, purposeMarkdown: event.target.value })
          }
          required
        />
      </label>
      <label>
        <span>Target outcome</span>
        <textarea
          rows={4}
          value={path.targetOutcomeMarkdown}
          onChange={(event) =>
            setPath({ ...path, targetOutcomeMarkdown: event.target.value })
          }
          required
        />
      </label>

      <section
        className="path-editor__steps"
        aria-labelledby="path-steps-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ordered route</p>
            <h2 id="path-steps-heading">Path steps</h2>
          </div>
          <button
            className="ui-button ui-button--secondary"
            type="button"
            onClick={() =>
              setPath((current) => ({
                ...current,
                steps: [
                  ...current.steps,
                  {
                    conceptSlug: concepts[0]?.slug ?? "",
                    stepOrder: current.steps.length + 1,
                    branchKey: "main",
                    mandatory: true,
                    rationale: "",
                    learningObjective: "",
                    targetMastery: 1,
                    requiredPriorMastery: 1,
                    exerciseMarkdown: "",
                  },
                ],
              }))
            }
          >
            Add step
          </button>
        </div>
        {path.steps.map((step, index) => (
          <fieldset
            className="path-step-editor"
            key={`${index}-${step.conceptSlug}`}
          >
            <legend>Step {index + 1}</legend>
            <div className="path-step-editor__actions">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === path.steps.length - 1}
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() =>
                  setPath((current) => ({
                    ...current,
                    steps: current.steps
                      .filter((_, stepIndex) => stepIndex !== index)
                      .map((item, stepIndex) => ({
                        ...item,
                        stepOrder: stepIndex + 1,
                      })),
                  }))
                }
                disabled={path.steps.length === 1}
              >
                Remove
              </button>
            </div>
            <div className="editor-grid">
              <label>
                <span>Concept</span>
                <select
                  value={step.conceptSlug}
                  onChange={(event) =>
                    updateStep(index, { conceptSlug: event.target.value })
                  }
                >
                  {concepts.map((concept) => (
                    <option value={concept.slug} key={concept.slug}>
                      {concept.name} · {concept.domainTitle}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Target mastery</span>
                <select
                  value={step.targetMastery}
                  onChange={(event) =>
                    updateStep(index, {
                      targetMastery: Number(event.target.value),
                    })
                  }
                >
                  {MASTERY_LEVEL_LABELS.map((label, level) => (
                    <option value={level} key={label}>
                      {level} · {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Prerequisite threshold</span>
                <select
                  value={step.requiredPriorMastery}
                  onChange={(event) =>
                    updateStep(index, {
                      requiredPriorMastery: Number(event.target.value),
                    })
                  }
                >
                  {MASTERY_LEVEL_LABELS.map((label, level) => (
                    <option value={level} key={label}>
                      {level} · {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Why this step appears here</span>
              <textarea
                value={step.rationale}
                onChange={(event) =>
                  updateStep(index, { rationale: event.target.value })
                }
                rows={2}
              />
            </label>
            <label>
              <span>Learning objective</span>
              <textarea
                value={step.learningObjective}
                onChange={(event) =>
                  updateStep(index, { learningObjective: event.target.value })
                }
                rows={2}
              />
            </label>
            <label>
              <span>Applied exercise</span>
              <textarea
                value={step.exerciseMarkdown}
                onChange={(event) =>
                  updateStep(index, { exerciseMarkdown: event.target.value })
                }
                rows={3}
              />
            </label>
          </fieldset>
        ))}
      </section>
      <div className="path-editor__actions">
        <button className="ui-button ui-button--primary" type="submit">
          Save learning path
        </button>
        <p>
          Saving replaces the ordered step set transactionally and creates an
          audit event.
        </p>
      </div>
    </form>
  );
}
