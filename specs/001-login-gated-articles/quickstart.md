# Quickstart: Login-Gated Articles

## Prerequisites

- The lvPassport API running at `http://localhost/api/v2` with seeded articles and a
  user you can sign in as.
- Node installed; from `jsonapi-client/`: `npm install` (vue-router is already a dep).

## Run

```bash
npm run dev      # Vite dev server (default http://localhost:5173)
```

## Verify the feature (maps to acceptance scenarios)

1. **Gate** — open the app while signed out → you land on `/login`, no articles shown.
   Visiting `/articles` directly redirects back to `/login`. (Story 1)
2. **Sign in** — submit valid credentials → redirected to `/articles`. Submit invalid
   credentials → stay on `/login` with an error message. (Story 1)
3. **Already signed in** — navigate to `/login` while signed in → redirected to
   `/articles`. (Story 1)
4. **Reload** — refresh on `/articles` → you stay signed in and on the page (session
   restored from the stored token). (Story 1 edge case)
5. **Paginate** — with >5 articles, the list shows 5 newest-first plus a pager
   ("Página X de Y" + total). Next/Previous change the page; Previous is disabled on
   page 1, Next on the last page. (Story 2)
6. **Edit** — click Editar on an article, change it, Actualizar → the row updates in
   place, comments preserved. (Story 3)
7. **Delete** — click Borrar, confirm → the row disappears; deleting the last row on a
   page > 1 steps back a page. (Story 3)
8. **Comment** — type in an article's comment box and submit → it appears under the
   article attributed to you; a blank comment does nothing. (Story 3)
9. **Create** — fill the form and Crear → you land on page 1 where the new article
   appears. (Story 3)
10. **Sign out** — Cerrar sesión → back to `/login`; `/articles` is gated again.

## Type-check

```bash
npx vue-tsc -b      # or: npm run build   (vue-tsc + vite build)
```

## Key files

- `src/composables/useAuth.ts` — session + axios config
- `src/router/index.ts` — routes + auth guard
- `src/views/LoginView.vue` — `/login`
- `src/views/ArticlesView.vue` — `/articles` (list, pager, CRUD, comments)
- `src/types.ts` — shared interfaces
