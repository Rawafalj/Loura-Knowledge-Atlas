"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@loura/ui";

type Job = {
  id: string;
  status: string;
  stage: string;
  progress: string | number;
  attempt_count: number;
  error_code: string | null;
  error_message_sanitized: string | null;
};

const terminal = new Set(["completed", "failed", "dead_letter"]);

export function JobProgress({
  initialJob,
  workspaceId,
}: {
  initialJob: Job;
  workspaceId: string;
}) {
  const [job, setJob] = useState(initialJob);
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (terminal.has(job.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/jobs/${job.id}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const next = (await response.json()) as Job;
      setJob(next);
      if (terminal.has(next.status)) router.refresh();
    }, 1_500);
    return () => window.clearInterval(timer);
  }, [job.id, job.status, router]);

  async function retry() {
    setRetrying(true);
    const response = await fetch(`/api/jobs/${job.id}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    if (response.ok) {
      setJob({ ...job, status: "queued", stage: "download", progress: 0 });
      router.refresh();
    }
    setRetrying(false);
  }

  const progress = Number(job.progress);
  return (
    <section
      className="job-progress"
      aria-live="polite"
      aria-label="Ingestion progress"
    >
      <div>
        <span className={`source-status source-status--${job.status}`}>
          {job.status.replaceAll("_", " ")}
        </span>
        <strong>
          {job.stage} · {Number.isFinite(progress) ? progress : 0}%
        </strong>
        <small>Attempt {job.attempt_count}</small>
      </div>
      <div className="progress-track" aria-label={`${progress}% complete`}>
        <span style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
      </div>
      {job.error_message_sanitized ? (
        <p className="message error">
          {job.error_message_sanitized} <code>{job.error_code}</code>
        </p>
      ) : null}
      {["failed", "dead_letter"].includes(job.status) ? (
        <Button
          type="button"
          variant="secondary"
          disabled={retrying}
          onClick={retry}
        >
          {retrying ? "Retrying…" : "Retry safely"}
        </Button>
      ) : null}
    </section>
  );
}
