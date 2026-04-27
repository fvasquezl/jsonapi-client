# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`vue-tsc -b`, project references) and produce a production bundle.
- `npm run preview` — serve the built bundle locally.

There is no test or lint script configured. Type errors are surfaced through `vue-tsc` during `build`; running `npx vue-tsc -b` is the fastest way to type-check without bundling.

## Architecture

Vue 3 + TypeScript SPA scaffolded with Vite. Entry chain: `index.html` → `src/main.ts` (creates the app and mounts `#app`) → `src/App.vue`.

The app's purpose is to consume a JSON:API backend. `App.vue` fetches `http://localhost/api/v1/articles` on the `created` hook and pipes the response through `jsonapi-fractal`'s `deserialize` to flatten the JSON:API document (data + included relationships) into plain objects before rendering. The hard-coded localhost URL is the integration point with whatever JSON:API server is being developed alongside this client.

TypeScript uses project references: `tsconfig.app.json` covers `src/**` and extends `@vue/tsconfig/tsconfig.dom.json`; `tsconfig.node.json` covers Vite config files. `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are on, so dead identifiers and non-erasable TS syntax (enums, namespaces, parameter properties) will fail the build.

## Notes for edits to `App.vue`

The current `App.vue` uses Options API in a plain `<script>` block and calls `require('jsonapi-fractal')`. That's inconsistent with the rest of the toolchain (ESM-only Vite, `"type": "module"` in `package.json`) and will not work once the file is actually exercised — `require` is not defined in the browser bundle. When touching this file, convert to `<script setup lang="ts">` with `import { deserialize, CaseType } from 'jsonapi-fractal'`.
