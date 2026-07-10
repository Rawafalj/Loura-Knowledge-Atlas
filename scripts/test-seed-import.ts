import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseAtlasYaml } from "@loura/atlas-schema";
import postgres from "postgres";

const localDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function assertLocalDatabase(databaseUrl: string): void {
  const hostname = new URL(databaseUrl).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(
      "Seed integration tests only run against a local PostgreSQL instance",
    );
  }
}

function assertDatabaseErrorCode(
  error: unknown,
  expectedCode: string,
  context: string,
): void {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== expectedCode
  ) {
    throw new Error(`${context}: expected PostgreSQL error ${expectedCode}`, {
      cause: error,
    });
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL ?? localDatabaseUrl;
  assertLocalDatabase(databaseUrl);

  const seedPath = resolve("seed/atlas.yaml");
  const baseSeed = parseAtlasYaml(await readFile(seedPath, "utf8"));
  const seed = parseAtlasYaml(
    JSON.stringify({
      ...baseSeed,
      concepts: [
        {
          slug: "evidence",
          canonicalName: "Evidence",
          domain: "research-reasoning-measurement",
          aliases: [{ value: "Supporting evidence", type: "synonym" }],
        },
        {
          slug: "claim",
          canonicalName: "Claim",
          domain: "research-reasoning-measurement",
          parent: "evidence",
        },
      ],
      relations: [
        { source: "evidence", type: "prerequisite_for", target: "claim" },
      ],
    }),
  );

  const userId = randomUUID();
  const userEmail = `seed-${userId}@example.test`;
  const workspaceSlug = `seed-${userId}`;
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await sql`
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at
      ) values (
        ${userId}, '00000000-0000-0000-0000-000000000000', 'authenticated',
        'authenticated', ${userEmail}, '', now(), now(), now()
      )
    `;

    const workspaceId = await sql.begin(async (transaction) => {
      const claims = JSON.stringify({
        sub: userId,
        email: userEmail,
        role: "authenticated",
      });
      await transaction`select set_config('request.jwt.claim.sub', ${userId}, true)`;
      await transaction`select set_config('request.jwt.claims', ${claims}, true)`;
      await transaction.unsafe("set local role authenticated");
      const [created] = await transaction<{ workspace_id: string }[]>`
        select public.bootstrap_workspace(
          'Seed Import Test',
          ${workspaceSlug},
          ${transaction.json(seed)}
        ) as workspace_id
      `;
      if (!created)
        throw new Error("Workspace bootstrap returned no identifier");
      return created.workspace_id;
    });

    const before = await sql<
      {
        domains: number;
        concepts: number;
        aliases: number;
        relations: number;
      }[]
    >`
      select
        (select count(*)::integer from public.domains where workspace_id = ${workspaceId}) as domains,
        (select count(*)::integer from public.concepts where workspace_id = ${workspaceId}) as concepts,
        (select count(*)::integer from public.concept_aliases where workspace_id = ${workspaceId}) as aliases,
        (select count(*)::integer from public.concept_relations where workspace_id = ${workspaceId}) as relations
    `;

    await sql.begin(async (transaction) => {
      const claims = JSON.stringify({
        sub: userId,
        email: userEmail,
        role: "authenticated",
      });
      await transaction`select set_config('request.jwt.claim.sub', ${userId}, true)`;
      await transaction`select set_config('request.jwt.claims', ${claims}, true)`;
      await transaction.unsafe("set local role authenticated");
      await transaction`
        select public.install_atlas_seed(${workspaceId}, ${transaction.json(seed)})
      `;
    });

    const after = await sql<
      {
        domains: number;
        concepts: number;
        aliases: number;
        relations: number;
      }[]
    >`
      select
        (select count(*)::integer from public.domains where workspace_id = ${workspaceId}) as domains,
        (select count(*)::integer from public.concepts where workspace_id = ${workspaceId}) as concepts,
        (select count(*)::integer from public.concept_aliases where workspace_id = ${workspaceId}) as aliases,
        (select count(*)::integer from public.concept_relations where workspace_id = ${workspaceId}) as relations
    `;

    const expected = { domains: 10, concepts: 2, aliases: 1, relations: 1 };
    if (JSON.stringify(before[0]) !== JSON.stringify(expected)) {
      throw new Error(
        `Unexpected first import counts: ${JSON.stringify(before[0])}`,
      );
    }
    if (JSON.stringify(after[0]) !== JSON.stringify(expected)) {
      throw new Error(
        `Seed import is not idempotent: ${JSON.stringify(after[0])}`,
      );
    }

    const firstDomainId = randomUUID();
    const secondDomainId = randomUUID();
    const firstConceptId = randomUUID();
    const secondConceptId = randomUUID();
    const [canonicalDomain] = await sql<{ id: string }[]>`
      select id from public.domains
      where workspace_id = ${workspaceId} and slug = 'research-reasoning-measurement'
    `;
    const [prerequisiteType] = await sql<{ id: string }[]>`
      select id from public.relation_types
      where workspace_id = ${workspaceId} and key = 'prerequisite_for'
    `;
    if (!canonicalDomain || !prerequisiteType)
      throw new Error("Seed references are missing");

    await sql`
      insert into public.domains (
        id, workspace_id, slug, title, short_description, kind, created_by, updated_by
      ) values
        (${firstDomainId}, ${workspaceId}, 'concurrent-a', 'Concurrent A', 'Cycle race fixture', 'core', ${userId}, ${userId}),
        (${secondDomainId}, ${workspaceId}, 'concurrent-b', 'Concurrent B', 'Cycle race fixture', 'core', ${userId}, ${userId})
    `;
    await sql`
      insert into public.concepts (
        id, workspace_id, slug, canonical_name, canonical_domain_id, created_by, updated_by
      ) values
        (${firstConceptId}, ${workspaceId}, 'concurrent-alpha', 'Concurrent Alpha', ${canonicalDomain.id}, ${userId}, ${userId}),
        (${secondConceptId}, ${workspaceId}, 'concurrent-beta', 'Concurrent Beta', ${canonicalDomain.id}, ${userId}, ${userId})
    `;

    const competingSql = postgres(databaseUrl, { max: 1 });
    try {
      let releaseDomainWrite: (() => void) | undefined;
      let announceDomainWrite: (() => void) | undefined;
      const domainWriteHeld = new Promise<void>((resolvePromise) => {
        announceDomainWrite = resolvePromise;
      });
      const domainWriteRelease = new Promise<void>((resolvePromise) => {
        releaseDomainWrite = resolvePromise;
      });
      const firstDomainWrite = sql.begin(async (transaction) => {
        await transaction`
          update public.domains set parent_domain_id = ${secondDomainId}
          where id = ${firstDomainId}
        `;
        announceDomainWrite?.();
        await domainWriteRelease;
      });
      await domainWriteHeld;
      const secondDomainWrite = competingSql.begin(async (transaction) => {
        await transaction`
          update public.domains set parent_domain_id = ${firstDomainId}
          where id = ${secondDomainId}
        `;
      });
      releaseDomainWrite?.();
      await firstDomainWrite;
      try {
        await secondDomainWrite;
        throw new Error("Concurrent domain cycle was accepted");
      } catch (error) {
        assertDatabaseErrorCode(error, "23514", "Concurrent domain cycle");
      }

      let releaseRelationWrite: (() => void) | undefined;
      let announceRelationWrite: (() => void) | undefined;
      const relationWriteHeld = new Promise<void>((resolvePromise) => {
        announceRelationWrite = resolvePromise;
      });
      const relationWriteRelease = new Promise<void>((resolvePromise) => {
        releaseRelationWrite = resolvePromise;
      });
      const firstRelationWrite = sql.begin(async (transaction) => {
        await transaction`
          insert into public.concept_relations (
            workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by
          ) values (
            ${workspaceId}, ${firstConceptId}, ${prerequisiteType.id}, ${secondConceptId}, ${userId}
          )
        `;
        announceRelationWrite?.();
        await relationWriteRelease;
      });
      await relationWriteHeld;
      const secondRelationWrite = competingSql.begin(async (transaction) => {
        await transaction`
          insert into public.concept_relations (
            workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by
          ) values (
            ${workspaceId}, ${secondConceptId}, ${prerequisiteType.id}, ${firstConceptId}, ${userId}
          )
        `;
      });
      releaseRelationWrite?.();
      await firstRelationWrite;
      try {
        await secondRelationWrite;
        throw new Error("Concurrent prerequisite cycle was accepted");
      } catch (error) {
        assertDatabaseErrorCode(
          error,
          "23514",
          "Concurrent prerequisite cycle",
        );
      }
    } finally {
      await competingSql.end();
    }

    console.log(
      "Seed and graph integration passed: validated, idempotent, and concurrent-cycle safe",
    );

    await sql`delete from public.workspaces where id = ${workspaceId}`;
    await sql`delete from auth.users where id = ${userId}`;
  } finally {
    await sql.end();
  }
}

void main();
