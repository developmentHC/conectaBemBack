# Codex Guide - conecta-bem/api

Read `../AGENTS.md` when a task may touch the frontend contract, generated clients,
auth flow, CORS, webhooks, or local runtime ports.

## Current Stack

- Runtime/package manager: Node.js 20 with `npm`.
- Module system: ES modules using `.mjs`.
- HTTP framework: Express 4 with `cookie-parser`, `cors`, and JSON middleware.
- Database: MongoDB via Mongoose.
- Auth: email OTP plus JWT access tokens.
- Realtime/messages: Socket.IO-related dependencies and message watcher code.
- Documentation: `swagger-autogen`, serving `/docs` and `/swagger-output.json`.
- Tests: Vitest is the default `npm test`; Jest is still available through
  `npm run test:jest`.
- Default local port: API `3000`; local MongoDB Compose exposes `27017`.

## Source Map

- `src/index.mjs` starts Express, connects MongoDB, serves docs, and starts watchers.
- `src/routes/index.mjs` registers all API routes and CORS options.
- `src/controller/**` contains request handlers grouped by domain.
- `src/services/**` contains business logic extracted from controllers.
- `src/models/**` contains Mongoose schemas and model exports.
- `src/middleware/**` handles auth, uploads, validation, and error handling.
- `src/lib/**` contains shared infrastructure such as DB and webhook helpers.
- `src/utils/**` contains small helpers such as OTP, email, errors, regex escaping,
  and sample data.
- `src/watchers/**` contains background watcher behavior.
- `src/tests/**` contains unit and controller tests.
- `scripts/seedTestUsers.mjs` seeds QA users for OTP bypass testing.

## Commands

```bash
npm install
npm run dev
npm start
npm run lint
npm run lint:fix
npm run format
npm test
npm run test:jest
npm run swagger
npm run seed:test-users
docker-compose -f docker-compose.dev.yaml up -d
docker-compose -f docker-compose.dev.yaml down
```

## Architecture Rules

- Keep route registration in `src/routes/index.mjs`; keep handlers in
  `src/controller/**`; move reusable business logic into `src/services/**`.
- API routes are mounted at the root, not under a global `/api` prefix.
- Protected routes should use `authenticateToken`; do not trust client-provided user
  IDs when the token already identifies the user.
- Preserve response contracts used by `web/src/kubb/**` and handwritten frontend API
  calls. If a route path, status code, or payload shape changes, update Swagger and
  coordinate the web client.
- Keep CORS credential behavior aligned with the frontend. Review
  `allowedOrigins` before adding deploy URLs.
- Keep production-only behavior explicit. Test cleanup routes are loaded only outside
  production.
- Do not make external calls or send emails in tests unless they are mocked.

## Files And Generation

- Do not hand-edit `swagger-output.json`; regenerate it with `npm run swagger` or the
  dev/build script.
- Keep `.env.example` complete, but never copy values from local `.env`.
- Use `docker-compose.dev.yaml` for local MongoDB only. The full
  `docker-compose.yaml` builds both apps from remote Git contexts and uses fixed
  container names.
- If changing OTP QA behavior, update code, tests, README, and seed script together.
  Existing code/tests use a 4-digit bypass in several places, so verify before
  relying on README text.

## Validation

- For backend logic changes, run `npm test` or focused Vitest tests plus
  `npm run lint` when feasible.
- For route/schema changes, run `npm run swagger` and check whether `web` needs
  `npm run generate`.
- For auth, upload, webhook, appointment, or message changes, add or update focused
  tests under `src/tests/**`.
