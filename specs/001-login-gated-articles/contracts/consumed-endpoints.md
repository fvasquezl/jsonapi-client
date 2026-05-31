# Consumed API Contract: Login-Gated Articles

This SPA is a pure consumer; it exposes no API of its own. These are the lvPassport
JSON:API v2 endpoints (base `http://localhost/api/v2`) the feature depends on. Headers
for write operations: `Content-Type` and `Accept` = `application/vnd.api+json`.

## Auth

### POST /login
Request: `{ email, password, scopes: ["read", "articles:store", "articles:update", "articles:delete", "comments:store"] }`
Response: `{ token, user: { id, name } }`
Notes: v2 issues read-only tokens by default; the client requests explicit Passport
scopes for the writes it performs. Used by User Story 1 (FR-002).

### POST /logout
Clears the server session; client discards the stored token. (FR-008)

### GET /user
Response: the authenticated user `{ id, name }`. Used by `ensureUser()` to rehydrate
after reload and to validate a stored token. (FR-006, FR-007)

## Articles

### GET /articles (paginated listing)
Query: `page[number]=<n>&page[size]=5&sort=-createdAt&include=authors,categories,comments,comments.author`
Response: `data[]` (articles with included authors/categories/comments/comment-authors),
`meta.page` (`currentPage`, `from`, `to`, `lastPage`, `perPage`, `total`), and
`links` (`first`/`last`/`prev`/`next`). Drives the pager. (FR-009, FR-010, FR-011)

### POST /articles?include=authors,categories
Body: serialized `articles` resource with `categories` and `authors` relationships.
Used to create; on success the client jumps to page 1. (FR-015)

### PATCH /articles/{id}?include=authors,categories
`{id}` is the article slug (the original id before any title-driven slug change).
Updates the article; response omits comments, so the client preserves the loaded
ones. (FR-013)

### DELETE /articles/{id}
Removes the article; client reloads the current page (stepping back if it was the
last row on a page > 1). Requires confirmation in the UI. (FR-014)

## Comments

### POST /comments?include=author
Body: serialized `comments` resource declaring `author` (type `authors`, the
signed-in user) and `article` (type `articles`, the target). Server enforces
ownership — the declared author must be the authenticated user. Response (with
included author) is appended under the article. (FR-016)

## Resource type expectations

- `articles`: `title`, `slug`, `content` + relationships `authors`, `categories`, `comments`
- `categories`: `name`
- `authors`: `name` (alias of the `user` relationship)
- `comments`: `body` + relationships `author`, `article`
