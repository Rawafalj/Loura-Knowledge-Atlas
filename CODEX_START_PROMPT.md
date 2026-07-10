# First prompt for Codex

You are implementing the Loura Knowledge Atlas in this repository.

Before making changes:

1. Read `AGENTS.md`.
2. Read every file in `docs/` in numerical order.
3. Summarize the product boundary, selected architecture, v0.1 non-goals, and Milestone 0 acceptance criteria.
4. Inspect the repository. Assume it may be empty except for the specification.

Then implement **Milestone 0 only** from `docs/06_IMPLEMENTATION_PLAN.md`.

Requirements:

- Use the selected stack unless a dependency is currently incompatible. When incompatible, choose the smallest compatible alternative and record it in `docs/DECISIONS.md` before coding.
- Propose exact current stable versions before installing them.
- Create the monorepo, Next.js web app, Python worker, Supabase local setup, test tools, CI, root commands, `.env.example`, health routes, mock AI/embedding clients, and local setup documentation.
- Do not implement atlas database features, source ingestion, or live OpenAI calls yet.
- Do not add a production dependency without explaining its role.
- Keep `AGENTS.md` small and unchanged unless a genuine repository rule must be added.
- Ensure the repository contains no secrets.
- Run all Milestone 0 verification commands.

At completion, report:

1. exact versions selected;
2. repository tree;
3. major files created;
4. commands run and their results;
5. acceptance criteria status;
6. deviations recorded in `docs/DECISIONS.md`;
7. known limitations that must be addressed in Milestone 1.

Do not claim completion if `pnpm verify` fails.

