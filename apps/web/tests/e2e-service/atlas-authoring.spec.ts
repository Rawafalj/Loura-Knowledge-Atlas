import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

import type { Database } from "../../lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.SUPABASE_DB_URL;
const searchLatencyBudgetMs = Number(
  process.env.SEARCH_E2E_LATENCY_BUDGET_MS ?? (process.env.CI ? 1_000 : 5_000),
);

test.describe("Milestones 2–5 atlas workflow", () => {
  let admin: SupabaseClient<Database>;
  let database: ReturnType<typeof postgres>;
  let ownerId: string | null = null;
  let viewerId: string | null = null;
  let workspaceId: string | null = null;

  test.beforeAll(() => {
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !databaseUrl) {
      throw new Error(
        "Service-backed E2E requires local Supabase API and database credentials",
      );
    }
    database = postgres(databaseUrl, { max: 1 });
    admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (workspaceId) {
      await database`delete from public.workspaces where id = ${workspaceId}`;
    }
    if (viewerId) await admin.auth.admin.deleteUser(viewerId);
    if (ownerId) await admin.auth.admin.deleteUser(ownerId);
    if (database) await database.end();
  });

  test("owner authors the atlas, learns, and ingests immutable source evidence", async ({
    browser,
    page,
  }) => {
    const unique = crypto.randomUUID();
    const ownerEmail = `milestone-2-${unique}@example.test`;
    const { data: ownerData, error: ownerError } =
      await admin.auth.admin.createUser({
        email: ownerEmail,
        email_confirm: true,
      });
    if (ownerError) throw ownerError;
    ownerId = ownerData.user.id;
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: ownerEmail,
        options: {
          redirectTo: "http://127.0.0.1:3000/auth/callback?next=/onboarding",
        },
      });
    if (linkError) throw linkError;

    const { data: sessionData, error: sessionError } =
      await admin.auth.verifyOtp({
        type: "magiclink",
        token_hash: linkData.properties.hashed_token,
      });
    if (sessionError || !sessionData.session)
      throw sessionError ?? new Error("No test session");
    const sessionCookies: Array<{ name: string; value: string }> = [];
    const sessionClient = createServerClient<Database>(supabaseUrl!, anonKey!, {
      cookies: {
        getAll: () => [],
        setAll: (cookies) => {
          sessionCookies.push(
            ...cookies.map(({ name, value }) => ({ name, value })),
          );
        },
      },
    });
    const { error: setSessionError } = await sessionClient.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
    if (setSessionError) throw setSessionError;
    await page.context().addCookies(
      sessionCookies.map(({ name, value }) => ({
        name,
        value,
        url: "http://127.0.0.1:3000",
      })),
    );

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Workspace name").fill("Milestone 2 Atlas");
    await page.getByLabel("Workspace slug").fill(`m2-${unique}`);
    await page
      .getByRole("button", { name: "Create private workspace" })
      .click();
    await expect(page).toHaveURL(/\/atlas$/);
    await expect(
      page.getByRole("heading", { name: "The knowledge landscape" }),
    ).toBeVisible();

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", `m2-${unique}`)
      .single();
    if (workspaceError) throw workspaceError;
    workspaceId = workspace.id;

    await page
      .getByRole("link", { name: "Research, Reasoning, and Measurement" })
      .first()
      .click();
    await expect(page).toHaveURL(
      /\/atlas\/domains\/research-reasoning-measurement$/,
    );
    await expect(
      page.getByRole("heading", { name: "Canonical hierarchy" }),
    ).toBeVisible();
    await page.goto("/concepts/new?domain=research-reasoning-measurement");

    await page.getByLabel("Canonical name").fill("Feedback Control Fixture");
    await page.getByLabel("Stable slug").fill("feedback-control-fixture");
    await page
      .getByLabel("Concise definition")
      .fill("Regulation using observed outcomes.");
    await page
      .getByLabel("Revision summary")
      .fill("Created feedback control draft");
    await page.getByRole("button", { name: "Create concept" }).click();
    await expect(page).toHaveURL(/\/concepts\/feedback-control-fixture$/);
    await expect(
      page.getByRole("heading", { name: "Feedback Control Fixture" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Edit concept" }).click();
    await page.getByRole("button", { name: "Add alias" }).click();
    await page
      .getByLabel("Alias 1", { exact: true })
      .fill("Closed-loop regulator");
    await page
      .getByLabel("Concise definition")
      .fill("Regulation that compares observed outcomes with a desired state.");
    await page
      .getByLabel("Revision summary")
      .fill("Clarified the feedback definition");
    await page.getByRole("button", { name: "Save concept revision" }).click();
    await expect(page).toHaveURL(/\/concepts\/feedback-control-fixture$/);
    await page.getByRole("link", { name: "History" }).click();
    await expect(page.getByText("Revision 2")).toBeVisible();

    await page.keyboard.press("Control+k");
    const searchInput = page.getByRole("textbox", {
      name: "Search concepts and sources",
    });
    await expect(searchInput).toBeFocused();
    const searchResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/search") &&
        response.request().method() === "POST",
    );
    const searchStartedAt = Date.now();
    await searchInput.fill("closed-loop regulator");
    const searchResponse = await searchResponsePromise;
    expect(searchResponse.ok()).toBe(true);
    expect(Date.now() - searchStartedAt).toBeLessThan(searchLatencyBudgetMs);
    const searchResult = page.getByRole("option", {
      name: /Feedback Control Fixture/,
    });
    await expect(searchResult).toContainText(
      "Matched alias: Closed-loop regulator",
    );
    await expect(searchResult).toContainText("alias");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/concepts\/feedback-control-fixture$/);

    await page.goto("/concepts/new?domain=research-reasoning-measurement");
    await page.getByLabel("Canonical name").fill("Test Observation");
    await page.getByLabel("Stable slug").fill("test-observation");
    await page
      .getByLabel("Concise definition")
      .fill("A recorded view of a system condition.");
    await page
      .getByLabel("Revision summary")
      .fill("Created test-observation draft");
    await page.getByRole("button", { name: "Create concept" }).click();
    await expect(page).toHaveURL(/\/concepts\/test-observation$/);

    await page.getByRole("link", { name: "Add relation" }).click();
    await page
      .getByLabel("Relationship type")
      .selectOption({ label: "prerequisite for · learning" });
    await page
      .getByLabel("Target concept")
      .selectOption({ label: "Feedback Control Fixture" });
    await page
      .getByLabel("Qualification")
      .fill(
        "Test Observation is required before feedback can regulate outcomes.",
      );
    await page.getByRole("button", { name: "Add relationship" }).click();
    await expect(page).toHaveURL(
      /\/concepts\/test-observation\?tab=relationships$/,
    );
    await expect(page.getByRole("table")).toContainText(
      "Feedback Control Fixture",
    );
    await expect(page.getByRole("table")).toContainText("prerequisite for");
    await expect(page.getByLabel("Local concept graph")).toBeVisible();
    await page.getByLabel("Expansion depth").selectOption("2");
    await page
      .getByText("Open the graph as an accessible relationship list")
      .click();
    const graphList = page.getByRole("table", {
      name: /visible relationships represented in the local graph/,
    });
    await expect(graphList).toContainText("Feedback Control Fixture");
    await expect(graphList).toContainText("prerequisite_for");

    const [systemBoundary] = await database<{ id: string }[]>`
      select id from public.concepts
      where workspace_id = ${workspaceId} and slug = 'system-boundary'
    `;
    if (!systemBoundary) throw new Error("Seed learning concept is missing");
    const [beforePathView] = await database<{ count: number }[]>`
      select count(*)::integer as count from public.user_mastery
      where workspace_id = ${workspaceId} and user_id = ${ownerId}
    `;
    await page.goto("/paths/closed-loop-operational-execution");
    await expect(
      page.getByRole("heading", { name: "Closed-loop operational execution" }),
    ).toBeVisible();
    await expect(
      page.getByText("Next ready", { exact: true }).locator(".."),
    ).toContainText("System and Boundary");
    const firstLearningStep = page.locator("li.learning-step").filter({
      has: page.getByRole("heading", {
        name: "System and Boundary",
        exact: true,
      }),
    });
    const secondLearningStep = page.locator("li.learning-step").filter({
      has: page.getByRole("heading", { name: "Desired State", exact: true }),
    });
    await expect(firstLearningStep).toContainText("ready");
    await expect(secondLearningStep).toContainText("blocked");
    const [afterPathView] = await database<{ count: number }[]>`
      select count(*)::integer as count from public.user_mastery
      where workspace_id = ${workspaceId} and user_id = ${ownerId}
    `;
    expect(afterPathView?.count).toBe(beforePathView?.count);

    await firstLearningStep.getByText("Add mastery evidence").click();
    await firstLearningStep.getByLabel("Current level").selectOption("2");
    await firstLearningStep.getByLabel("Target level").selectOption("2");
    await firstLearningStep
      .getByLabel("Learning status")
      .selectOption("mastered");
    await firstLearningStep
      .getByLabel("Evidence type")
      .selectOption("applied_analysis");
    await firstLearningStep
      .getByLabel("Evidence note")
      .fill("Applied a boundary to the service-backed exception fixture.");
    await firstLearningStep
      .getByRole("button", { name: "Save evidence and mastery" })
      .click();
    await expect(page).toHaveURL(
      /\/paths\/closed-loop-operational-execution\?saved=mastery$/,
    );
    await expect(
      page.getByText("Next ready", { exact: true }).locator(".."),
    ).toContainText("Desired State");
    await expect(
      page.locator("li.learning-step").filter({
        has: page.getByRole("heading", { name: "Desired State", exact: true }),
      }),
    ).toContainText("ready");
    await page.goto("/mastery");
    await expect(
      page.getByRole("row").filter({ hasText: "System and Boundary" }),
    ).toContainText("applied analysis");

    await page.goto("/sources/new");
    await page.getByLabel("Source file").setInputFiles({
      name: "atlas-e2e.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(
        "# Service-backed ingestion evidence\n\nRetries require explicit idempotent operation identity.",
      ),
    });
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("Service-backed ingestion fixture");
    await page
      .getByLabel("Rights note")
      .fill(
        "Locally authored fixture for private deterministic ingestion testing.",
      );
    await page.getByRole("button", { name: "Add and ingest source" }).click();
    await expect(page).toHaveURL(/\/sources\/[0-9a-f-]+\?job=[0-9a-f-]+$/);
    const progressRegion = page.getByLabel("Ingestion progress");
    await expect(progressRegion).toContainText("completed", {
      timeout: 120_000,
    });
    await expect(
      page.getByRole("heading", { name: "Structural segments" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Retries require explicit idempotent operation identity/),
    ).toBeVisible();
    const [sourceEvidence] = await database<
      { source_count: number; version_count: number; segment_count: number }[]
    >`
      select
        (select count(*)::integer from public.sources where workspace_id = ${workspaceId}) as source_count,
        (select count(*)::integer from public.source_versions where workspace_id = ${workspaceId} and processing_status = 'completed') as version_count,
        (select count(*)::integer from public.source_segments where workspace_id = ${workspaceId}) as segment_count
    `;
    expect(sourceEvidence).toMatchObject({
      source_count: 1,
      version_count: 1,
      segment_count: 2,
    });
    await page.keyboard.press("Control+k");
    const sourceSearch = page.getByRole("textbox", {
      name: "Search concepts and sources",
    });
    await sourceSearch.fill("service-backed ingestion evidence");
    const sourceResult = page.getByRole("option", {
      name: /Service-backed ingestion fixture/,
    });
    await expect(sourceResult).toContainText("immutable source segment");
    await sourceResult.click();
    await expect(page).toHaveURL(/\/sources\/[0-9a-f-]+#segment-/);

    await page.goto("/concepts/test-observation");
    await page.getByRole("link", { name: "Edit concept" }).click();
    await page.getByLabel("Content status").selectOption("deprecated");
    await page
      .getByLabel("Revision summary")
      .fill("Deprecated test concept without hard deletion");
    await page.getByRole("button", { name: "Save concept revision" }).click();
    await expect(page.getByText("This concept is deprecated.")).toBeVisible();
    await page.getByRole("link", { name: "History" }).click();
    await expect(page.getByText("Revision 2")).toBeVisible();

    const viewerEmail = `milestone-2-viewer-${unique}@example.test`;
    const { data: viewerData, error: viewerError } =
      await admin.auth.admin.createUser({
        email: viewerEmail,
        email_confirm: true,
      });
    if (viewerError) throw viewerError;
    viewerId = viewerData.user.id;
    await database`
      insert into public.profiles (id, display_name)
      values (${viewerId}, 'Milestone 2 Viewer')
    `;
    await database`
      insert into public.workspace_members (workspace_id, user_id, role)
      values (${workspaceId}, ${viewerId}, 'viewer')
    `;
    const { data: viewerLink, error: viewerLinkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: viewerEmail,
      });
    if (viewerLinkError) throw viewerLinkError;
    const { data: viewerSession, error: viewerSessionError } =
      await admin.auth.verifyOtp({
        type: "magiclink",
        token_hash: viewerLink.properties.hashed_token,
      });
    if (viewerSessionError || !viewerSession.session) {
      throw viewerSessionError ?? new Error("No viewer test session");
    }
    const viewerCookies: Array<{ name: string; value: string }> = [];
    const viewerSessionClient = createServerClient<Database>(
      supabaseUrl!,
      anonKey!,
      {
        cookies: {
          getAll: () => [],
          setAll: (cookies) => {
            viewerCookies.push(
              ...cookies.map(({ name, value }) => ({ name, value })),
            );
          },
        },
      },
    );
    const { error: setViewerSessionError } =
      await viewerSessionClient.auth.setSession({
        access_token: viewerSession.session.access_token,
        refresh_token: viewerSession.session.refresh_token,
      });
    if (setViewerSessionError) throw setViewerSessionError;

    const viewerContext = await browser.newContext();
    await viewerContext.addCookies(
      viewerCookies.map(({ name, value }) => ({
        name,
        value,
        url: "http://127.0.0.1:3000",
      })),
    );
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto("/atlas");
    await expect(viewerPage.getByText("Read only").first()).toBeVisible();
    await expect(
      viewerPage.getByRole("link", { name: "Create concept draft" }),
    ).toHaveCount(0);
    await viewerPage.goto("/concepts/test-observation/edit");
    await expect(viewerPage).toHaveURL(/\/concepts\/test-observation$/);
    await viewerPage.goto("/paths/closed-loop-operational-execution");
    await expect(
      viewerPage.getByRole("link", { name: "Edit path" }),
    ).toHaveCount(0);
    const viewerFirstStep = viewerPage.locator("li.learning-step").filter({
      has: viewerPage.getByRole("heading", {
        name: "System and Boundary",
        exact: true,
      }),
    });
    await viewerFirstStep.getByText("Add mastery evidence").click();
    await viewerFirstStep.getByLabel("Current level").selectOption("1");
    await viewerFirstStep.getByLabel("Target level").selectOption("2");
    await viewerFirstStep
      .getByLabel("Learning status")
      .selectOption("learning");
    await viewerFirstStep
      .getByLabel("Evidence note")
      .fill("Viewer explained the boundary in their own words.");
    await viewerFirstStep
      .getByRole("button", { name: "Save evidence and mastery" })
      .click();
    await expect(viewerPage).toHaveURL(/\?saved=mastery$/);
    const [viewerMastery] = await database<
      { current_level: number; evidence_count: number }[]
    >`
      select mastery.current_level,
        (select count(*)::integer from public.mastery_evidence evidence
         where evidence.user_id = ${viewerId} and evidence.concept_id = ${systemBoundary.id}) as evidence_count
      from public.user_mastery mastery
      where mastery.user_id = ${viewerId} and mastery.concept_id = ${systemBoundary.id}
    `;
    expect(viewerMastery).toMatchObject({
      current_level: 1,
      evidence_count: 1,
    });
    await viewerContext.close();
  });
});
