# Phorva production Neon migration

## What changed

- Production dynamic requests use a PostgreSQL transaction against `phorva.app_state`.
- The row is locked with `SELECT ... FOR UPDATE` for the request, preventing two Vercel instances from overwriting each other's JSON state concurrently.
- Existing synchronous store functions continue to work inside the request transaction; local tests/development continue using the JSON file.
- The JSON importer is deliberately non-destructive by default. It refuses to overwrite a row that already exists.

## Safe migration order

1. Keep the current production deployment in place until the source data has been imported.
2. In the Termux repository, confirm `data/phorva.json` exists and make a private backup.
3. Add `scripts/import-json-to-neon.js` from this patch to the repository.
4. Pull Vercel production environment variables to a local ignored file: `vercel env pull .env.production.local`.
5. Run `node scripts/import-json-to-neon.js` from the repository root. Review the record counts; do not use `--replace` unless intentionally replacing an existing state row.
6. Verify the `phorva.app_state` row exists and has the expected record counts before deploying the runtime changes.
7. Run the project test suite and syntax checks, then deploy.
8. Test `/health`, developer login, project listing, agent listing, API-key authentication, verification, execution logs, and alerts.

`.env.production.local` and the JSON database contain sensitive data and must never be committed or attached to a chat.
