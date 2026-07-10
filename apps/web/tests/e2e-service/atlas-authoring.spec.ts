import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

import type { Database } from "../../lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.SUPABASE_DB_URL;

test.describe("Milestone 2 atlas workflow", () => {
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
    await database.end();
  });

  test("owner browses, authors, revisions, relates, and deprecates canonical concepts", async ({
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
    await page.getByRole("link", { name: "Create the first draft" }).click();

    await page.getByLabel("Canonical name").fill("Feedback Control");
    await page.getByLabel("Stable slug").fill("feedback-control");
    await page
      .getByLabel("Concise definition")
      .fill("Regulation using observed outcomes.");
    await page
      .getByLabel("Revision summary")
      .fill("Created feedback control draft");
    await page.getByRole("button", { name: "Create concept" }).click();
    await expect(page).toHaveURL(/\/concepts\/feedback-control$/);
    await expect(
      page.getByRole("heading", { name: "Feedback Control" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Edit concept" }).click();
    await page
      .getByLabel("Concise definition")
      .fill("Regulation that compares observed outcomes with a desired state.");
    await page
      .getByLabel("Revision summary")
      .fill("Clarified the feedback definition");
    await page.getByRole("button", { name: "Save concept revision" }).click();
    await expect(page).toHaveURL(/\/concepts\/feedback-control$/);
    await page.getByRole("link", { name: "History" }).click();
    await expect(page.getByText("Revision 2")).toBeVisible();

    await page.goto("/concepts/new?domain=research-reasoning-measurement");
    await page.getByLabel("Canonical name").fill("Observation");
    await page.getByLabel("Stable slug").fill("observation");
    await page
      .getByLabel("Concise definition")
      .fill("A recorded view of a system condition.");
    await page.getByLabel("Revision summary").fill("Created observation draft");
    await page.getByRole("button", { name: "Create concept" }).click();
    await expect(page).toHaveURL(/\/concepts\/observation$/);

    await page.getByRole("link", { name: "Add relation" }).click();
    await page
      .getByLabel("Relationship type")
      .selectOption({ label: "prerequisite for · learning" });
    await page
      .getByLabel("Target concept")
      .selectOption({ label: "Feedback Control" });
    await page
      .getByLabel("Qualification")
      .fill("Observation is required before feedback can regulate outcomes.");
    await page.getByRole("button", { name: "Add relationship" }).click();
    await expect(page).toHaveURL(/\/concepts\/observation\?tab=relationships$/);
    await expect(page.getByRole("table")).toContainText("Feedback Control");
    await expect(page.getByRole("table")).toContainText("prerequisite for");

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
    await viewerPage.goto("/concepts/observation/edit");
    await expect(viewerPage).toHaveURL(/\/concepts\/observation$/);
    await viewerContext.close();
  });
});
