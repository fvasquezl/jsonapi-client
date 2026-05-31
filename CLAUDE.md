# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`vue-tsc -b`, project references) and produce a production bundle.
- `npm run preview` — serve the built bundle locally.

There is no test or lint script configured. Type errors are surfaced through `vue-tsc` during `build`; running `npx vue-tsc -b` is the fastest way to type-check without bundling.

## Architecture

Vue 3 + TypeScript SPA scaffolded with Vite. Entry chain: `index.html` → `src/main.ts` (creates the app and mounts `#app`) → `src/App.vue`.

The app consumes the **lvPassport JSON:API backend at `http://localhost/api/v2`** (`axios.defaults.baseURL` in `App.vue`). It is a single-view app — no vue-router, no Pinia/Vuex. All state lives as refs/computed in `App.vue`, with axios calls in event handlers. Responses are flattened with `jsonapi-fractal`'s `deserialize`; outgoing create/update payloads are built with `serialize`.

It handles a full article CRUD plus article comments plus auth:
- `POST /login` (sends explicit scopes: `read`, `articles:store`, `articles:update`, `articles:delete`, `comments:store`), token stored in `localStorage` and sent as a Bearer header; `POST /logout` clears it.
- `GET /user`, `GET /categories`, `GET /articles?sort=-createdAt&include=authors,categories,comments,comments.author`.
- `POST` / `PATCH` / `DELETE /articles` for create/edit/delete.
- `POST /comments?include=author` to add a comment to an article.

Expected JSON:API resource types: `articles` (title, slug, content + `authors`/`categories`/`comments` relationships), `categories` (name), `authors` (name), `comments` (body + `author`/`article` relationships). On create, the slug is derived from the title via `slugify`; on edit, the slug is decoupled and editable independently.

Comments are read publicly (loaded nested via the `comments,comments.author` include and held on each article's `comments` array). Adding one requires auth: the API enforces ownership, so the comment payload declares `author` as the logged-in user (type `authors`) and `article` as the target — same pattern as an article's `authors`. Drafts live in a `commentDrafts` ref keyed by article id. Editing an article preserves its already-loaded comments (the article PATCH response does not include them).

TypeScript uses project references: `tsconfig.app.json` covers `src/**` and extends `@vue/tsconfig/tsconfig.dom.json`; `tsconfig.node.json` covers Vite config files. `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are on, so dead identifiers and non-erasable TS syntax (enums, namespaces, parameter properties) will fail the build. Type-check via `npx vue-tsc -b` or the `build` script — there is no test or lint script.

`src/components/HelloWorld.vue` is leftover scaffold and is not imported anywhere.
