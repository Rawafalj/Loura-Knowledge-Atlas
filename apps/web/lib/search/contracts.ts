import { z } from "zod";

export const searchMatchReasons = [
  "title",
  "alias",
  "lexical",
  "semantic",
  "citation",
] as const;

export const searchInputSchema = z.object({
  query: z.string().trim().min(2).max(200),
  scope: z
    .object({
      domainIds: z.array(z.uuid()).max(20).default([]),
      contentStatuses: z
        .array(z.enum(["draft", "reviewed", "deprecated"]))
        .max(3)
        .default(["reviewed", "draft"]),
      sourceTypes: z.array(z.string().max(40)).max(20).default([]),
      sourceQualities: z.array(z.string().max(40)).max(20).default([]),
    })
    .default({
      domainIds: [],
      contentStatuses: ["reviewed", "draft"],
      sourceTypes: [],
      sourceQualities: [],
    }),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchRequestSchema = searchInputSchema.extend({
  workspaceId: z.uuid(),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchMatchReason = (typeof searchMatchReasons)[number];

export const searchResultSchema = z.object({
  id: z.uuid(),
  type: z.enum(["concept", "source"]),
  title: z.string(),
  subtitle: z.string().optional(),
  score: z.number(),
  matchReasons: z.array(z.enum(searchMatchReasons)),
  matchDetail: z.string().optional(),
  snippet: z.string().optional(),
  route: z.string().startsWith("/"),
  contentStatus: z.enum(["draft", "reviewed", "deprecated"]).optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  concepts: z.array(searchResultSchema),
  sources: z.array(searchResultSchema),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
