# AGENTS.md — new-api

## What this repo is

- Go backend (`github.com/QuantumNous/new-api`) focused on API, dashboard, relay, and video services.
- Backend stack: Gin + GORM + SQLite/MySQL/PostgreSQL + Redis.
- Default frontend: React 19 + TypeScript + Rsbuild + TanStack Router + React Query + Zustand + Tailwind; deployed independently from the backend.
- Classic frontend: React 18 + Vite + Semi Design; legacy frontend kept for compatibility.

## Architecture that matters

- Request flow is layered: `router -> controller -> service -> model`.
- Relay/provider adapters live under `relay/channel/*`; the adaptor factory is in `relay/relay_adaptor.go`.
- The backend no longer serves embedded frontend assets; `web/default` and `web/classic` are built and deployed independently.
- `router/main.go` wires API, dashboard, relay, and video route groups for the backend service.
- Production deployment is split: backend container + independently hosted frontend, with `aiplat-postgresql` as the standard database service in Compose-based setups.
- `constant/` is dependency-isolated: it may use stdlib only, must not import project packages, and must not contain business logic.

## Commands agents should use

### Backend

- Run locally: `go run main.go`
- Run tests: `go test ./...`
- Build binary with version: `go build -ldflags "-s -w -X 'github.com/QuantumNous/new-api/common.Version=$(cat VERSION)'" -o new-api`

### Default frontend (`web/default`)

- Install deps: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build`
- Typecheck: `bun run typecheck`
- Lint: `bun run lint`
- Format check: `bun run format:check`
- i18n sync: `bun run i18n:sync`
- Full strict build check: `bun run build:check`

### Classic frontend (`web/classic`)

- Install deps: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build`

### Local full-stack dev

- Development uses three separate pieces: local backend, local frontend, and external PostgreSQL.
- Start development PostgreSQL: `docker compose -f docker-compose.dev.yml up -d`
- Run the backend locally against that external PostgreSQL via `SQL_DSN` in `.env` or process env.
- Default frontend runs separately on Rsbuild dev server; configure `VITE_API_BASE_URL` when needed, or use the local proxy for `/api`, `/mj`, and `/pg` to `http://localhost:3000`.
- Handy shortcut targets in `makefile`: `dev-api`, `dev-web`, `dev-web-classic`, `reset-setup`.

## Build and verification order

- If you change Go code only: run `go test ./...` for the affected scope at minimum.
- If you change `web/default`: run `bun run typecheck` and `bun run lint`; use `bun run build:check` when build-sensitive.
- Backend builds are independent from frontend builds now; you do not need frontend `dist` output to build or ship the Go backend binary.
- When preparing a separated deployment release, verify backend and frontend artifacts independently.
- CI does not run Go tests for you. Do not assume backend changes are verified unless you ran `go test ./...` yourself.

## Non-obvious project rules

### JSON

- In business code, do not call `encoding/json` marshal/unmarshal directly.
- Use wrappers from `common/json.go`: `common.Marshal`, `common.Unmarshal`, `common.UnmarshalJsonStr`, `common.DecodeJson`, `common.GetJsonType`.

### Database compatibility

- All DB changes must work on SQLite, MySQL >= 5.7.8, and PostgreSQL >= 9.6.
- Prefer GORM abstractions over raw SQL.
- If raw SQL is unavoidable, use helpers from `model/main.go` such as `commonGroupCol`, `commonKeyCol`, `commonTrueVal`, and `commonFalseVal`.
- Avoid engine-specific features without a fallback. In particular, SQLite does not support `ALTER COLUMN`.

### Relay / provider work

- When adding or updating a provider/channel, verify whether it supports `StreamOptions` and add it to `streamSupportedChannels` if it does.
- For request DTOs that are parsed from client JSON and then re-marshaled upstream, optional scalar fields must be pointer types with `omitempty`. This preserves explicit zero/false values.

### Billing expressions

- Any work on tiered or dynamic billing must start by reading `pkg/billingexpr/expr.md`.

### Constants package

- `constant/` is for reusable constants only.
- Do not add business logic, DB access, or third-party/service calls there.
- If you add a new constants file or type, update `constant/README.md`.

## Frontend-specific conventions worth knowing

- There is a deeper frontend guide at `web/default/AGENTS.md`; read it before non-trivial `web/default` work.
- All user-facing strings must go through i18n. Default frontend locales live in `web/default/src/i18n/locales/{en,zh,fr,ru,ja,vi}.json`.
- After adding or changing translation keys, run `bun run i18n:sync` in `web/default`.
- Default frontend routing is file-based TanStack Router using `createFileRoute` in `web/default/src/routes`.
- Shared frontend error handling goes through `handleServerError`.
- `web/default/eslint.config.js` enforces `no-console` and `@typescript-eslint/consistent-type-imports`; use `import type` where appropriate.
- `src/components/ui` is shadcn-generated code and is ignored by ESLint; prefer matching its existing patterns instead of reformatting it manually.
- shadcn config is in `web/default/components.json` (`style: base-nova`, `iconLibrary: hugeicons`, registry `@ai-elements`).

## Environment and runtime quirks

- Backend loads `.env` if present, then falls back gracefully to process env; see `.env.example` for supported variables.
- Frontend env loading uses `VITE_` prefixes; `VITE_API_BASE_URL` is required when the frontend is hosted separately from the backend origin.
- `GIN_MODE=debug` is the switch for Gin debug mode.
- `FRONTEND_BASE_URL` is a legacy compatibility setting and should not be treated as the standard separated-deployment frontend configuration path.

## Protected project information

- Do not remove or replace references to `new-api` or `QuantumNous` in branding, attribution, module paths, legal notices, metadata, or UI footer/about/legal locations.

## PR / contribution workflow

- `.github/workflows/pr-check.yml` enforces the PR template and rejects obvious AI-slop submissions.
- If asked to prepare a PR, make sure the description is human-quality and follows the repository template/checklist.
