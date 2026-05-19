# Verification Report

> This template is used by the OpenSpec test gate workflow.
> Copy to `openspec/changes/<name>/verification-report.md` and fill in results.

## Change Information
- **Change**: <name>
- **Schema**: spec-driven
- **Date**: YYYY-MM-DD
- **Verifier**: <developer name or "automated">

## Change Type Assessment

Check all that apply based on the files actually changed:

- [ ] Documentation/comment changes (README, docs, comments, i18n JSON)
- [ ] Internal logic changes (service/, relay/common/, pkg/, dto/, common/)
- [ ] API/auth/routing changes (router/, controller/, middleware/)
- [ ] Database/model changes (model/, migration, SQL)
- [ ] Frontend UI (default) changes (web/default/src/)
- [ ] Relay/provider adapter changes (relay/channel/*)
- [ ] Release/packaging changes (Dockerfile, docker-compose*, release config)

## Hard Gates

These MUST all pass. Any FAIL blocks verify/archive.

| # | Gate | Command | Result | Evidence |
|---|------|---------|--------|----------|
| 1 | Go vet | `go vet ./...` | PASS/FAIL/SKIP | (output or skip reason) |
| 2 | Go test | `go test ./...` | PASS/FAIL/SKIP | (output or skip reason) |
| 3 | Frontend lint (default) | `cd web/default && bun run lint` | PASS/FAIL/SKIP | (output or skip reason) |
| 4 | Frontend typecheck (default) | `cd web/default && bun run typecheck` | PASS/FAIL/SKIP | (output or skip reason) |
| 5 | Frontend build (default) | `cd web/default && bun run build` | PASS/FAIL/SKIP | (output or skip reason) |

### Hard Gate Rules by Change Type

| Change Type | Go vet | Go test | FE lint | FE typecheck | FE build |
|-------------|--------|---------|---------|--------------|----------|
| Documentation | SKIP | SKIP | SKIP | SKIP | SKIP |
| Internal logic | REQUIRED | REQUIRED | SKIP | SKIP | SKIP |
| API/auth/routing | REQUIRED | REQUIRED | SKIP | SKIP | REQUIRED |
| Database/model | REQUIRED | REQUIRED | SKIP | SKIP | SKIP |
| Frontend (default) | SKIP | SKIP | REQUIRED | REQUIRED | REQUIRED |
| Relay/provider | REQUIRED | REQUIRED | SKIP | SKIP | SKIP |
| Release/packaging | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |

**Hard Gate Verdict**: PASS / FAIL

## Soft Gates

These WARN but do not block. Record reason if failing.

| # | Gate | Command | Result | Notes |
|---|------|---------|--------|-------|
| 1 | Format check | `cd web/default && bun run format:check` | PASS/WARN/SKIP | |
| 2 | i18n sync | `cd web/default && bun run i18n:sync` | PASS/WARN/SKIP | |
| 3 | Copyright check | `cd web/default && bun run copyright:check` | PASS/WARN/SKIP | |

## Skipped Items

List any gates that were skipped and the reason:

| # | Item | Reason |
|---|------|--------|
| 1 | (e.g., FE build) | (e.g., No frontend changes) |

## Release Prerequisites

- [ ] All hard gates PASS
- [ ] Soft gate warnings documented above
- [ ] Manual testing completed (describe scope below)
- [ ] Change type assessment accurate

### Manual Testing Notes
(Describe what was manually tested and results)
