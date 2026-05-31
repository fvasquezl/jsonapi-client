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

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->