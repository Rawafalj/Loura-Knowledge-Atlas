import { parse as parseYaml } from "yaml";
import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const relationKeyPattern = /^[a-z][a-z0-9_]*$/;

export const workspaceRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const contentStatusSchema = z.enum(["draft", "reviewed", "deprecated"]);
export const prioritySchema = z.enum(["now", "next", "later", "reference"]);
export const conceptKindSchema = z.enum([
  "concept",
  "theory",
  "mechanism",
  "method",
  "standard",
  "model",
  "tool",
]);
export const aliasTypeSchema = z.enum([
  "synonym",
  "abbreviation",
  "former_name",
  "translation",
  "common_misnomer",
]);
export const relationCategorySchema = z.enum([
  "hierarchy",
  "learning",
  "explanatory",
  "contrast",
  "operational",
  "application",
  "epistemic",
]);

const domainSeedSchema = z.object({
  slug: z.string().regex(slugPattern),
  title: z.string().min(1),
  kind: z.enum(["root", "core", "overlay"]),
  shortDescription: z.string().min(1),
  scopeMarkdown: z.string().default(""),
  parent: z.string().regex(slugPattern).nullable().default(null),
  status: contentStatusSchema.default("draft"),
  priority: prioritySchema.default("later"),
  targetMastery: z.number().int().min(0).max(5).nullable().default(null),
  sortOrder: z.number().int().default(0),
});

const conceptAliasSeedSchema = z.object({
  value: z.string().min(1),
  type: aliasTypeSchema.default("synonym"),
  languageCode: z.string().min(2).max(16).default("en"),
  disambiguationKey: z.string().min(1).nullable().default(null),
});

const conceptSeedSchema = z.object({
  slug: z.string().regex(slugPattern),
  canonicalName: z.string().min(1),
  domain: z.string().regex(slugPattern),
  parent: z.string().regex(slugPattern).nullable().default(null),
  kind: conceptKindSchema.default("concept"),
  status: contentStatusSchema.default("draft"),
  priority: prioritySchema.default("later"),
  targetMastery: z.number().int().min(0).max(5).nullable().default(null),
  conciseDefinition: z.string().default(""),
  synthesisMarkdown: z.string().default(""),
  aliases: z.array(conceptAliasSeedSchema).default([]),
});

const relationTypeSeedSchema = z.object({
  key: z.string().regex(relationKeyPattern),
  forwardLabel: z.string().min(1),
  inverseLabel: z.string().min(1),
  category: relationCategorySchema,
  directed: z.boolean(),
  symmetric: z.boolean().default(false),
  acyclic: z.boolean().default(false),
  allowsSelf: z.boolean().default(false),
  allowedSourceKinds: z.array(conceptKindSchema).default([]),
  allowedTargetKinds: z.array(conceptKindSchema).default([]),
  isSystem: z.boolean().default(true),
});

const conceptRelationSeedSchema = z.object({
  source: z.string().regex(slugPattern),
  type: z.string().regex(relationKeyPattern),
  target: z.string().regex(slugPattern),
  description: z.string().nullable().default(null),
  status: z.enum(["draft", "reviewed", "deprecated"]).default("draft"),
});

function normalizeAlias(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ");
}

function findCycle(nodes: ReadonlyMap<string, string | null>): string[] | null {
  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];

  const visit = (node: string): string[] | null => {
    if (active.has(node)) {
      const start = path.indexOf(node);
      return [...path.slice(start), node];
    }
    if (visited.has(node)) return null;

    visited.add(node);
    active.add(node);
    path.push(node);
    const parent = nodes.get(node);
    const cycle = parent && nodes.has(parent) ? visit(parent) : null;
    path.pop();
    active.delete(node);
    return cycle;
  };

  for (const node of nodes.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}

