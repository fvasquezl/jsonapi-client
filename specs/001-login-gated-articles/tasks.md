---
description: "Task list for Login-Gated Articles"
---

# Tasks: Login-Gated Articles

**Input**: Design documents from `/specs/001-login-gated-articles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated test runner is configured in this repo (type-check via `vue-tsc` is the gate); no test tasks are generated. See `quickstart.md` for the manual acceptance walkthrough.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

> **RETROACTIVE**: This feature already shipped in commit `53e73bc`. All tasks are
> marked complete `[x]` and reference the file that satisfied them. The list records
> the work as if planned, for traceability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Routing dependency and shared types

- [x] T001 Add `vue-router@4` to dependencies in `package.json` / `package-lock.json`
- [x] T002 [P] Define shared interfaces (`Article`, `Comment`, `Category`, `AuthUser`, `PageMeta`) in `src/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth state, router, and app shell that every user story depends on

**⚠️ CRITICAL**: No user story works until this phase is complete

- [x] T003 Create the `useAuth` composable (module-level singleton `token`/`user`, axios `baseURL` + Bearer header, `login`/`logout`/`ensureUser`) in `src/composables/useAuth.ts`
- [x] T004 Define routes `/login`, `/articles`, and `/` → `/articles`, with a `beforeEach` auth guard, in `src/router/index.ts`
- [x] T005 [P] Reduce `src/App.vue` to a `<router-view/>` shell
- [x] T006 Register the router on the app in `src/main.ts`

**Checkpoint**: Routing + auth singleton ready — user stories can proceed

---

## Phase 3: User Story 1 - Sign in before seeing content (Priority: P1) 🎯 MVP

**Goal**: A dedicated login page gates all article content; auth state drives redirects and survives reload.

**Independent Test**: Signed out → land on `/login`, no articles; valid login → `/articles`; invalid login → stay with error; reload while signed in → stay signed in; `/articles` while signed out → redirect to `/login`; `/login` while signed in → redirect to `/articles`.

### Implementation for User Story 1

- [x] T007 [US1] Build the login page (credential form, error display, redirect to `/articles` on success) in `src/views/LoginView.vue`
- [x] T008 [US1] Enforce the gate in the guard: redirect signed-out → `/login` for `meta.requiresAuth`, and signed-in → `/articles` from `/login`, in `src/router/index.ts` (FR-004, FR-005)
- [x] T009 [US1] Implement session persistence + rehydration: store token in `localStorage`, init from it, `ensureUser()` fetches `/user` once and clears an invalid token, in `src/composables/useAuth.ts` (FR-006, FR-007)
- [x] T010 [US1] Add sign-out (POST `/logout`, clear token, return to `/login`) wired from `src/views/ArticlesView.vue` via `useAuth.logout` (FR-008)

**Checkpoint**: Gate fully functional and testable on its own

---

## Phase 4: User Story 2 - Browse articles page by page (Priority: P2)

**Goal**: Articles list paginated 5/page, newest first, with prev/next and page/total indicators.

**Independent Test**: With >5 articles, see 5 newest-first plus a pager ("Página X de Y" + total); Next/Previous change the page; Previous disabled on page 1, Next on last.

### Implementation for User Story 2

- [x] T011 [US2] Implement `loadArticles(pageNumber)` requesting `page[number]`/`page[size]=5` + `sort=-createdAt` + includes, deserializing data and reading `meta.page` into a `PageMeta` ref, in `src/views/ArticlesView.vue` (FR-009)
- [x] T012 [US2] Render the pager (prev/next buttons, "Página X de Y", total count) with first/last-page disabling, shown only when `lastPage > 1`, in `src/views/ArticlesView.vue` (FR-010, FR-011)

**Checkpoint**: Listing + pagination work independently for a signed-in user

---

## Phase 5: User Story 3 - Act on an article (edit, delete, comment) (Priority: P2)

**Goal**: Per-article edit, delete, and comment controls, plus article creation, keep the visible page consistent.

**Independent Test**: Edit reflects in the list (comments preserved); delete removes the row (steps back an emptied page); comment appears attributed to the user; create lands on page 1.

### Implementation for User Story 3

- [x] T013 [US3] Load categories for the form selector (`GET /categories`) in `src/views/ArticlesView.vue`
- [x] T014 [US3] Build the create/edit form with title→slug derivation and JSON:API serialize payload (`categories`/`authors` relationships) in `src/views/ArticlesView.vue`
- [x] T015 [US3] Implement `saveArticle` — create (POST, then jump to page 1) and edit (PATCH by original slug id, replace row, preserve comments) in `src/views/ArticlesView.vue` (FR-013, FR-015)
- [x] T016 [US3] Implement `deleteArticle` with confirm + remove, stepping back a page when the last row on a page > 1 is removed, in `src/views/ArticlesView.vue` (FR-014)
- [x] T017 [US3] Implement `addComment` (serialize `comments` with `author`/`article` relationships, ownership = signed-in user, append included author, ignore blank) in `src/views/ArticlesView.vue` (FR-016)

**Checkpoint**: All article actions functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T018 [P] Update `CLAUDE.md` Architecture section to describe the router + `useAuth` composable + pagination
- [x] T019 Verify type safety with `npx vue-tsc -b` and a production `npm run build`
- [x] T020 Run the `quickstart.md` manual acceptance walkthrough against the running app

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (the guard and `useAuth` underpin every story).
- **User Stories (Phase 3+)**: Depend on Foundational. US1 is the gate and is the natural MVP; US2 and US3 both live in `ArticlesView` and are reachable only once US1's gate lets a user in.
- **Polish (Phase 6)**: After the desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. Independent.
- **US2 (P2)**: After Foundational. Independent of US3, but only reachable behind US1's gate at runtime.
- **US3 (P2)**: After Foundational. Shares `ArticlesView` with US2 but its actions are independently testable.

### Within Each User Story

- Setup/foundational files before story-specific behavior.
- US2 and US3 both edit `src/views/ArticlesView.vue`, so their tasks are largely sequential within that file (few [P]).

## Parallel Opportunities

- T002 (`types.ts`) parallel with T001.
- T005 (`App.vue` shell) parallel with other foundational work.
- T018 (docs) parallel with other polish.
- Most US2/US3 tasks touch the same `ArticlesView.vue` file → not parallel.

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 (the gate). At this point the
   app requires login and routes correctly — a demoable MVP even before pagination/actions.

### Incremental Delivery

US1 (gate) → US2 (paginated listing) → US3 (article actions). Each adds value without
breaking the previous.

## Notes

- Retroactive: all tasks delivered together in commit `53e73bc`; checkboxes reflect that.
- No test tasks — repo has no test runner; `vue-tsc` type-check is the safety gate.
- US2 and US3 concentrate in `ArticlesView.vue` by design (one route-level view owns the list).
