"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@loura/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  externalAiPolicies,
  sourceQualities,
  sourceSensitivities,
  sourceTypes,
} from "@/lib/sources/contracts";

type Mode = "file" | "url";

function commaValues(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function metadataFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "other"),
    authors: commaValues(formData.get("authors")).map((name) => ({ name })),
    organization: String(formData.get("organization") ?? ""),
    publicationDate: String(formData.get("publicationDate") ?? ""),
    externalIdentifier: String(formData.get("externalIdentifier") ?? ""),
    quality: String(formData.get("quality") ?? "unknown"),
    sensitivity: String(formData.get("sensitivity") ?? "internal"),
    externalAiPolicy: String(formData.get("externalAiPolicy") ?? "denied"),
    rightsNote: String(formData.get("rightsNote") ?? ""),
    tags: commaValues(formData.get("tags")),
  };
}

async function checksum(file: File) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function inferredMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    {
      md: "text/markdown",
      markdown: "text/markdown",
      html: "text/html",
      htm: "text/html",
      txt: "text/plain",
    }[extension ?? ""] ?? "application/octet-stream"
  );
}

async function responseJson(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String(
            (body as { error?: { message?: string } }).error?.message ??
              "Source request failed.",
          )
        : "Source request failed.";
    throw new Error(message);
  }
  return body as Record<string, string>;
}

export function SourceForm({ workspaceId }: { workspaceId: string }) {
  const [mode, setMode] = useState<Mode>("file");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const metadata = metadataFromForm(formData);
      if (mode === "file") {
        const file = formData.get("file");
        if (!(file instanceof File) || !file.size)
          throw new Error("Choose a source file.");
        const intent = await responseJson(
          await fetch("/api/sources/upload-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              fileName: file.name,
              mimeType: inferredMimeType(file),
              sizeBytes: file.size,
              checksumSha256: await checksum(file),
              metadata,
            }),
          }),
        );
        if (!intent.storagePath || !intent.token || !intent.sourceId) {
          throw new Error("The private upload target was incomplete.");
        }
        const uploaded = await createSupabaseBrowserClient()
          .storage.from("source-files")
          .uploadToSignedUrl(intent.storagePath, intent.token, file, {
            contentType: inferredMimeType(file),
          });
        if (uploaded.error) throw new Error("The private file upload failed.");
        const queued = await responseJson(
          await fetch(`/api/sources/${intent.sourceId}/finalize-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          }),
        );
        if (!queued.jobId)
          throw new Error("The ingestion job was not returned.");
        router.push(`/sources/${intent.sourceId}?job=${queued.jobId}`);
      } else {
        const created = await responseJson(
          await fetch("/api/sources/from-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              url: String(formData.get("url") ?? ""),
              metadata,
            }),
          }),
        );
        if (!created.sourceId || !created.jobId) {
          throw new Error("The URL ingestion job was not returned.");
        }
        router.push(`/sources/${created.sourceId}?job=${created.jobId}`);
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The source could not be added.",
      );
      setPending(false);
    }
  }

  return (
    <form action={submit} className="source-form">
      <fieldset className="source-mode-picker">
        <legend>Source origin</legend>
        <label>
          <input
            type="radio"
            checked={mode === "file"}
            onChange={() => setMode("file")}
          />
          Private file
        </label>
        <label>
          <input
            type="radio"
            checked={mode === "url"}
            onChange={() => setMode("url")}
          />
          Explicit public URL
        </label>
      </fieldset>
      <section className="editor-section">
        <div className="form-grid form-grid--two">
          {mode === "file" ? (
            <Field
              label="Source file"
              hint="PDF, DOCX, PPTX, Markdown, HTML, text, PNG, JPEG, or TIFF. Maximum 50 MB."
            >
              <input name="file" type="file" required />
            </Field>
          ) : (
            <Field
              label="Public HTTP/HTTPS URL"
              hint="Only this URL is fetched. Links are never crawled recursively."
            >
              <input
                name="url"
                type="url"
                required
                placeholder="https://example.org/document.pdf"
              />
            </Field>
          )}
          <Field label="Title">
            <input name="title" required maxLength={240} />
          </Field>
          <Field label="Subtitle">
            <input name="subtitle" maxLength={300} />
          </Field>
          <Field
            label="Authors"
            hint="Comma-separated people or organizations."
          >
            <input name="authors" maxLength={600} />
          </Field>
          <Field label="Organization">
            <input name="organization" maxLength={200} />
          </Field>
          <Field label="Publication date">
            <input name="publicationDate" type="date" />
          </Field>
          <Field
            label="External identifier"
            hint="DOI, ISBN, standard number, or another stable identifier."
          >
            <input name="externalIdentifier" maxLength={200} />
          </Field>
          <Field label="Source type">
            <select
              name="sourceType"
              defaultValue={mode === "url" ? "webpage" : "paper"}
            >
              {sourceTypes.map((value) => (
                <option value={value} key={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quality">
            <select name="quality" defaultValue="unknown">
              {sourceQualities.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sensitivity">
            <select name="sensitivity" defaultValue="internal">
              {sourceSensitivities.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="External AI policy"
            hint="Milestone 5 performs no external AI calls regardless of this future policy."
          >
            <select name="externalAiPolicy" defaultValue="denied">
              {externalAiPolicies.map((value) => (
                <option value={value} key={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags" hint="Comma-separated private workspace labels.">
            <input name="tags" maxLength={500} />
          </Field>
        </div>
        <Field
          label="Rights note"
          hint="Record why this private research copy may be stored and processed."
        >
          <textarea name="rightsNote" required rows={4} maxLength={1000} />
        </Field>
      </section>
      {error ? (
        <p className="message error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="path-editor__actions">
        <Button type="submit" disabled={pending}>
          {pending ? "Securing source…" : "Add and ingest source"}
        </Button>
        <p>
          Original and derived files remain private. Source text is never
          treated as instructions.
        </p>
      </div>
    </form>
  );
}