function findDirectedCycle(
  edges: ReadonlyMap<string, readonly string[]>,
): string[] | null {
  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];

  const visit = (node: string): string[] | null => {
    if (active.has(node)) {
      const start = path.indexOf(node);
      return [...path.slice(start), node];
    }
    if (visited.has(node)) return null;
    visited.add(node);
    active.add(node);
    path.push(node);
    for (const target of edges.get(node) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    path.pop();
    active.delete(node);
    return null;
  };

  for (const node of edges.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}

export const atlasSeedSchema = z
  .object({
    version: z.literal(1),
    domains: z.array(domainSeedSchema),
    relationTypes: z.array(relationTypeSeedSchema),
    concepts: z.array(conceptSeedSchema).default([]),
    relations: z.array(conceptRelationSeedSchema).default([]),
  })
  .superRefine((seed, context) => {
    const domainSlugs = new Set<string>();
    for (const [index, domain] of seed.domains.entries()) {
      if (domainSlugs.has(domain.slug)) {
        context.addIssue({
          code: "custom",
          path: ["domains", index, "slug"],
          message: `Duplicate domain slug: ${domain.slug}`,
        });
      }
      domainSlugs.add(domain.slug);
    }
    for (const [index, domain] of seed.domains.entries()) {
      if (domain.parent && !domainSlugs.has(domain.parent)) {
        context.addIssue({
          code: "custom",
          path: ["domains", index, "parent"],
          message: `Unknown parent domain: ${domain.parent}`,
        });
      }
    }

    const domainCycle = findCycle(
      new Map(seed.domains.map((domain) => [domain.slug, domain.parent])),
    );
    if (domainCycle) {
      context.addIssue({
        code: "custom",
        path: ["domains"],
        message: `Domain hierarchy cycle: ${domainCycle.join(" -> ")}`,
      });
    }

    const conceptSlugs = new Set<string>();
    const aliasOwners = new Map<string, string>();
    for (const [index, concept] of seed.concepts.entries()) {
      if (conceptSlugs.has(concept.slug)) {
        context.addIssue({
          code: "custom",
          path: ["concepts", index, "slug"],
          message: `Duplicate concept slug: ${concept.slug}`,
        });
      }
      conceptSlugs.add(concept.slug);
      if (!domainSlugs.has(concept.domain)) {
        context.addIssue({
          code: "custom",
          path: ["concepts", index, "domain"],
          message: `Unknown canonical domain: ${concept.domain}`,
        });
      }
      for (const [aliasIndex, alias] of concept.aliases.entries()) {
        const normalized = normalizeAlias(alias.value);
        const key = `${normalized}:${alias.languageCode}:${alias.disambiguationKey ?? ""}`;
        const existingOwner = aliasOwners.get(key);
        if (existingOwner && existingOwner !== concept.slug) {
          context.addIssue({
            code: "custom",
            path: ["concepts", index, "aliases", aliasIndex],
            message: `Alias '${alias.value}' is already assigned to ${existingOwner}`,
          });
        }
        aliasOwners.set(key, concept.slug);
      }
    }
    for (const [index, concept] of seed.concepts.entries()) {
      if (concept.parent && !conceptSlugs.has(concept.parent)) {
        context.addIssue({
          code: "custom",
          path: ["concepts", index, "parent"],
          message: `Unknown parent concept: ${concept.parent}`,
        });
      }
    }

    const conceptCycle = findCycle(
      new Map(seed.concepts.map((concept) => [concept.slug, concept.parent])),
    );
    if (conceptCycle) {
      context.addIssue({
        code: "custom",
        path: ["concepts"],
        message: `Concept hierarchy cycle: ${conceptCycle.join(" -> ")}`,
      });
    }

    const relationTypes = new Map<
      string,
      z.infer<typeof relationTypeSeedSchema>
    >();
    for (const [index, type] of seed.relationTypes.entries()) {
      if (relationTypes.has(type.key)) {
        context.addIssue({
          code: "custom",
          path: ["relationTypes", index, "key"],
          message: `Duplicate relation type: ${type.key}`,
        });
      }
      if (type.symmetric && type.directed) {
        context.addIssue({
          code: "custom",
          path: ["relationTypes", index],
          message: `Symmetric relation type '${type.key}' cannot be directed`,
        });
      }
      relationTypes.set(type.key, type);
    }

    const acyclicEdges = new Map<string, string[]>();
    for (const [index, relation] of seed.relations.entries()) {
      const type = relationTypes.get(relation.type);
      if (
        !conceptSlugs.has(relation.source) ||
        !conceptSlugs.has(relation.target)
      ) {
        context.addIssue({
          code: "custom",
          path: ["relations", index],
          message: `Relation '${relation.source} ${relation.type} ${relation.target}' has an unknown concept`,
        });
      }
      if (!type) {
        context.addIssue({
          code: "custom",
          path: ["relations", index, "type"],
          message: `Unknown relation type: ${relation.type}`,
        });
      } else if (relation.source === relation.target && !type.allowsSelf) {
        context.addIssue({
          code: "custom",
          path: ["relations", index],
          message: `Relation type '${relation.type}' does not allow self-relations`,
        });
      }
      if (type?.acyclic) {
        const targets = acyclicEdges.get(relation.source) ?? [];
        targets.push(relation.target);
        acyclicEdges.set(relation.source, targets);
      }
    }
    const prerequisiteCycle = findDirectedCycle(acyclicEdges);
    if (prerequisiteCycle) {
      context.addIssue({
        code: "custom",
        path: ["relations"],
        message: `Acyclic relation cycle: ${prerequisiteCycle.join(" -> ")}`,
      });
    }
  });

export type AtlasSeed = z.infer<typeof atlasSeedSchema>;
export type RelationSeed = AtlasSeed["relations"][number];

export function parseAtlasYaml(yaml: string): AtlasSeed {
  return atlasSeedSchema.parse(parseYaml(yaml));
}

export function normalizeSymmetricRelation(
  relation: RelationSeed,
  relationTypes: readonly AtlasSeed["relationTypes"][number][],
): RelationSeed {
  const relationType = relationTypes.find(
    (candidate) => candidate.key === relation.type,
  );
  if (
    !relationType?.symmetric ||
    relation.source.localeCompare(relation.target) <= 0
  ) {
    return relation;
  }
  return { ...relation, source: relation.target, target: relation.source };
}

const systemRelationTypes: AtlasSeed["relationTypes"] = [
  [
    "broader_than",
    "broader than",
    "narrower than",
    "hierarchy",
    true,
    false,
    true,
  ],
  [
    "narrower_than",
    "narrower than",
    "broader than",
    "hierarchy",
    true,
    false,
    true,
  ],
  ["part_of", "part of", "has part", "hierarchy", true, false, true],
  [
    "prerequisite_for",
    "prerequisite for",
    "requires",
    "learning",
    true,
    false,
    true,
  ],
  [
    "co_requisite_with",
    "co-requisite with",
    "co-requisite with",
    "learning",
    false,
    true,
    false,
  ],
  ["deepens", "deepens", "is deepened by", "learning", true, false, true],
  ["depends_on", "depends on", "supports", "explanatory", true, false, true],
  ["enables", "enables", "is enabled by", "explanatory", true, false, false],
  [
    "constrains",
    "constrains",
    "is constrained by",
    "explanatory",
    true,
    false,
    false,
  ],
  [
    "explains",
    "explains",
    "is explained by",
    "explanatory",
    true,
    false,
    false,
  ],
  [
    "influences",
    "influences",
    "is influenced by",
    "explanatory",
    true,
    false,
    false,
  ],
  [
    "contrasts_with",
    "contrasts with",
    "contrasts with",
    "contrast",
    false,
    true,
    false,
  ],
  [
    "alternative_to",
    "alternative to",
    "alternative to",
    "contrast",
    false,
    true,
    false,
  ],
  [
    "commonly_confused_with",
    "commonly confused with",
    "commonly confused with",
    "contrast",
    false,
    true,
    false,
  ],
  ["measured_by", "measured by", "measures", "epistemic", true, false, false],
  ["verified_by", "verified by", "verifies", "epistemic", true, false, false],
  [
    "implemented_by",
    "implemented by",
    "implements",
    "operational",
    true,
    false,
    false,
  ],
  ["governed_by", "governed by", "governs", "operational", true, false, false],
  [
    "fails_through",
    "fails through",
    "is a failure mode of",
    "operational",
    true,
    false,
    false,
  ],
  ["related_to", "related to", "related to", "explanatory", false, true, false],
].map(
  ([
    key,
    forwardLabel,
    inverseLabel,
    category,
    directed,
    symmetric,
    acyclic,
  ]) => ({
    key: String(key),
    forwardLabel: String(forwardLabel),
    inverseLabel: String(inverseLabel),
    category: category as AtlasSeed["relationTypes"][number]["category"],
    directed: Boolean(directed),
    symmetric: Boolean(symmetric),
    acyclic: Boolean(acyclic),
    allowsSelf: false,
    allowedSourceKinds: [],
    allowedTargetKinds: [],
    isSystem: true,
  }),
);

export const defaultSeedSkeleton: AtlasSeed = atlasSeedSchema.parse({
  version: 1,
  domains: [
    [
      "research-reasoning-measurement",
      "Research, Reasoning, and Measurement",
      "root",
      "How do we form, test, qualify, and revise reliable beliefs?",
    ],
    [
      "mathematical-computing-foundations",
      "Mathematical and Computing Foundations",
      "root",
      "What formal and computational tools are prerequisites for the applied branches?",
    ],
    [
      "systems-control-decision",
      "Systems, Control, and Decision Sciences",
      "core",
      "How do complex systems behave, decide, and remain directed toward desired states?",
    ],
    [
      "organizations-coordination-work",
      "Organizations, Coordination, and Operational Work",
      "core",
      "How do people, teams, technologies, responsibilities, and incentives combine to produce coordinated action?",
    ],
    [
      "information-data-knowledge",
      "Information, Data, and Knowledge Systems",
      "core",
      "How can operational reality be represented, stored, retrieved, related, and kept trustworthy?",
    ],
    [
      "ai-reasoning-agents",
      "Artificial Intelligence, Reasoning, and Agentic Systems",
      "core",
      "How can computational systems reason, plan, use tools, act, evaluate results, and learn?",
    ],
    [
      "software-distributed-integration",
      "Software, Distributed Systems, and Enterprise Integration",
      "core",
      "How can Loura be implemented dependably across unreliable, heterogeneous environments?",
    ],
    [
      "human-ai-safety-governance",
      "Human–AI Systems, Safety, Security, and Governance",
      "core",
      "How can humans retain appropriate authority while using AI safely and securely?",
    ],
    [
      "systems-engineering-deployment",
      "Systems Engineering, Product Design, Deployment, and Adoption",
      "core",
      "How is knowledge translated into a system that solves a real problem in a real environment?",
    ],
    [
      "manufacturing-industrial-operations",
      "Manufacturing and Industrial Operations",
      "overlay",
      "How do industrial organizations plan, execute, monitor, maintain, and improve production and assets?",
    ],
  ].map(([slug, title, kind, shortDescription], sortOrder) => ({
    slug: String(slug),
    title: String(title),
    kind: kind as "root" | "core" | "overlay",
    shortDescription: String(shortDescription),
    scopeMarkdown: "",
    parent: null,
    status: "draft" as const,
    priority: "later" as const,
    targetMastery: null,
    sortOrder,
  })),
  relationTypes: systemRelationTypes,
  concepts: [],
  relations: [],
});
