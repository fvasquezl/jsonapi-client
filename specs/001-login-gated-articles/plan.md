# Implementation Plan: Login-Gated Articles

**Branch**: `001-login-gated-articles` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-login-gated-articles/spec.md`

**Note**: Retroactive plan — it documents the design already shipped in commit `53e73bc`. The implementation exists; this plan records the chosen approach so `/speckit-tasks` and future work share the same map.

## Summary

Gate the SPA behind a dedicated login page and show articles paginated (5/page,
newest first) with per-article edit/delete/comment controls. Approach: introduce
vue-router with two pages (`/login`, `/articles`) and a navigation guard that
enforces auth; keep shared auth state (`token`, `user`) in a module-level `useAuth`
composable (singleton, no Pinia) that also restores the session on reload; drive
pagination from the JSON:API listing's `meta.page` block.

## Technical Context

**Language/Version**: TypeScript 6.x, Vue 3.5 (`<script setup>` SFCs)

**Primary Dependencies**: vue-router 4, axios, jsonapi-fractal (serialize/deserialize), slugify

**Storage**: `localStorage` for the bearer token; no client-side database. Data comes from the lvPassport JSON:API at `http://localhost/api/v2`.

**Testing**: None configured. Type safety is the gate — `vue-tsc -b` (via `npm run build`) must pass; no unit/e2e runner in the repo.

**Target Platform**: Modern browser SPA served by Vite.

**Project Type**: Single-package frontend SPA (Vite).

**Performance Goals**: Standard SPA responsiveness; page size fixed at 5 keeps each listing request small.

**Constraints**: Must keep consuming the existing v2 contract (resource types `articles`/`categories`/`authors`/`comments`, explicit Passport scopes at login, ownership-enforced comments). No new backend changes — the API already exposes `PagePagination` on `articles`.

**Scale/Scope**: ~6 source files (1 composable, 1 router, 2 views, types, entry); catalog in the tens of articles today, paginated so it scales.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unfilled template
with no ratified principles, so there are no gates to enforce. No violations. The
design stays deliberately simple (no Pinia, no extra abstraction layers), consistent
with the repo's existing lightweight conventions.

## Project Structure

### Documentation (this feature)

```text
specs/001-login-gated-articles/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (consumed JSON:API endpoints)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── main.ts                   # Creates the app, registers the router, mounts #app
├── App.vue                   # Shell — renders <router-view/>
├── types.ts                  # Shared interfaces: Article, Comment, Category, AuthUser, PageMeta
├── composables/
│   └── useAuth.ts            # Singleton auth state + axios baseURL/Bearer; login/logout/ensureUser
├── router/
│   └── index.ts             # Routes (/login, /articles, / → /articles) + beforeEach auth guard
└── views/
    ├── LoginView.vue         # /login — credential form, redirect on success
    └── ArticlesView.vue      # /articles — paginated list + create/edit form + delete + comments
```

**Structure Decision**: Single frontend package. Routing splits the former monolithic
`App.vue` into two route-level views; cross-cutting auth state is extracted to a
composable so the router guard, both views, and reload-time rehydration all share one
source of truth without a store library.

## Complexity Tracking

> No constitution violations — section intentionally empty.
