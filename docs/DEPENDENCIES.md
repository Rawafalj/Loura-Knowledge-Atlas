# Dependency Inventory through Milestone 1

Versions were checked against npm and PyPI on 2026-07-10 and are pinned in lockfiles.

## Production runtime

| Dependency   | Version | Role                                                  | License    |
| ------------ | ------: | ----------------------------------------------------- | ---------- |
| Next.js      | 16.2.10 | Web framework and server runtime                      | MIT        |
| React        |  19.2.7 | Web rendering                                         | MIT        |
| React DOM    |  19.2.7 | Browser rendering                                     | MIT        |
| Zod          |   4.4.3 | External input and AI fixture validation              | MIT        |
| Pydantic     |  2.13.4 | Worker configuration and structured-output validation | MIT        |
| Supabase JS  | 2.110.2 | Typed authentication and user-scoped database access  | MIT        |
| Supabase SSR |  0.12.0 | Cookie-backed server authentication sessions          | MIT        |
| Drizzle ORM  |  0.45.2 | Canonical TypeScript database schema                  | Apache-2.0 |
| Postgres.js  |   3.4.9 | Local database integration and concurrency tests      | Unlicense  |
| YAML         |   2.9.0 | Atlas seed parsing                                    | ISC        |

The worker health endpoint uses the Python standard library. Docling and both OpenAI SDKs are intentionally deferred to their implementation milestones.

## Toolchain and test dependencies

| Dependency                  |          Version |
| --------------------------- | ---------------: |
| Node.js                     |          24.14.0 |
| pnpm                        |          11.11.0 |
| Turborepo                   |           2.10.4 |
| TypeScript                  |            6.0.3 |
| ESLint / eslint-config-next | 9.39.4 / 16.2.10 |
| Prettier                    |            3.9.5 |
| Vitest                      |           4.1.10 |
| Playwright                  |           1.61.1 |
| Supabase CLI                |          2.109.1 |
| Drizzle Kit                 |          0.31.10 |
| tsx                         |           4.23.0 |
| Python                      |          3.12.13 |
| uv                          |          0.11.28 |
| Pytest                      |            9.1.1 |
| Ruff                        |          0.15.21 |
| mypy                        |            2.2.0 |

TypeScript 7.0.2 and ESLint 10.6.0 were current but are not yet supported by the parser/plugins bundled with `eslint-config-next` 16.2.10. TypeScript 6.0.3 and ESLint 9.39.4 are therefore the newest compatible stable releases and remain pinned until the Next.js lint stack supports the newer majors.

CI runs production dependency auditing and Dependabot tracks npm, Python, and GitHub Actions updates. A complete transitive license report is generated before the v0.1 release gate.

CI action releases were also checked on 2026-07-10 and pinned exactly: checkout 7.0.0, setup-node 6.4.0, setup-python 6.3.0, pnpm/action-setup 6.0.9, setup-uv 8.3.2, and gitleaks-action 3.0.0.

The lockfile overrides Next.js's transitive PostCSS release to 8.5.16 to address GHSA-qx2v-qp2m-jg93 while remaining within PostCSS 8 compatibility.
