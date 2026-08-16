# EnLive Deployment Guide

This project deploys to Vercel from GitHub. The old VPS scripts are retained only for legacy/self-hosted use.

## Development Workflow

1. Make sure local environment variables are available in `.env.local`.

```bash
DATABASE_URL=postgresql://user:pass@host:5432/enlive
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENLIVE_SESSION_SECRET=<32+ character local secret>
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

2. Install dependencies.

```bash
npm install
```

3. Apply local database migrations.

```bash
npm run db:migrate
```

4. Start the local dev server.

```bash
npm run dev
```

5. Before pushing, run a production build locally when practical.

```bash
npm run build
```

Use `npm run db:setup` only when setting up a fresh local database and intentionally seeding demo data. Do not seed production unless that is explicitly intended.

## Git Workflow

1. Check the worktree before starting.

```bash
git status --short
```

2. Make focused changes and keep unrelated local files out of the commit.

3. Review the diff before staging.

```bash
git diff
```

4. Stage only the files that belong to the change.

```bash
git add <files>
```

5. Commit with a short imperative message.

```bash
git commit -m "Describe the change"
```

6. Push to the connected branch.

```bash
git push origin main
```

Pushing to `main` triggers the production Vercel workflow when the repository is connected to Vercel. Branches and pull requests may create Vercel preview deployments depending on the project settings.

## Vercel Workflow

Vercel uses [vercel.json](./vercel.json).

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run vercel-build"
}
```

The Vercel build command is defined in [package.json](./package.json):

```bash
npm run db:migrate && next build
```

Required Vercel environment variables:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/enlive
NEXT_PUBLIC_APP_URL=https://enlive.app
ENLIVE_SESSION_SECRET=<32+ character production secret>
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

`DATABASE_URL` must be available during both build time and runtime because migrations run during the Vercel build and API routes use the database at runtime. `ENLIVE_SESSION_SECRET` is required in production for signed session cookies.

To inspect a deployment:

1. Open the Vercel project dashboard.
2. Check the latest deployment for the pushed commit.
3. Review build logs first if deployment fails.
4. Review runtime logs if the deployment succeeds but an API route fails.

## Database Migration Workflow

Migrations live in [db/migrations](./db/migrations). They are applied by [scripts/migrate-db.mjs](./scripts/migrate-db.mjs).

The migration script:

- loads `DATABASE_URL` from the environment, or from `.env.local` when running locally;
- creates `schema_migrations` if needed;
- skips migration files already recorded in `schema_migrations`;
- applies pending migrations inside a transaction;
- records each applied migration by filename.

Normal production path:

```bash
git push origin main
```

Vercel then runs:

```bash
npm run vercel-build
```

Manual migration path, only when needed:

```bash
npm run db:migrate
```

Migration rules:

- Prefer additive, backward-compatible migrations.
- Never edit a migration that has already run in production unless you are deliberately repairing a failed deployment and understand the database state.
- For new schema changes, add a new numbered migration file.
- Keep application code tolerant of old and new schema during the deployment window when possible.
- Avoid destructive changes without a rollback plan and a database backup.

## Rollback Procedure

If a deployment fails during the Vercel build:

1. Open the failed deployment logs in Vercel.
2. Identify whether the failure happened during `npm run db:migrate` or `next build`.
3. Fix the issue locally.
4. Run:

```bash
npm run build
```

5. Commit and push the fix.

If a deployment succeeds but the live app is broken:

1. Open the Vercel deployment list.
2. Promote the previous known-good deployment using Vercel's rollback/redeploy controls.
3. Check runtime logs for the broken deployment.
4. Fix forward in a new commit.

If the broken deployment included a database migration:

1. Do not assume rolling back code also rolls back the database.
2. Check which migrations were applied in `schema_migrations`.
3. If the migration was additive, prefer a code rollback or a fix-forward deployment.
4. If the migration was destructive or incompatible, restore from a database backup or apply a deliberate corrective migration.
5. After database recovery, redeploy the matching known-good commit.

Fast production recovery order:

1. Roll back the Vercel deployment to restore traffic.
2. Confirm the live site responds.
3. Inspect logs and database state.
4. Prepare a fix-forward commit.
5. Push and verify the new Vercel deployment.
