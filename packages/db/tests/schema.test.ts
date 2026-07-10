import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  auditEvents,
  conceptAliases,
  conceptRelations,
  conceptRevisions,
  concepts,
  domains,
  profiles,
  relationTypes,
  workspaceMembers,
  workspaces,
} from "../src/schema";

describe("canonical Milestone 1 schema", () => {
  it("defines the complete canonical table set", () => {
    const tables = [
      profiles,
      workspaces,
      workspaceMembers,
      domains,
      concepts,
      conceptAliases,
      relationTypes,
      conceptRelations,
      conceptRevisions,
      auditEvents,
    ];

    expect(tables.map(getTableName)).toEqual([
      "profiles",
      "workspaces",
      "workspace_members",
      "domains",
      "concepts",
      "concept_aliases",
      "relation_types",
      "concept_relations",
      "concept_revisions",
      "audit_events",
    ]);
  });
});
