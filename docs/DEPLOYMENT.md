# Deployment checklist

## Managed v0.1 profile

- Web: Vercel-compatible Next.js deployment.
- Database, Auth, private Storage, and `pgmq`: managed Supabase project.
- Worker: OCI container host with outbound access to Supabase and bounded CPU/RAM.
- AI: disabled by default; enable only with explicit provider credentials and reviewed model configuration.
- Observability: metadata-only product telemetry is opt-in; Langfuse remains optional and must not block workflows.

The repository also includes `apps/web/Dockerfile`, `services/ingest-worker/Dockerfile`, and `docker-compose.production.yml` for a provider-neutral OCI deployment. The compose file expects a production-only `.env.production` file and an already-provisioned managed Supabase project; it does not create or expose a database.

## Release sequence

1. Build from a tagged commit with Node 24.14, pnpm 11.11, Python 3.12, and uv 0.11.28.
2. Run `pnpm install --frozen-lockfile`, `uv sync --project services/ingest-worker --frozen`, `pnpm db:generate`, and verify migrations are unchanged.
3. Run `pnpm citation:check`, `pnpm eval:golden`, `pnpm test:db`, `pnpm verify`, and the critical Playwright suite.
4. Apply migrations to staging and complete the backup/restore rehearsal.
5. Deploy the web app with browser-safe Supabase public credentials only. Keep service-role and OpenAI credentials server/worker-only.
6. Deploy the worker with `WORKER_PROCESS_JOBS=false`, verify `/healthz`, then enable processing after queue and storage checks pass.
7. Check CSP/security headers, queue metrics, ingestion duration/failure counts, search latency, and Ask Atlas citation integrity.

For a container host, run `docker compose --env-file .env.production -f docker-compose.production.yml up -d --build`, then verify `http://127.0.0.1:3000/api/health` and `http://127.0.0.1:8091/healthz` through the host's private network or reverse proxy. The web service receives only public Supabase settings; the worker receives the service-role and database settings.

## Rollback

Keep the previous web deployment available. Disable worker processing first, roll back the web deployment, and only roll back database migrations when a tested reversible migration exists. Never delete source files, source versions, segments, audit events, or canonical revisions during rollback.
