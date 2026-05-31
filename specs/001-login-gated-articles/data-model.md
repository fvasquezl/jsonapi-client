# Data Model: Login-Gated Articles

Client-side view of the data this feature handles. These mirror `src/types.ts`;
shapes come from the JSON:API responses after `jsonapi-fractal` deserialization
(camelCased) and from the auth endpoints.

## AuthUser

The signed-in person.

| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID; used as the `authors` relationship id when posting comments/articles |
| name | string | Shown in the header; attributed on comments |

Source: `POST /login` response (`res.data.user`) and `GET /user`.

## Session (not a resource — client state)

| Aspect | Value |
|--------|-------|
| token | Passport bearer token, stored in `localStorage` under `api_token` |
| header | Sent as `Authorization: Bearer <token>` on every axios request |
| isAuthenticated | Derived: `token !== null` |
| lifecycle | Set on login; cleared on logout or when a stored token is rejected by `GET /user` |

## Article

| Field | Type | Notes |
|-------|------|-------|
| id | string | The **slug** (not a numeric id); can change when the title changes on edit |
| title | string | Required |
| slug | string | Derived from title via `slugify` on create; editable independently on edit |
| content | string | Required |
| categories | `{ id, name? }` \| null | BelongsTo a category (singular relationship, plural type) |
| authors | `{ id, name? }` \| null | BelongsTo the author user (API exposes `authors` as alias of `user`) |
| comments | Comment[] | Loaded via include; preserved across an edit (PATCH omits them) |

## Category

| Field | Type | Notes |
|-------|------|-------|
| id | string | Slug |
| name | string | Shown in the create/edit category selector |

## Comment

| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| body | string | Required; blank submissions ignored |
| createdAt | string? | |
| author | `{ id, name? }` \| null | Must be the signed-in user (ownership enforced server-side) |

## PageMeta (pagination)

From the listing response's `meta.page` block; drives the pager.

| Field | Type | Notes |
|-------|------|-------|
| currentPage | number | 1-based |
| from | number | Index of first row on the page |
| to | number | Index of last row on the page |
| lastPage | number | Total number of pages |
| perPage | number | Fixed at 5 (PAGE_SIZE) |
| total | number | Total articles in the catalog |

## Relationships

```text
AuthUser 1 ──< Article (authors)
Category 1 ──< Article (categories)
Article  1 ──< Comment  (comments)
AuthUser 1 ──< Comment  (author)
```
