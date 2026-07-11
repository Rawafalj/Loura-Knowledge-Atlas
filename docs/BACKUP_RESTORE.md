# Backup and restore runbook

Supabase is the system of record. Enable the managed project's daily backups and point-in-time recovery before production use. Keep a retention period appropriate for workspace sensitivity and test a restore into an isolated project before every release.

## Backup rehearsal

1. Create a disposable Supabase project or local stack.
2. Apply committed migrations in order with `pnpm db:migrate` (or `pnpm db:seed` for a clean local rehearsal).
3. Run `pnpm test:db` and the seed validator.
4. Compare table, policy, function, extension, and storage-bucket inventories with the source project.
5. Record the migration commit, database version, and verification output in the release record.

## Restore procedure

1. Stop ingestion workers and disable writes at the web edge.
2. Restore the selected Supabase backup/PITR timestamp into an isolated project first.
3. Run `pnpm test:db` against the restored database and inspect RLS policies before opening access.
4. Verify private storage objects and source-version/segment counts; source files and parsed versions must remain immutable.
5. Rotate service-role, database, and storage credentials if the incident involved credential exposure.
6. Update web and worker environment configuration to the restored project, restart workers, and replay only durable queue messages that were not archived.
7. Record the restore timestamp, operator, migration commit, and validation evidence.

Never use a production backup as a local fixture, and never print database URLs, service-role keys, source text, prompts, or raw model output in a restore log.
