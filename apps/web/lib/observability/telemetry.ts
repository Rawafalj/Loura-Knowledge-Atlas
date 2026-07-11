const REDACTED_KEYS = new Set([
  "question",
  "answer",
  "prompt",
  "sourceText",
  "text",
  "markdown",
  "rawOutput",
]);

export type ProductEvent =
  | "search.completed"
  | "ask.completed"
  | "source.ingestion.submitted"
  | "application.created";

export function redactTelemetryProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties).flatMap(([key, value]) => {
      if (REDACTED_KEYS.has(key)) return [];
      if (typeof value === "string" && value.length > 500) {
        return [[key, value.slice(0, 500)]];
      }
      return [[key, value]];
    }),
  );
}

/**
 * Product analytics is intentionally opt-in and metadata-only. A provider can
 * be added later without changing call sites or allowing source text into a
 * generic analytics stream.
 */
export function trackProductEvent(
  _event: ProductEvent,
  properties: Record<string, unknown> = {},
) {
  if (process.env.PRODUCT_ANALYTICS_ENABLED !== "true") return;
  const safeProperties = redactTelemetryProperties(properties);
  // Keep the default sink out of the browser and out of user-visible output.
  void safeProperties;
}
