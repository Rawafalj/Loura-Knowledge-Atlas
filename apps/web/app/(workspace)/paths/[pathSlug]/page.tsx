import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@loura/ui";

import { MasteryForm } from "@/components/learning/mastery-form";
import { Markdown } from "@/components/markdown";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { MASTERY_LEVEL_LABELS } from "@/lib/learning/contracts";
import { getLearningPath } from "@/lib/learning/service";
import { saveWaiverAction } from "../../learning-actions";

export default async function LearningPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ pathSlug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ pathSlug }, query] = await Promise.all([params, searchParams]);
  const { user, membership } = await requireWorkspaceMembership();
  const path = await getLearningPath(membership.workspaceId, user.id, pathSlug);
  if (!path) notFound();
  const canEdit = membership.role !== "viewer";
  const next = path.steps.find((step) => step.id === path.nextReadyStepId);
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/paths">Learning paths</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{path.title}</span>
      </nav>
      <PageHeader
        eyebrow="Learn · Prerequisite-aware route"
        title={path.title}
        description={<Markdown>{path.purposeMarkdown}</Markdown>}
        actions={
          canEdit ? (
            <Link
              className="ui-button ui-button--secondary"
              href={`/paths/${path.slug}/edit`}
            >
              Edit path
            </Link>
          ) : (
            <Badge>Read only structure</Badge>
          )
        }
      />
      {query.saved ? (
        <p className="form-banner form-banner--success" role="status">
          Learning state saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-banner form-banner--error" role="alert">
          {query.error}
        </p>
      ) : null}
      <div className="path-overview-grid">
        <section>
          <p className="eyebrow">Target outcome</p>
          <Markdown>{path.targetOutcomeMarkdown}</Markdown>
        </section>
        <section>
          <p className="eyebrow">Current progress</p>
          <strong className="path-progress-number">
            {path.progressPercent}%
          </strong>
          <div
            className="progress-track"
            aria-label={`${path.progressPercent}% complete`}
          >
            <span style={{ width: `${path.progressPercent}%` }} />
          </div>
        </section>
        <section>
          <p className="eyebrow">Next ready</p>
          {next ? (
            <>
              <strong>{next.conceptName}</strong>
              <Link href={`/concepts/${next.conceptSlug}`}>
                Continue concept →
              </Link>
            </>
          ) : (
            <p>Complete or unblock an earlier target to continue.</p>
          )}
        </section>
      </div>

      {path.validationIssues.length ? (
        <aside className="validation-notice" role="status">
          <strong>
            Route validation found {path.validationIssues.length} prerequisite
            issue(s).
          </strong>
          <p>
            These steps require earlier placement, sufficient existing mastery,
            or a learner waiver with a reason.
          </p>
        </aside>
      ) : null}

      <ol className="learning-route">
        {path.steps.map((step) => {
          const isNext = step.id === path.nextReadyStepId;
          const state = step.readiness.complete
            ? "complete"
            : step.readiness.ready
              ? "ready"
              : "blocked";
          return (
            <li
              className={`learning-step learning-step--${state}`}
              key={step.id}
              aria-current={isNext ? "step" : undefined}
            >
              <div className="learning-step__number">{step.stepOrder}</div>
              <div className="learning-step__body">
                <div className="learning-step__header">
                  <div>
                    <p className="eyebrow">{step.domainTitle}</p>
                    <h2>
                      <Link href={`/concepts/${step.conceptSlug}`}>
                        {step.conceptName}
                      </Link>
                    </h2>
                  </div>
                  <div className="learning-step__badges">
                    <Badge
                      tone={
                        state === "complete"
                          ? "reviewed"
                          : state === "ready"
                            ? "accent"
                            : "draft"
                      }
                    >
                      {state}
                    </Badge>
                    <span>
                      Level {step.readiness.currentLevel}/{step.targetMastery} ·{" "}
                      {MASTERY_LEVEL_LABELS[step.targetMastery]}
                    </span>
                  </div>
                </div>
                <p>{step.definition}</p>
                {step.rationale ? (
                  <p>
                    <strong>Why here:</strong> {step.rationale}
                  </p>
                ) : null}
                {step.learningObjective ? (
                  <p>
                    <strong>Learning objective:</strong>{" "}
                    {step.learningObjective}
                  </p>
                ) : null}
                {step.readiness.blockers.length ? (
                  <div className="readiness-blockers">
                    <strong>Blocked by</strong>
                    <ul>
                      {step.readiness.blockers.slice(0, 3).map((blocker) => (
                        <li key={`${blocker.kind}-${blocker.conceptId}`}>
                          {blocker.conceptName}: level {blocker.currentLevel},
                          requires {blocker.requiredLevel}
                          {blocker.kind === "prerequisite"
                            ? " prerequisite threshold"
                            : " path target"}
                        </li>
                      ))}
                    </ul>
                    {step.readiness.blockers.length > 3 ? (
                      <small>
                        +{step.readiness.blockers.length - 3} additional earlier
                        target(s)
                      </small>
                    ) : null}
                  </div>
                ) : (
                  <p className="ready-explanation">
                    All mandatory prior targets and explicit prerequisites are
                    satisfied.
                  </p>
                )}
                {step.readiness.waivedPrerequisites.length ? (
                  <p className="waiver-note">
                    Waived with reason:{" "}
                    {step.readiness.waivedPrerequisites
                      .map((waiver) => waiver.reason)
                      .join("; ")}
                  </p>
                ) : null}
                {step.exerciseMarkdown ? (
                  <details>
                    <summary>Applied exercise</summary>
                    <Markdown>{step.exerciseMarkdown}</Markdown>
                  </details>
                ) : null}
                {step.readiness.blockers
                  .filter((blocker) => blocker.kind === "prerequisite")
                  .map((blocker) => (
                    <details
                      key={`waive-${blocker.conceptId}`}
                      className="waiver-form"
                    >
                      <summary>
                        Waive {blocker.conceptName} for this route
                      </summary>
                      <form action={saveWaiverAction}>
                        <input type="hidden" name="pathId" value={path.id} />
                        <input
                          type="hidden"
                          name="pathSlug"
                          value={path.slug}
                        />
                        <input
                          type="hidden"
                          name="targetConceptId"
                          value={step.conceptId}
                        />
                        <input
                          type="hidden"
                          name="prerequisiteConceptId"
                          value={blocker.conceptId}
                        />
                        <label>
                          <span>Reason</span>
                          <textarea
                            name="reason"
                            required
                            minLength={3}
                            rows={2}
                          />
                        </label>
                        <button
                          className="ui-button ui-button--secondary"
                          type="submit"
                        >
                          Record waiver
                        </button>
                      </form>
                    </details>
                  ))}
                <details className="step-mastery-control">
                  <summary>Add mastery evidence</summary>
                  <MasteryForm
                    compact
                    concept={{
                      id: step.conceptId,
                      slug: step.conceptSlug,
                      name: step.conceptName,
                    }}
                    currentLevel={step.readiness.currentLevel}
                    targetLevel={step.targetMastery}
                    status={
                      step.readiness.complete
                        ? "mastered"
                        : step.readiness.currentLevel
                          ? "learning"
                          : "not_started"
                    }
                    returnTo={`/paths/${path.slug}`}
                  />
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
