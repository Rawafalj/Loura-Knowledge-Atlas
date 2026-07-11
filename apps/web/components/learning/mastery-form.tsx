import { updateMasteryAction } from "@/app/(workspace)/learning-actions";
import { MASTERY_LEVEL_LABELS } from "@/lib/learning/contracts";

export function MasteryForm({
  concept,
  currentLevel,
  targetLevel,
  status,
  returnTo,
  compact = false,
}: {
  concept: { id: string; slug: string; name: string };
  currentLevel: number;
  targetLevel: number;
  status: string;
  returnTo: string;
  compact?: boolean;
}) {
  return (
    <form action={updateMasteryAction} className="mastery-form">
      <input type="hidden" name="conceptId" value={concept.id} />
      <input type="hidden" name="conceptSlug" value={concept.slug} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {!compact ? <h3>Record mastery evidence</h3> : null}
      <div className="mastery-form__levels">
        <label>
          <span>Current level</span>
          <select name="currentLevel" defaultValue={currentLevel}>
            {MASTERY_LEVEL_LABELS.map((label, level) => (
              <option value={level} key={label}>
                {level} · {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Target level</span>
          <select name="targetLevel" defaultValue={targetLevel}>
            {MASTERY_LEVEL_LABELS.map((label, level) => (
              <option value={level} key={label}>
                {level} · {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Learning status</span>
        <select name="status" defaultValue={status}>
          <option value="not_started">Not started</option>
          <option value="learning">Learning</option>
          <option value="applied">Applied</option>
          <option value="mastered">Mastered</option>
          <option value="revisit">Needs revisit</option>
        </select>
      </label>
      <label>
        <span>Evidence type</span>
        <select name="evidenceType" defaultValue="self_assessment">
          <option value="self_assessment">Self-assessment</option>
          <option value="explanation">Explanation</option>
          <option value="quiz">Quiz</option>
          <option value="applied_analysis">Applied analysis</option>
          <option value="design_artifact">Design artifact</option>
          <option value="critique">Critique</option>
          <option value="external_evaluation">External evaluation</option>
        </select>
      </label>
      <label>
        <span>Evidence note</span>
        <textarea
          name="note"
          rows={compact ? 3 : 4}
          placeholder={`What demonstrates your understanding of ${concept.name}?`}
        />
      </label>
      <label>
        <span>Artifact URL (optional)</span>
        <input name="artifactUrl" type="url" placeholder="https://…" />
      </label>
      <button className="ui-button ui-button--primary" type="submit">
        Save evidence and mastery
      </button>
      <p className="form-help">
        Page views never change mastery. This update creates an immutable
        evidence entry.
      </p>
    </form>
  );
}
