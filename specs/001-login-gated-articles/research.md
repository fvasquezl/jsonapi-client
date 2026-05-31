# Research: Login-Gated Articles

Retroactive — records the decisions behind the shipped implementation (`53e73bc`).
No NEEDS CLARIFICATION remained from the spec.

## Decision 1 — Routing: vue-router pages vs conditional rendering

- **Decision**: Use vue-router 4 with real `/login` and `/articles` pages plus a
  `beforeEach` guard.
- **Rationale**: The user explicitly chose "páginas reales" over a single-component
  conditional gate. Real routes give addressable, bookmarkable pages and a clean
  place to enforce auth (one guard) as the app grows.
- **Alternatives considered**: Conditional render in `App.vue`
  (`<LoginView v-if="!auth"/> <ArticlesView v-else/>`) — simpler and dependency-free,
  but no URLs and no central guard; rejected per the user's choice.

## Decision 2 — Shared auth state: composable singleton vs Pinia

- **Decision**: Module-level refs in `useAuth.ts` (a singleton composable).
- **Rationale**: Auth state must be shared by the router guard (outside any
  component), both views, and reload-time rehydration. Module-scoped refs are a
  singleton across all importers — enough for one `token`/`user` pair without adding
  a store dependency. Keeps the repo's "no Pinia/Vuex" convention.
- **Alternatives considered**: Pinia (overkill for two fields, new dependency);
  prop-drilling from `App.vue` (impossible — the guard runs outside the component
  tree).

## Decision 3 — Session persistence & rehydration

- **Decision**: Store the bearer token in `localStorage`; initialize the `token` ref
  from it at module load and set the axios `Authorization` header. `ensureUser()`
  lazily fetches `/user` once when a token exists but `user` is null (i.e. after a
  reload), and clears the token if that fetch fails.
- **Rationale**: Satisfies "session survives reload" (FR-006) and "rejected session
  → signed out" (FR-007) without a refresh-token flow. `isAuthenticated` keys off the
  token so the guard can decide synchronously before the user object is fetched.
- **Alternatives considered**: Fetch `/user` eagerly in the guard (makes navigation
  async and slower); sessionStorage (would not survive a tab reopen).

## Decision 4 — Pagination source of truth

- **Decision**: Request `page[number]`/`page[size]` (size = 5) with
  `sort=-createdAt`, and drive the pager from the response's `meta.page`
  (`currentPage`, `lastPage`, `total`).
- **Rationale**: The v2 `articles` schema enables `PagePagination`, which returns
  exactly this `meta.page` block and `links`. Reading server-reported totals avoids
  guessing page counts client-side.
- **Alternatives considered**: Client-side slicing of a full fetch (does not scale,
  defeats the point); following `links.next`/`links.prev` URLs (works, but page
  numbers give a clearer "page X of Y" pager).

## Decision 5 — List freshness after mutations

- **Decision**: After create, reload page 1 (newest sort puts it there); after
  delete, reload the current page, stepping back one page if the deleted row was the
  last on a page beyond the first; after edit, replace the row in place (preserving
  already-loaded comments, since the PATCH response omits them).
- **Rationale**: Keeps the visible page consistent with server order/counts while
  avoiding a jarring jump on edits. Matches FR-013/014/015.
- **Alternatives considered**: Always reload page 1 on any mutation (loses the user's
  place); fully client-side optimistic updates (more code, risks drift from server
  pagination/order).

## Decision 6 — Query string encoding

- **Decision**: Build the listing URL as a literal string with pre-encoded brackets
  (`page%5Bnumber%5D=…`) and literal commas in `include`.
- **Rationale**: Mirrors the confirmed-working request shape and keeps comma-separated
  includes intact (some param serializers would percent-encode the commas).
- **Alternatives considered**: axios `params` object (encodes brackets fine but may
  encode commas in `include`).
