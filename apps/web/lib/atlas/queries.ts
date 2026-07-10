import type { Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DomainRow = Tables<"domains">;
type ConceptRow = Tables<"concepts">;
type AliasRow = Tables<"concept_aliases">;
type RelationRow = Tables<"concept_relations">;
type RelationTypeRow = Tables<"relation_types">;
type RevisionRow = Tables<"concept_revisions">;

export type ConceptSummary = Pick<
  ConceptRow,
  | "id"
  | "slug"
  | "canonical_name"
  | "concise_definition"
  | "canonical_domain_id"
  | "canonical_parent_id"
  | "concept_kind"
  | "content_status"
  | "priority"
>;

export type DomainTreeNode = DomainRow & { children: DomainTreeNode[] };
export type ConceptTreeNode = ConceptSummary & { children: ConceptTreeNode[] };

export type WorldDomain = DomainRow & {
  conceptCount: number;
  reviewedCount: number;
  reviewedCoverage: number;
  keyConcepts: ConceptSummary[];
};

export type WorldMap = {
  roots: WorldDomain[];
  core: WorldDomain[];
  overlays: WorldDomain[];
  concepts: ConceptSummary[];
};

export type RelationView = {
  id: string;
  updatedAt: string;
  direction: "outgoing" | "incoming";
  label: string;
  relationKey: string;
  category: RelationTypeRow["category"];
  description: string | null;
  reviewStatus: RelationRow["review_status"];
  otherConcept: ConceptSummary;
  sourceConceptId: string;
  targetConceptId: string;
  relationTypeId: string;
};

export type ConceptRevisionView = RevisionRow & { actorName: string | null };

export type ConceptView = {
  concept: ConceptRow;
  domain: DomainRow;
  parent: ConceptSummary | null;
  replacement: ConceptSummary | null;
  aliases: AliasRow[];
  relations: RelationView[];
  revisions: ConceptRevisionView[];
};

export type AuthoringOptions = {
  domains: DomainRow[];
  concepts: ConceptSummary[];
  relationTypes: RelationTypeRow[];
};

const priorityOrder: Record<ConceptRow["priority"], number> = {
  now: 0,
  next: 1,
  later: 2,
  reference: 3,
};

function sortConcepts<
  T extends Pick<ConceptRow, "canonical_name" | "priority">,
>(items: T[]): T[] {
  return items.sort(
    (left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority] ||
      left.canonical_name.localeCompare(right.canonical_name),
  );
}

export function organizeWorldDomains(
  domains: DomainRow[],
  concepts: ConceptSummary[],
): WorldMap {
  const worldDomains = domains.map((domain) => {
    const domainConcepts = concepts.filter(
      (concept) => concept.canonical_domain_id === domain.id,
    );
    const reviewedCount = domainConcepts.filter(
      (concept) => concept.content_status === "reviewed",
    ).length;
    return {
      ...domain,
      conceptCount: domainConcepts.length,
      reviewedCount,
      reviewedCoverage:
        domainConcepts.length === 0
          ? 0
          : Math.round((reviewedCount / domainConcepts.length) * 100),
      keyConcepts: sortConcepts(
        domainConcepts.filter(
          (concept) => concept.content_status !== "deprecated",
        ),
      ).slice(0, 3),
    };
  });
  return {
    roots: worldDomains.filter((domain) => domain.kind === "root"),
    core: worldDomains.filter((domain) => domain.kind === "core"),
    overlays: worldDomains.filter((domain) => domain.kind === "overlay"),
    concepts: sortConcepts([...concepts]),
  };
}

export function buildDomainTree(
  domains: DomainRow[],
  rootId: string,
): DomainTreeNode | null {
  const byParent = new Map<string | null, DomainRow[]>();
  for (const domain of domains) {
    const siblings = byParent.get(domain.parent_domain_id) ?? [];
    siblings.push(domain);
    byParent.set(domain.parent_domain_id, siblings);
  }
  const build = (domain: DomainRow): DomainTreeNode => ({
    ...domain,
    children: (byParent.get(domain.id) ?? [])
      .sort(
        (left, right) =>
          left.sort_order - right.sort_order ||
          left.title.localeCompare(right.title),
      )
      .map(build),
  });
  const root = domains.find((domain) => domain.id === rootId);
  return root ? build(root) : null;
}

export function flattenDomainTree(root: DomainTreeNode): DomainTreeNode[] {
  return [root, ...root.children.flatMap(flattenDomainTree)];
}

export function buildConceptTree(
  concepts: ConceptSummary[],
): ConceptTreeNode[] {
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const byParent = new Map<string | null, ConceptSummary[]>();
  for (const concept of concepts) {
    const parent =
      concept.canonical_parent_id && conceptIds.has(concept.canonical_parent_id)
        ? concept.canonical_parent_id
        : null;
    const siblings = byParent.get(parent) ?? [];
    siblings.push(concept);
    byParent.set(parent, siblings);
  }
  const build = (concept: ConceptSummary): ConceptTreeNode => ({
    ...concept,
    children: sortConcepts(byParent.get(concept.id) ?? []).map(build),
  });
  return sortConcepts(byParent.get(null) ?? []).map(build);
}

export function mapRelations(
  selectedConceptId: string,
  relations: RelationRow[],
  concepts: ConceptSummary[],
  relationTypes: RelationTypeRow[],
): RelationView[] {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const typeById = new Map(
    relationTypes.map((relationType) => [relationType.id, relationType]),
  );
  return relations.flatMap((relation) => {
    const relationType = typeById.get(relation.relation_type_id);
    const outgoing = relation.source_concept_id === selectedConceptId;
    const otherConcept = conceptById.get(
      outgoing ? relation.target_concept_id : relation.source_concept_id,
    );
    if (!relationType || !otherConcept) return [];
    return [
      {
        id: relation.id,
        updatedAt: relation.updated_at,
        direction: outgoing ? "outgoing" : "incoming",
        label: outgoing
          ? relationType.forward_label
          : relationType.inverse_label,
        relationKey: relationType.key,
        category: relationType.category,
        description: relation.description,
        reviewStatus: relation.review_status,
        otherConcept,
        sourceConceptId: relation.source_concept_id,
        targetConceptId: relation.target_concept_id,
        relationTypeId: relation.relation_type_id,
      } satisfies RelationView,
    ];
  });
}

export async function getWorldMap(workspaceId: string): Promise<WorldMap> {
  const supabase = await createSupabaseServerClient();
  const [domainsResult, conceptsResult] = await Promise.all([
    supabase
      .from("domains")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("concepts")
      .select(
        "id, slug, canonical_name, concise_definition, canonical_domain_id, canonical_parent_id, concept_kind, content_status, priority",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
  ]);
  if (domainsResult.error)
    throw new Error(`Unable to load domains: ${domainsResult.error.code}`);
  if (conceptsResult.error)
    throw new Error(`Unable to load concepts: ${conceptsResult.error.code}`);
  return organizeWorldDomains(domainsResult.data, conceptsResult.data);
}

export async function getDomainView(workspaceId: string, slug: string) {
  const supabase = await createSupabaseServerClient();
  const [domainsResult, conceptsResult] = await Promise.all([
    supabase
      .from("domains")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("concepts")
      .select(
        "id, slug, canonical_name, concise_definition, canonical_domain_id, canonical_parent_id, concept_kind, content_status, priority",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
  ]);
  if (domainsResult.error)
    throw new Error(`Unable to load domains: ${domainsResult.error.code}`);
  if (conceptsResult.error)
    throw new Error(`Unable to load concepts: ${conceptsResult.error.code}`);
  const domain = domainsResult.data.find(
    (candidate) => candidate.slug === slug,
  );
  if (!domain) return null;
  const domainTree = buildDomainTree(domainsResult.data, domain.id);
  if (!domainTree) return null;
  const domainIds = new Set(
    flattenDomainTree(domainTree).map((candidate) => candidate.id),
  );
  const concepts = conceptsResult.data.filter((concept) =>
    domainIds.has(concept.canonical_domain_id),
  );
  return {
    domain,
    domainTree,
    conceptTree: buildConceptTree(concepts),
    concepts: sortConcepts(concepts),
  };
}

export async function getConceptView(
  workspaceId: string,
  slug: string,
): Promise<ConceptView | null> {
  const supabase = await createSupabaseServerClient();
  const { data: concept, error: conceptError } = await supabase
    .from("concepts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (conceptError)
    throw new Error(`Unable to load concept: ${conceptError.code}`);
  if (!concept) return null;

  const [
    domainResult,
    aliasesResult,
    relationsResult,
    revisionsResult,
    conceptsResult,
    typesResult,
  ] = await Promise.all([
    supabase
      .from("domains")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", concept.canonical_domain_id)
      .single(),
    supabase
      .from("concept_aliases")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("concept_id", concept.id)
      .order("alias_normalized"),
    supabase
      .from("concept_relations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .or(
        `source_concept_id.eq.${concept.id},target_concept_id.eq.${concept.id}`,
      )
      .order("created_at"),
    supabase
      .from("concept_revisions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("concept_id", concept.id)
      .order("revision_number", { ascending: false }),
    supabase
      .from("concepts")
      .select(
        "id, slug, canonical_name, concise_definition, canonical_domain_id, canonical_parent_id, concept_kind, content_status, priority",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase.from("relation_types").select("*").eq("workspace_id", workspaceId),
  ]);
  if (domainResult.error)
    throw new Error(
      `Unable to load concept domain: ${domainResult.error.code}`,
    );
  if (aliasesResult.error)
    throw new Error(`Unable to load aliases: ${aliasesResult.error.code}`);
  if (relationsResult.error)
    throw new Error(`Unable to load relations: ${relationsResult.error.code}`);
  if (revisionsResult.error)
    throw new Error(`Unable to load revisions: ${revisionsResult.error.code}`);
  if (conceptsResult.error)
    throw new Error(
      `Unable to load related concepts: ${conceptsResult.error.code}`,
    );
  if (typesResult.error)
    throw new Error(`Unable to load relation types: ${typesResult.error.code}`);

  const actorIds = [
    ...new Set(revisionsResult.data.map((revision) => revision.created_by)),
  ];
  const profilesResult = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds)
    : { data: [], error: null };
  if (profilesResult.error)
    throw new Error(
      `Unable to load revision actors: ${profilesResult.error.code}`,
    );
  const actorById = new Map(
    profilesResult.data.map((profile) => [profile.id, profile.display_name]),
  );
  const conceptById = new Map(
    conceptsResult.data.map((candidate) => [candidate.id, candidate]),
  );

  return {
    concept,
    domain: domainResult.data,
    parent: concept.canonical_parent_id
      ? (conceptById.get(concept.canonical_parent_id) ?? null)
      : null,
    replacement: concept.replacement_concept_id
      ? (conceptById.get(concept.replacement_concept_id) ?? null)
      : null,
    aliases: aliasesResult.data,
    relations: mapRelations(
      concept.id,
      relationsResult.data,
      conceptsResult.data,
      typesResult.data,
    ),
    revisions: revisionsResult.data.map((revision) => ({
      ...revision,
      actorName: actorById.get(revision.created_by) ?? null,
    })),
  };
}

export async function getAuthoringOptions(
  workspaceId: string,
): Promise<AuthoringOptions> {
  const supabase = await createSupabaseServerClient();
  const [domainsResult, conceptsResult, typesResult] = await Promise.all([
    supabase
      .from("domains")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("concepts")
      .select(
        "id, slug, canonical_name, concise_definition, canonical_domain_id, canonical_parent_id, concept_kind, content_status, priority",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("canonical_name"),
    supabase
      .from("relation_types")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("category")
      .order("forward_label"),
  ]);
  if (domainsResult.error || conceptsResult.error || typesResult.error) {
    throw new Error("Unable to load atlas authoring options");
  }
  return {
    domains: domainsResult.data,
    concepts: conceptsResult.data,
    relationTypes: typesResult.data,
  };
}

export async function getRelationById(workspaceId: string, relationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("concept_relations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", relationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`Unable to load relation: ${error.code}`);
  return data;
}
